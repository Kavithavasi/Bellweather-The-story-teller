import "dotenv/config";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_VOICES = new Set(["Kore", "Charon", "Fenrir", "Puck", "Zephyr"]);

const previewCache = new Map<
  string,
  { audioBase64: string; mimeType: string; durationSec: number }
>();

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please check Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function toNaturalSentenceCase(input: string): string {
  const lettersOnly = input.replace(/[^A-Za-z]/g, "");
  const isAllCaps =
    lettersOnly.length > 2 && lettersOnly === lettersOnly.toUpperCase();

  if (!isAllCaps) {
    return input;
  }

  let lower = input.toLowerCase();
  // Capitalize first alphabetic character and starts after . ! ?
  lower = lower.replace(/(^\s*|[.!?]\s+)([a-z])/g, (_, prefix, ch) => {
    return `${prefix}${ch.toUpperCase()}`;
  });
  // Restore pronoun "I" and contractions like "I'm", "I’m", "I'd", "I'll"
  lower = lower.replace(/\bi(['’](?:m|d|ll|ve))?\b/g, (_, suffix) => {
    return `I${suffix ?? ""}`;
  });
  // Restore story proper nouns if present
  lower = lower.replace(/\b(eli|nina|mara|bellweather)\b/gi, (match) => {
    return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
  });
  return lower;
}

function prepareTextForTts(rawText: string): string {
  const cleaned = rawText
    .replace(/\*([^*\n]+)\*/g, (_, inner: string) => {
      return toNaturalSentenceCase(inner.trim());
    })
    .replace(/\t+/g, " ")
    .replace(/[ \u00A0]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
}

function splitTextIntoChunks(text: string, maxChars = 2000): string[] {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (para.length > maxChars) {
      if (current) {
        chunks.push(current);
        current = "";
      }
      const sentences = para.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [para];
      let sub = "";
      for (const sentence of sentences) {
        if ((sub + " " + sentence).trim().length > maxChars) {
          if (sub) chunks.push(sub.trim());
          sub = sentence.trim();
        } else {
          sub = (sub + " " + sentence).trim();
        }
      }
      if (sub) chunks.push(sub.trim());
      continue;
    }

    if ((current + "\n\n" + para).trim().length > maxChars) {
      if (current) chunks.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function findDataChunk(wavBuffer: Buffer): {
  headerEnd: number;
  dataSize: number;
  byteRate: number;
} {
  if (wavBuffer.length < 44 || wavBuffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Invalid WAV audio payload returned from model.");
  }

  const byteRate = wavBuffer.readUInt32LE(28) || 48000;
  let offset = 12;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString("ascii", offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === "data") {
      return {
        headerEnd: offset + 8,
        dataSize: Math.min(chunkSize, wavBuffer.length - (offset + 8)),
        byteRate,
      };
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  return {
    headerEnd: 44,
    dataSize: Math.max(0, wavBuffer.length - 44),
    byteRate,
  };
}

function concatWavBuffers(buffers: Buffer[]): {
  combined: Buffer;
  durationSec: number;
} {
  if (buffers.length === 0) {
    throw new Error("No audio buffers to combine.");
  }

  const firstInfo = findDataChunk(buffers[0]);
  if (buffers.length === 1) {
    return {
      combined: buffers[0],
      durationSec: firstInfo.dataSize / firstInfo.byteRate,
    };
  }

  const header = Buffer.from(buffers[0].subarray(0, firstInfo.headerEnd));
  const pcmParts: Buffer[] = [
    buffers[0].subarray(
      firstInfo.headerEnd,
      firstInfo.headerEnd + firstInfo.dataSize
    ),
  ];

  for (let i = 1; i < buffers.length; i++) {
    const info = findDataChunk(buffers[i]);
    pcmParts.push(
      buffers[i].subarray(info.headerEnd, info.headerEnd + info.dataSize)
    );
  }

  const combinedPcm = Buffer.concat(pcmParts);
  const combined = Buffer.concat([header, combinedPcm]);

  combined.writeUInt32LE(combined.length - 8, 4);
  combined.writeUInt32LE(combinedPcm.length, firstInfo.headerEnd - 4);

  return {
    combined,
    durationSec: combinedPcm.length / firstInfo.byteRate,
  };
}

interface DualScriptLine {
  speaker: "Speaker1" | "Speaker2";
  style: string;
  text: string;
}

async function structureDualSpeakerScript(
  ai: GoogleGenAI,
  rawText: string
): Promise<DualScriptLine[]> {
  const prepared = prepareTextForTts(rawText);

  const response = await ai.models.generateContent({
    model: "gemini-4-hydrogen",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Convert the following story or script into a dual-voice audio drama sequence using strictly two speaker IDs: "Speaker1" and "Speaker2".

Rules:
- Assign "Speaker1" to the primary Narrator and the first speaking character (e.g., Nina / female character).
- Assign "Speaker2" to the counterpart speaking character (e.g., Eli / second character, or answering paper notes/quotes).
- Preserve EVERY word of the original story/text accurately without summarizing or omitting lines.
- For each segment, provide a concise, expressive vocal "style" direction (e.g., "Quiet, evocative literary narration", "Soft, curious whisper", "Gentle, weary warmth").
- Keep segments natural in length (1 to 3 sentences per segment).

Text:
${prepared}`,
          },
        ],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: {
              type: Type.STRING,
              description: 'Must be strictly "Speaker1" or "Speaker2".',
            },
            style: {
              type: Type.STRING,
              description: "Short vocal delivery direction for this line.",
            },
            text: {
              type: Type.STRING,
              description: "Exact spoken text for this segment.",
            },
          },
          required: ["speaker", "style", "text"],
        },
      },
    },
  });

  const jsonStr = (response.text ?? "[]").trim();
  const parsed = JSON.parse(jsonStr) as Array<{
    speaker?: string;
    style?: string;
    text?: string;
  }>;

  const valid = parsed
    .filter((item) => item && typeof item.text === "string" && item.text.trim())
    .map((item) => ({
      speaker: (item.speaker === "Speaker2" ? "Speaker2" : "Speaker1") as
        | "Speaker1"
        | "Speaker2",
      style:
        typeof item.style === "string" && item.style.trim()
          ? item.style.trim()
          : "Warm, natural literary delivery",
      text: item.text!.trim(),
    }));

  if (valid.length === 0) {
    throw new Error("Could not structure text into dual-speaker lines.");
  }

  return valid;
}

function extractErrorDetails(err: unknown): { status: number; message: string } {
  const fallback = "Failed to synthesize speech.";
  if (!err || typeof err !== "object") {
    return { status: 500, message: fallback };
  }

  const anyErr = err as { status?: number; message?: string };
  let msg = anyErr.message || fallback;
  let status = typeof anyErr.status === "number" ? anyErr.status : 500;

  if (msg.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(msg) as {
        error?: { code?: number; message?: string; status?: string };
      };
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
      if (typeof parsed?.error?.code === "number") {
        status = parsed.error.code;
      }
    } catch {
      // Keep original message if not valid JSON
    }
  }

  console.error("[TTS API Error]", status, msg);

  if (msg.includes("API_KEY_INVALID")) {
    return {
      status: 403,
      message:
        "Gemini API key is missing or invalid. Please check your key in Settings > Secrets.",
    };
  }
  if (msg.includes("RESOURCE_EXHAUSTED") || status === 429) {
    return {
      status: 429,
      message:
        "Rate limit reached on the Gemini speech service. Please wait a moment and try again.",
    };
  }

  return { status, message: msg };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/tts/preview", async (req, res) => {
    try {
      const voiceName = String(req.body?.voiceName || "Kore");
      if (!ALLOWED_VOICES.has(voiceName)) {
        res.status(400).json({ error: `Unsupported voice: ${voiceName}` });
        return;
      }

      const cached = previewCache.get(voiceName);
      if (cached) {
        res.json(cached);
        return;
      }

      const ai = getAiClient();
      const sampleText =
        "The 8:17 train rattled over Bellweather’s iron bridge, its gold windows slicing through the violet dusk.";

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: sampleText,
                speechMetadata: {
                  style: "Warm, intimate literary audiobook narrator",
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("No audio data returned for voice preview.");
      }

      const buf = Buffer.from(base64Audio, "base64");
      const info = findDataChunk(buf);
      const payload = {
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        durationSec: Number((info.dataSize / info.byteRate).toFixed(2)),
      };

      previewCache.set(voiceName, payload);
      res.json(payload);
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  app.post("/api/tts", async (req, res) => {
    try {
      const rawText = String(req.body?.text || "").trim();
      if (!rawText) {
        res.status(400).json({ error: "Please provide text to convert to voice." });
        return;
      }
      if (rawText.length > 12000) {
        res.status(400).json({
          error: "Text exceeds the 12,000-character studio limit per synthesis.",
        });
        return;
      }

      const mode = req.body?.mode === "dual" ? "dual" : "single";
      const voiceName = String(req.body?.voiceName || "Kore");
      const secondaryVoiceName = String(
        req.body?.secondaryVoiceName || "Charon"
      );
      const style = String(
        req.body?.style ||
          "Warm, intimate literary audiobook narrator with measured pauses"
      ).trim();

      if (!ALLOWED_VOICES.has(voiceName)) {
        res.status(400).json({ error: `Unsupported primary voice: ${voiceName}` });
        return;
      }
      if (mode === "dual" && !ALLOWED_VOICES.has(secondaryVoiceName)) {
        res.status(400).json({
          error: `Unsupported secondary voice: ${secondaryVoiceName}`,
        });
        return;
      }

      const ai = getAiClient();

      if (mode === "single") {
        const prepared = prepareTextForTts(rawText);
        const chunks = splitTextIntoChunks(prepared, 2000);
        const wavBuffers: Buffer[] = [];

        for (const chunk of chunks) {
          const response = await ai.models.generateContent({
            model: "gemini-3.8-flash-lite-tts",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: chunk,
                    speechMetadata: { style },
                  },
                ],
              },
            ],
            config: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          });

          const base64Chunk =
            response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
          if (!base64Chunk) {
            throw new Error("Speech model returned an empty audio segment.");
          }
          wavBuffers.push(Buffer.from(base64Chunk, "base64"));
        }

        const { combined, durationSec } = concatWavBuffers(wavBuffers);
        res.json({
          audioBase64: combined.toString("base64"),
          mimeType: "audio/wav",
          durationSec: Number(durationSec.toFixed(2)),
          mode: "single",
          voiceName,
          chunksProcessed: chunks.length,
        });
        return;
      }

      // Dual-Voice Drama mode using gemini-3.8-flash-tts
      const scriptLines = await structureDualSpeakerScript(ai, rawText);
      const batches: DualScriptLine[][] = [];
      let currentBatch: DualScriptLine[] = [];
      let currentBatchChars = 0;

      for (const line of scriptLines) {
        if (
          currentBatch.length >= 16 ||
          (currentBatch.length > 0 && currentBatchChars + line.text.length > 1800)
        ) {
          batches.push(currentBatch);
          currentBatch = [];
          currentBatchChars = 0;
        }
        currentBatch.push(line);
        currentBatchChars += line.text.length;
      }
      if (currentBatch.length > 0) {
        batches.push(currentBatch);
      }

      const wavBuffers: Buffer[] = [];
      for (const batch of batches) {
        const parts = batch.map((line) => ({
          text: `${line.speaker}: ${line.text}`,
          speechMetadata: {
            speaker: line.speaker,
            style: `${line.style}. Overall tone: ${style}`,
          },
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash-tts",
          contents: [
            {
              role: "user",
              parts,
            },
          ],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: "Speaker1",
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName },
                    },
                  },
                  {
                    speaker: "Speaker2",
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: secondaryVoiceName },
                    },
                  },
                ],
              },
            },
          },
        });

        const base64Chunk =
          response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Chunk) {
          throw new Error("Dual-voice speech model returned an empty segment.");
        }
        wavBuffers.push(Buffer.from(base64Chunk, "base64"));
      }

      const { combined, durationSec } = concatWavBuffers(wavBuffers);
      res.json({
        audioBase64: combined.toString("base64"),
        mimeType: "audio/wav",
        durationSec: Number(durationSec.toFixed(2)),
        mode: "dual",
        voiceName,
        secondaryVoiceName,
        scriptLines,
      });
    } catch (err) {
      const { status, message } = extractErrorDetails(err);
      res.status(status).json({ error: message });
    }
  });

  const distDir = path.join(__dirname, "dist");
  const isProduction =
    process.env.NODE_ENV === "production" &&
    fs.existsSync(path.join(distDir, "index.html"));

  if (isProduction) {
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Bellweather Audio Studio listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
