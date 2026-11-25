import { useEffect, useRef, useState } from "react";
import { Play, TrainFront } from "lucide-react";
import { AudioPlayerPanel } from "./components/AudioPlayerPanel";
import { ManuscriptPane, ManuscriptTab } from "./components/ManuscriptPane";
import { RecordingsLibrary } from "./components/RecordingsLibrary";
import { VoiceStudioControls } from "./components/VoiceStudioControls";
import {
  base64ToWavBlob,
  countWords,
  DEFAULT_STORY_TEXT,
  DEFAULT_STORY_TITLE,
  extractWaveformPeaks,
  GeneratedTrack,
  ScriptSegment,
  STORY_SCENES,
  StoryScene,
  STYLE_PRESETS,
  VoiceName,
} from "./data/story";

const HERO_IMAGE_SRC =
  "/src/assets/images/bellweather_bridge_dusk_1795612349294.jpg";

export default function App() {
  const [title, setTitle] = useState<string>(DEFAULT_STORY_TITLE);
  const [storyText, setStoryText] = useState<string>(DEFAULT_STORY_TEXT);
  const [activeTab, setActiveTab] = useState<ManuscriptTab>("read");

  const [mode, setMode] = useState<"single" | "dual">("single");
  const [primaryVoice, setPrimaryVoice] = useState<VoiceName>("Kore");
  const [secondaryVoice, setSecondaryVoice] = useState<VoiceName>("Charon");
  const [stylePresetId, setStylePresetId] = useState<string>("intimate");
  const [customStyle, setCustomStyle] = useState<string>(
    STYLE_PRESETS[0].prompt
  );

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationLabel, setGenerationLabel] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  const [tracks, setTracks] = useState<GeneratedTrack[]>([]);
  const [activeTrack, setActiveTrack] = useState<GeneratedTrack | null>(null);

  const [previewingVoice, setPreviewingVoice] = useState<VoiceName | null>(null);
  const [playingPreviewVoice, setPlayingPreviewVoice] =
    useState<VoiceName | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const previewCacheRef = useRef<Map<VoiceName, string>>(new Map());

  const [heroImageFailed, setHeroImageFailed] = useState(false);

  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  const handleStylePresetChange = (presetId: string) => {
    setStylePresetId(presetId);
    const found = STYLE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCustomStyle(found.prompt);
    }
  };

  const handlePreviewVoice = async (voice: VoiceName) => {
    // Toggle stop if already playing this voice preview
    if (playingPreviewVoice === voice && previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
      setPlayingPreviewVoice(null);
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
    }

    setErrorMessage(null);
    let url = previewCacheRef.current.get(voice);

    if (!url) {
      setPreviewingVoice(voice);
      try {
        const res = await fetch("/api/tts/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voiceName: voice }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Unable to preview voice.");
        }
        const blob = base64ToWavBlob(data.audioBase64);
        url = URL.createObjectURL(blob);
        previewCacheRef.current.set(voice, url);
      } catch (err) {
        setPreviewingVoice(null);
        setErrorMessage(
          err instanceof Error ? err.message : "Unable to preview voice."
        );
        return;
      } finally {
        setPreviewingVoice(null);
      }
    }

    const audio = new Audio(url);
    previewAudioRef.current = audio;
    audio.onended = () => setPlayingPreviewVoice(null);
    audio.onpause = () => setPlayingPreviewVoice(null);

    try {
      await audio.play();
      setPlayingPreviewVoice(voice);
    } catch {
      setPlayingPreviewVoice(null);
    }
  };

  const synthesizeText = async (
    targetText: string,
    targetTitle: string,
    sceneId: string | null = null
  ) => {
    const trimmed = targetText.trim();
    if (!trimmed) {
      setErrorMessage("Please enter or restore story text before converting.");
      return;
    }

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setPlayingPreviewVoice(null);
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setActiveSceneId(sceneId);
    setGenerationLabel(
      mode === "dual"
        ? `Directing dual-voice performance (${primaryVoice} & ${secondaryVoice})...`
        : `Synthesizing "${targetTitle}" with ${primaryVoice}...`
    );

    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          mode,
          voiceName: primaryVoice,
          secondaryVoiceName: secondaryVoice,
          style: customStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Speech synthesis failed.");
      }

      const blob = base64ToWavBlob(data.audioBase64);
      const audioUrl = URL.createObjectURL(blob);
      const peaks = await extractWaveformPeaks(blob, 64);

      const activePreset = STYLE_PRESETS.find((p) => p.id === stylePresetId);
      const styleLabel =
        activePreset && activePreset.prompt === customStyle
          ? activePreset.label
          : "Custom Direction";

      const newTrack: GeneratedTrack = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: targetTitle,
        mode,
        voiceName: primaryVoice,
        secondaryVoiceName: mode === "dual" ? secondaryVoice : undefined,
        styleLabel,
        audioUrl,
        durationSec: Number(data.durationSec) || 0,
        createdAt: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        wordCount: countWords(trimmed),
        peaks,
        scriptLines: Array.isArray(data.scriptLines)
          ? (data.scriptLines as ScriptSegment[])
          : undefined,
      };

      setTracks((prev) => [newTrack, ...prev]);
      setActiveTrack(newTrack);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during synthesis."
      );
    } finally {
      setIsGenerating(false);
      setGenerationLabel("");
    }
  };

  const handleGenerateFull = () => {
    synthesizeText(storyText, title.trim() || "Untitled Reading", null);
  };

  const handlePlayScene = (scene: StoryScene) => {
    synthesizeText(scene.text, `${scene.index}. ${scene.title}`, scene.id);
  };

  const wordCount = countWords(storyText);
  const estMinutes = Math.floor((wordCount / 155) * 60);
  const estFormatted = `~${Math.floor(estMinutes / 60)}m ${String(
    estMinutes % 60
  ).padStart(2, "0")}s`;

  return (
    <div className="min-h-screen bg-[#F6F6F8] text-[#111318]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-[#F6F6F8]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-8 px-6 py-4">
          <a
            href="#"
            className="font-serif text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0"
          >
            Bellweather Audio
          </a>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
          >
            <a
              href="#story"
              onClick={() => setActiveTab("read")}
              className="transition-colors hover:text-zinc-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Story
            </a>
            <a
              href="#voice-studio"
              className="transition-colors hover:text-zinc-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Voice Studio
            </a>
            <a
              href="#story"
              onClick={() => setActiveTab("scenes")}
              className="transition-colors hover:text-zinc-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Scenes
            </a>
            <a
              href="#recordings"
              className="transition-colors hover:text-zinc-900 hover:underline underline-offset-4 whitespace-nowrap shrink-0"
            >
              Recordings
            </a>
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateFull}
              className="rounded-lg bg-[#312E81] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1E1B4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              {isGenerating ? "Synthesizing..." : "Convert to Voice"}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] space-y-10 px-6 py-10">
        {/* Split Hero Section */}
        <section aria-label="Story Overview" className="space-y-6">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            <div className="flex flex-col justify-between rounded-2xl border border-zinc-200/90 bg-white p-8 lg:col-span-6">
              <div>
                <p className="text-xs font-medium tracking-wide text-zinc-500">
                  Literary Text-to-Voice Edition
                </p>
                <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight text-zinc-900 [text-wrap:balance] sm:text-5xl">
                  {title || DEFAULT_STORY_TITLE}
                </h1>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-600">
                  Listen to the full story in an intimate single narrator voice
                  or a dual-speaker audio drama, or edit the manuscript to voice
                  your own prose.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateFull}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#312E81] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E1B4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] disabled:opacity-50 whitespace-nowrap"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>
                    {isGenerating ? "Generating Voice..." : "Listen to Story"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("edit");
                    document
                      .getElementById("story")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 whitespace-nowrap"
                >
                  Edit Manuscript
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-[#1B192E] lg:col-span-6">
              {!heroImageFailed ? (
                <img
                  src={HERO_IMAGE_SRC}
                  alt="The 8:17 passenger train crossing Bellweather’s iron bridge at violet dusk with warm golden windows reflecting on the river"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImageFailed(true)}
                  className="aspect-video w-full object-cover lg:h-full"
                />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#18181B] p-8 text-center text-white lg:h-full">
                  <TrainFront className="h-10 w-10 text-amber-300/90" />
                  <p className="mt-3 font-serif text-xl font-medium">
                    Bellweather Iron Bridge · 8:17 PM
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Full-Width 4-Column Metadata Strip */}
          <div className="grid grid-cols-2 divide-y divide-zinc-200/80 rounded-2xl border border-zinc-200/90 bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="px-6 py-4">
              <p className="text-xs text-zinc-500">Manuscript Length</p>
              <p className="mt-1 font-mono text-base font-medium tabular-nums text-zinc-900">
                {wordCount} words
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-zinc-500">Estimated Reading</p>
              <p className="mt-1 font-mono text-base font-medium tabular-nums text-zinc-900">
                {estFormatted}
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-zinc-500">Audio Master</p>
              <p className="mt-1 font-mono text-base font-medium tabular-nums text-zinc-900">
                24 kHz · 16-bit WAV
              </p>
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-zinc-500">Active Cast</p>
              <p className="mt-1 truncate text-base font-medium text-zinc-900">
                {mode === "dual"
                  ? `${primaryVoice} & ${secondaryVoice}`
                  : `${primaryVoice} · Solo`}
              </p>
            </div>
          </div>
        </section>

        {/* Main Workspace Split: Manuscript (Left) + Audio Player & Voice Studio (Right) */}
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ManuscriptPane
              title={title}
              text={storyText}
              activeTab={activeTab}
              isGenerating={isGenerating}
              activeSceneId={activeSceneId}
              onTabChange={setActiveTab}
              onTitleChange={setTitle}
              onTextChange={setStoryText}
              onPlayScene={handlePlayScene}
              onResetDefault={() => {
                setTitle(DEFAULT_STORY_TITLE);
                setStoryText(DEFAULT_STORY_TEXT);
                setActiveSceneId(null);
              }}
            />
          </div>

          <div className="space-y-8 lg:sticky lg:top-24 lg:col-span-5">
            <AudioPlayerPanel
              track={activeTrack}
              isGenerating={isGenerating}
              generationLabel={generationLabel}
              errorMessage={errorMessage}
              onGeneratePrimary={handleGenerateFull}
            />

            <VoiceStudioControls
              mode={mode}
              primaryVoice={primaryVoice}
              secondaryVoice={secondaryVoice}
              stylePresetId={stylePresetId}
              customStyle={customStyle}
              previewingVoice={previewingVoice}
              playingPreviewVoice={playingPreviewVoice}
              isGenerating={isGenerating}
              onModeChange={setMode}
              onPrimaryVoiceChange={setPrimaryVoice}
              onSecondaryVoiceChange={setSecondaryVoice}
              onStylePresetChange={handleStylePresetChange}
              onCustomStyleChange={setCustomStyle}
              onPreviewVoice={handlePreviewVoice}
              onGenerateFull={handleGenerateFull}
            />
          </div>
        </div>

        {/* Session Recordings Archive */}
        <RecordingsLibrary
          tracks={tracks}
          activeTrackId={activeTrack?.id ?? null}
          onSelectTrack={(track) => setActiveTrack(track)}
        />
      </main>

      <footer className="border-t border-zinc-200/80 bg-white">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-zinc-500">
          <span>Bellweather Audio Studio</span>
          <span>
            {STORY_SCENES.length} scenes · {countWords(DEFAULT_STORY_TEXT)} words
            in original manuscript
          </span>
        </div>
      </footer>
    </div>
  );
}
