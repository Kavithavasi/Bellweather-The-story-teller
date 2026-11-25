export const DEFAULT_STORY_TITLE = "The 8:17 Train";

export const DEFAULT_STORY_TEXT = `The 8:17 train rattled over Bellweather’s iron bridge, its gold windows slicing through the violet dusk. In the third carriage, a man held up a white sheet.
\t*I’M SORRY.*
\tNina pressed a receipt against the glass.
\t*FOR WHAT?*
\tThe train vanished. The next night, the paper returned.
\t*I DON’T KNOW YET.*
\t*WHAT’S YOUR NAME?*
\t*ELI. YOURS?*
\t*NINA. WHY DO YOU APOLOGIZE TO STRANGERS?*
\t*I WAS HOPING YOU WEREN’T ONE.*
\tNina laughed, the sound echoing through the empty bookshop.
\t*WHY DO YOU RIDE THIS TRAIN EVERY NIGHT?*
\t*GOING HOME.*
\t*THEN WHY DO YOU LOOK SAD?*
\t*BECAUSE HOME ISN’T A PLACE ANYMORE.*
\tNina waited until the following evening.
\t*WHO DID YOU LOSE?*
\tSilence followed for two nights. Then, the sign flickered past.
\t*MY WIFE.*
\t*I’M SORRY.*
\t*NOW YOU KNOW WHAT I’M SORRY FOR.*
\tThe messages shifted. Eli spoke of Mara, a winter loss and a hospital window. Nina wrote of art school and a father’s illness.
\t*YOU COULD STILL GO,* Eli wrote.
\t*SO COULD YOU.*
\t*I’M ON A TRAIN.*
\t*YOU’RE GOING IN A CIRCLE.*
\tHe held the sign until the bridge ended. Nina caught the flash of a grin.
\tRain drummed against the shop glass a Tuesday later. The 8:17 never came. At 8:25, the bell chimed. A man stood there, damp strands clinging to his forehead, clutching a folded page.
\t“I’m Eli.”
\tNina froze. Shadows pooled beneath his lids.
\t“You came all this way to apologize?”
\t“I thought I should do it in person.”
\t“Do you know what you’re sorry for yet?”
\t“Not exactly.” He glanced at the river. “But I was hoping we could figure it out over tea.”
\tA year passed. They stood by the river at 8:17, fingers intertwined. The train crossed, windows glowing. In the third carriage, a white paper rose.
\t*I’M SORRY.*
\tNina chuckled. “Looks like your old friend has a lot to answer for.”
\tEli frowned. “That’s not me.”
\t“Did you tell anyone about our signs?”
\t“Only Mara.”
\tHe stopped. The air grew heavy.
\t“Maybe it was someone else,” Nina whispered.
\t“Maybe.”
\tThe carriage had always been empty. That night, Nina dreamed of a woman with a crooked smile and bright eyes. The woman held a sign.
\t*YOU CAN GO NOW.*`;

export interface StoryScene {
  id: string;
  index: string;
  title: string;
  timeMarker: string;
  text: string;
}

