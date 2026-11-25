import React, { useEffect, useRef, useState } from "react";
import {
  Download,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { formatDuration, GeneratedTrack } from "../data/story";

interface AudioPlayerPanelProps {
  track: GeneratedTrack | null;
  isGenerating: boolean;
  generationLabel: string;
  errorMessage: string | null;
  onGeneratePrimary: () => void;
}

const SPEED_OPTIONS = [0.85, 1, 1.15, 1.25] as const;

export const AudioPlayerPanel: React.FC<AudioPlayerPanelProps> = ({
  track,
  isGenerating,
  generationLabel,
  errorMessage,
  onGeneratePrimary,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    audio.src = track.audioUrl;
    audio.playbackRate = playbackRate;
    audio.muted = isMuted;
    setCurrentTime(0);
    setDuration(track.durationSec);

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const skipBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    const total = audio.duration || duration || track.durationSec;
    const next = Math.max(0, Math.min(total, audio.currentTime + delta));
    audio.currentTime = next;
    setCurrentTime(next);
  };

  const handleSeek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !track) return;
    const total = audio.duration || duration || track.durationSec;
    const target = Math.max(0, Math.min(total, ratio * total));
    audio.currentTime = target;
    setCurrentTime(target);
  };

  const handleDownload = () => {
    if (!track) return;
    const a = document.createElement("a");
    a.href = track.audioUrl;
    const safeSlug = track.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    a.download = `${safeSlug || "bellweather-audio"}-${track.voiceName.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalDuration = duration || track?.durationSec || 0;
  const progress =
    totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  return (
    <section
      aria-label="Audio Player"
      className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm"
    >
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (
            Number.isFinite(e.currentTarget.duration) &&
            e.currentTarget.duration > 0
          ) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-zinc-500">
            Audio Master
          </p>
          <h3 className="mt-1 truncate font-serif text-xl font-semibold text-zinc-900">
            {track ? track.title : "Ready to Synthesize"}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            {track ? (
              <>
                <span>
                  {track.mode === "dual"
                    ? `${track.voiceName} & ${track.secondaryVoiceName}`
                    : track.voiceName}
                </span>
                <span aria-hidden="true">·</span>
                <span>{track.styleLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">24 kHz WAV</span>
              </>
            ) : (
              <span>
                Select a voice below or synthesize the full manuscript directly.
              </span>
            )}
          </div>
        </div>

        {track && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download WAV</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-xs leading-relaxed text-rose-800"
        >
          <span className="font-semibold">Synthesis error: </span>
          {errorMessage}
        </div>
      )}

      {isGenerating ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-zinc-200/80 bg-zinc-50/70 px-6 py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#312E81]" />
          <p className="mt-3 text-sm font-medium text-zinc-900">
            {generationLabel || "Generating natural voice narration..."}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Rendering 24 kHz studio speech from your manuscript
          </p>
        </div>
      ) : track ? (
        <div className="mt-6 space-y-5">
          {/* Interactive Waveform Scrubber */}
          <div className="space-y-2">
            <div
              role="slider"
              tabIndex={0}
              aria-label="Audio timeline"
              aria-valuemin={0}
              aria-valuemax={Math.round(totalDuration)}
              aria-valuenow={Math.round(currentTime)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                handleSeek(ratio);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") skipBy(5);
                if (e.key === "ArrowLeft") skipBy(-5);
              }}
              className="group relative flex h-16 cursor-pointer items-center gap-[3px] rounded-xl bg-zinc-50 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
            >
              {track.peaks.map((peak, idx) => {
                const barRatio = (idx + 0.5) / track.peaks.length;
                const isPlayed = barRatio <= progress;
                return (
                  <span
                    key={idx}
                    style={{ height: `${Math.round(peak * 100)}%` }}
                    className={`flex-1 rounded-full transition-colors duration-150 ${
                      isPlayed
                        ? "bg-[#312E81]"
                        : "bg-zinc-300/80 group-hover:bg-zinc-400/80"
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between font-mono text-xs tabular-nums text-zinc-500">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>

          {/* Transport Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => skipBy(-10)}
                aria-label="Rewind 10 seconds"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause audio" : "Play audio"}
                className="inline-flex h-11 min-w-[104px] items-center justify-center gap-2 rounded-lg bg-[#312E81] px-4 text-sm font-medium text-white transition-colors hover:bg-[#1E1B4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] whitespace-nowrap"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Play</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => skipBy(10)}
                aria-label="Forward 10 seconds"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg bg-zinc-100 p-1">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setPlaybackRate(rate)}
                    className={`rounded-md px-2 py-1 font-mono text-xs tabular-nums transition-colors whitespace-nowrap ${
                      playbackRate === rate
                        ? "bg-white font-medium text-zinc-900 shadow-xs"
                        : "text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/50 p-5">
          <p className="text-sm leading-relaxed text-zinc-600">
            No audio master generated yet. Convert the full story into a studio
            WAV recording using your selected voice and delivery direction.
          </p>
          <button
            type="button"
            onClick={onGeneratePrimary}
            className="inline-flex items-center gap-2 rounded-lg bg-[#312E81] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E1B4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] whitespace-nowrap"
          >
            <Play className="h-4 w-4 fill-current" />
            <span>Convert Text to Voice</span>
          </button>
        </div>
      )}
    </section>
  );
};
