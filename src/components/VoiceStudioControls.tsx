import React from "react";
import { Loader2, Square, Volume2 } from "lucide-react";
import {
  STYLE_PRESETS,
  VOICE_PROFILES,
  VoiceName,
} from "../data/story";

interface VoiceStudioControlsProps {
  mode: "single" | "dual";
  primaryVoice: VoiceName;
  secondaryVoice: VoiceName;
  stylePresetId: string;
  customStyle: string;
  previewingVoice: VoiceName | null;
  playingPreviewVoice: VoiceName | null;
  isGenerating: boolean;
  onModeChange: (mode: "single" | "dual") => void;
  onPrimaryVoiceChange: (voice: VoiceName) => void;
  onSecondaryVoiceChange: (voice: VoiceName) => void;
  onStylePresetChange: (presetId: string) => void;
  onCustomStyleChange: (style: string) => void;
  onPreviewVoice: (voice: VoiceName) => void;
  onGenerateFull: () => void;
}

export const VoiceStudioControls: React.FC<VoiceStudioControlsProps> = ({
  mode,
  primaryVoice,
  secondaryVoice,
  stylePresetId,
  customStyle,
  previewingVoice,
  playingPreviewVoice,
  isGenerating,
  onModeChange,
  onPrimaryVoiceChange,
  onSecondaryVoiceChange,
  onStylePresetChange,
  onCustomStyleChange,
  onPreviewVoice,
  onGenerateFull,
}) => {
  return (
    <section
      id="voice-studio"
      aria-label="Voice Direction Controls"
      className="rounded-2xl border border-zinc-200/90 bg-white p-6 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-zinc-500">Voice Direction</p>
          <h3 className="mt-1 font-serif text-xl font-semibold text-zinc-900">
            Cast & Delivery
          </h3>
        </div>

        <div
          role="group"
          aria-label="Narration mode"
          className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1"
        >
          <button
            type="button"
            onClick={() => onModeChange("single")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === "single"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Single Narrator
          </button>
          <button
            type="button"
            onClick={() => onModeChange("dual")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              mode === "dual"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Dual-Voice Drama
          </button>
        </div>
      </div>

      {/* Primary Voice List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span className="font-medium text-zinc-700">
            {mode === "dual"
              ? "Primary Voice (Narrator & Nina)"
              : "Narrator Voice"}
          </span>
          <span>Click preview to audition</span>
        </div>

        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80">
          {VOICE_PROFILES.map((voice) => {
            const isSelected = primaryVoice === voice.name;
            const isLoadingPreview = previewingVoice === voice.name;
            const isPlayingThis = playingPreviewVoice === voice.name;

            return (
              <div
                key={voice.name}
                className={`flex items-center justify-between gap-3 px-4 py-3 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                  isSelected ? "bg-[#312E81]/[0.04]" : "bg-white hover:bg-zinc-50/70"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onPrimaryVoiceChange(voice.name)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81]"
                >
                  <span
                    className={`mt-1 h-4 w-4 shrink-0 rounded-full border transition-colors ${
                      isSelected
                        ? "border-[5px] border-[#312E81] bg-white"
                        : "border-zinc-300 bg-white"
                    }`}
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-zinc-900">
                        {voice.name}
                      </span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                      <span className="text-xs text-zinc-500">
                        {voice.register}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-zinc-500">
                      {voice.character}
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onPreviewVoice(voice.name)}
                  disabled={isLoadingPreview}
                  aria-label={`Preview ${voice.name} voice`}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] whitespace-nowrap"
                >
                  {isLoadingPreview ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#312E81]" />
                  ) : isPlayingThis ? (
                    <Square className="h-3 w-3 fill-current text-[#312E81]" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-zinc-500" />
                  )}
                  <span>{isPlayingThis ? "Stop" : "Preview"}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary Voice Selector for Dual-Voice Drama */}
      {mode === "dual" && (
        <div className="space-y-2 rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4">
          <p className="text-xs font-medium text-zinc-700">
            Counterpart Voice (Eli & Responding Notes)
          </p>
          <div className="flex flex-wrap gap-2">
            {VOICE_PROFILES.map((voice) => {
              const selected = secondaryVoice === voice.name;
              return (
                <button
                  key={voice.name}
                  type="button"
                  onClick={() => onSecondaryVoiceChange(voice.name)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                    selected
                      ? "border-[#312E81] bg-[#312E81] text-white"
                      : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  {voice.name} · {voice.register}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-relaxed text-zinc-500">
            Dual-Voice Drama automatically assigns narration and Nina to{" "}
            <span className="font-medium text-zinc-700">{primaryVoice}</span>{" "}
            and Eli’s dialogue to{" "}
            <span className="font-medium text-zinc-700">{secondaryVoice}</span>.
          </p>
        </div>
      )}

      {/* Delivery Style */}
      <div className="space-y-2.5">
        <label
          htmlFor="style-direction-input"
          className="block text-xs font-medium text-zinc-700"
        >
          Delivery Tone & Pacing
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STYLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onStylePresetChange(preset.id)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                stylePresetId === preset.id
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <input
          id="style-direction-input"
          type="text"
          value={customStyle}
          onChange={(e) => onCustomStyleChange(e.target.value)}
          placeholder="Describe vocal pacing, mood, and tone..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs text-zinc-900 focus:border-[#312E81] focus:bg-white focus:outline-none"
        />
      </div>

      <button
        type="button"
        disabled={isGenerating}
        onClick={onGenerateFull}
        className="w-full rounded-xl bg-[#312E81] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E1B4B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] disabled:opacity-50 whitespace-nowrap"
      >
        {isGenerating ? "Synthesizing Voice..." : "Generate Full Story Audio"}
      </button>
    </section>
  );
};