export const STORY_SCENES: StoryScene[] = [
  {
    id: "scene-1",
    index: "01",
    title: "The Iron Bridge",
    timeMarker: "8:17 PM · Dusk",
    text: `The 8:17 train rattled over Bellweather’s iron bridge, its gold windows slicing through the violet dusk. In the third carriage, a man held up a white sheet.
\t*I’M SORRY.*
\tNina pressed a receipt against the glass.
\t*FOR WHAT?*`,
  },
  {
    id: "scene-2",
    index: "02",
    title: "Paper Across the Glass",
    timeMarker: "Following Nights",
    text: `The train vanished. The next night, the paper returned.
\t*I DON’T KNOW YET.*
\t*WHAT’S YOUR NAME?*
\t*ELI. YOURS?*
\t*NINA. WHY DO YOU APOLOGIZE TO STRANGERS?*
\t*I WAS HOPING YOU WEREN’T ONE.*
\tNina laughed, the sound echoing through the empty bookshop.
\t*WHY DO YOU RIDE THIS TRAIN EVERY NIGHT?*
\t*GOING HOME.*
\t*THEN WHY DO YOU LOOK SAD?*
\t*BECAUSE HOME ISN’T A PLACE ANYMORE.*`,
  },
  {
    id: "scene-3",
    index: "03",
    title: "Going in a Circle",
    timeMarker: "Two Nights Later",
    text: `Nina waited until the following evening.
\t*WHO DID YOU LOSE?*
\tSilence followed for two nights. Then, the sign flickered past.
\t*MY WIFE.*
\t*I’M SORRY.*
\t*NOW YOU KNOW WHAT I’M SORRY FOR.*
\tThe messages shifted. Eli spoke of Mara, a winter loss and a hospital window. Nina wrote of art school and a father’s illness.
\t*YOU COULD STILL GO,* Eli wrote.
\t*SO COULD YOU.*
\t*I’M ON A TRAIN.*
\t*YOU’RE GOING IN A CIRCLE.*
\tHe held the sign until the bridge ended. Nina caught the flash of a grin.`,
  },
  {
    id: "scene-4",
    index: "04",
    title: "Rain on Tuesday",
    timeMarker: "8:25 PM · Bookshop",
    text: `Rain drummed against the shop glass a Tuesday later. The 8:17 never came. At 8:25, the bell chimed. A man stood there, damp strands clinging to his forehead, clutching a folded page.
\t“I’m Eli.”
\tNina froze. Shadows pooled beneath his lids.
\t“You came all this way to apologize?”
\t“I thought I should do it in person.”
\t“Do you know what you’re sorry for yet?”
\t“Not exactly.” He glanced at the river. “But I was hoping we could figure it out over tea.”`,
  },
  {
    id: "scene-5",
    index: "05",
    title: "The Empty Carriage",
    timeMarker: "One Year Later",
    text: `A year passed. They stood by the river at 8:17, fingers intertwined. The train crossed, windows glowing. In the third carriage, a white paper rose.
\t*I’M SORRY.*
\tNina chuckled. “Looks like your old friend has a lot to answer for.”
\tEli frowned. “That’s not me.”
\t“Did you tell anyone about our signs?”
\t“Only Mara.”
\tHe stopped. The air grew heavy.
\t“Maybe it was someone else,” Nina whispered.
\t“Maybe.”
\tThe carriage had always been empty. That night, Nina dreamed of a woman with a crooked smile and bright eyes. The woman held a sign.
\t*YOU CAN GO NOW.*`,
  },
];

export type VoiceName = "Kore" | "Charon" | "Fenrir" | "Puck" | "Zephyr";

export interface VoiceProfile {
  name: VoiceName;
  register: string;
  character: string;
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    name: "Kore",
    register: "Warm Alto",
    character: "Intimate, poised storytelling cadence with gentle emotional clarity",
  },
  {
    name: "Charon",
    register: "Measured Baritone",
    character: "Low, unhurried depth suited for nocturnal prose and Eli’s dialogue",
  },
  {
    name: "Zephyr",
    register: "Soft Contralto",
    character: "Airy, reflective phrasing ideal for quiet dusk imagery and Nina",
  },
  {
    name: "Fenrir",
    register: "Grounded Tenor",
    character: "Steady, resonant warmth with crisp articulation across dialogue",
  },
  {
    name: "Puck",
    register: "Bright Lyric",
    character: "Expressive, agile delivery for lively conversation and contrast",
  },
];

export interface StylePreset {
  id: string;
  label: string;
  prompt: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "intimate",
    label: "Intimate Literary",
    prompt:
      "Warm, intimate literary audiobook narrator with unhurried pacing and quiet pauses",
  },
  {
    id: "nocturnal",
    label: "Nocturnal & Reflective",
    prompt:
      "Hushed, atmospheric twilight tone, gentle cadence, tender and slightly mysterious",
  },
  {
    id: "fireside",
    label: "Warm Fireside",
    prompt:
      "Rich, comforting classic storyteller voice with clear phrasing and soft warmth",
  },
  {
    id: "drama",
    label: "Radio Drama",
    prompt:
      "Expressive theatrical storytelling with distinct emotional shifts between lines",
  },
];

export interface ScriptSegment {
  speaker: "Speaker1" | "Speaker2";
  style: string;
  text: string;
}

export interface GeneratedTrack {
  id: string;
  title: string;
  mode: "single" | "dual";
  voiceName: VoiceName;
  secondaryVoiceName?: VoiceName;
  styleLabel: string;
  audioUrl: string;
  durationSec: number;
  createdAt: string;
  wordCount: number;
  peaks: number[];
  scriptLines?: ScriptSegment[];
}

export function base64ToWavBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: "audio/wav" });
}

export async function extractWaveformPeaks(
  blob: Blob,
  barCount = 64
): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    const channelData = decoded.getChannelData(0);
    const blockSize = Math.max(1, Math.floor(channelData.length / barCount));
    const peaks: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * blockSize;
      const end = Math.min(start + blockSize, channelData.length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const val = Math.abs(channelData[j]);
        if (val > max) max = val;
      }
      peaks.push(Math.max(0.12, Math.min(1, max)));
    }
    await ctx.close();
    return peaks;
  } catch {
    return Array.from({ length: barCount }, (_, idx) => {
      return 0.25 + 0.55 * Math.abs(Math.sin(idx * 0.45));
    });
  }
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}
