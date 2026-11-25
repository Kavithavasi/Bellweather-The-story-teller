import React, { useState } from "react";
import { ChevronDown, ChevronUp, Download, Play } from "lucide-react";
import { formatDuration, GeneratedTrack } from "../data/story";

interface RecordingsLibraryProps {
  tracks: GeneratedTrack[];
  activeTrackId: string | null;
  onSelectTrack: (track: GeneratedTrack) => void;
}

export const RecordingsLibrary: React.FC<RecordingsLibraryProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
}) => {
  const [expandedScriptId, setExpandedScriptId] = useState<string | null>(null);

  const handleDownload = (track: GeneratedTrack) => {
    const a = document.createElement("a");
    a.href = track.audioUrl;
    const safeSlug = track.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    a.download = `${safeSlug || "bellweather"}-${track.voiceName.toLowerCase()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <section
      id="recordings"
      aria-label="Session Recordings"
      className="rounded-2xl border border-zinc-200/90 bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">Session Archive</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-zinc-900">
            Generated Recordings
          </h2>
        </div>
        <p className="font-mono text-xs tabular-nums text-zinc-500">
          {tracks.length} {tracks.length === 1 ? "take" : "takes"} rendered
        </p>
      </div>

      {tracks.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-zinc-600">
            Your synthesized audio takes will appear here for instant comparison
            and WAV download.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {tracks.map((track) => {
            const isCurrent = track.id === activeTrackId;
            const isScriptOpen = expandedScriptId === track.id;
            const hasScript =
              Array.isArray(track.scriptLines) && track.scriptLines.length > 0;

            return (
              <div key={track.id} className="py-5 first:pt-4 last:pb-1">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="truncate font-serif text-lg font-semibold text-zinc-900">
                        {track.title}
                      </h3>
                      {isCurrent && (
                        <span className="text-xs font-medium text-[#312E81]">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span>
                        {track.mode === "dual"
                          ? `Dual-Voice (${track.voiceName} & ${track.secondaryVoiceName})`
                          : `Single Narrator (${track.voiceName})`}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{track.styleLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {formatDuration(track.durationSec)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {track.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {hasScript && (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedScriptId(isScriptOpen ? null : track.id)
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 whitespace-nowrap"
                      >
                        <span>Cue Sheet</span>
                        {isScriptOpen ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectTrack(track)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
                        isCurrent
                          ? "bg-[#312E81] text-white"
                          : "border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                      }`}
                    >
                      <Play className="h-3.5 w-3.5 fill-current" />
                      <span>{isCurrent ? "Loaded" : "Play Take"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload(track)}
                      aria-label={`Download ${track.title} WAV`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 whitespace-nowrap"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>WAV</span>
                    </button>
                  </div>
                </div>

                {hasScript && isScriptOpen && (
                  <div className="mt-4 rounded-xl border border-zinc-200/80 bg-zinc-50/70 p-4 space-y-2.5">
                    <p className="text-xs font-medium text-zinc-500">
                      Dual-Voice Cast Breakdown
                    </p>
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {track.scriptLines!.map((line, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-1 gap-1 rounded-lg bg-white px-3.5 py-2.5 text-xs sm:grid-cols-12 sm:items-baseline sm:gap-3"
                        >
                          <span
                            className={`font-semibold sm:col-span-3 ${
                              line.speaker === "Speaker1"
                                ? "text-[#312E81]"
                                : "text-zinc-800"
                            }`}
                          >
                            {line.speaker === "Speaker1"
                              ? `${track.voiceName} (Narrator / Nina)`
                              : `${track.secondaryVoiceName} (Eli)`}
                          </span>
                          <span className="text-zinc-800 sm:col-span-6">
                            {line.text}
                          </span>
                          <span className="italic text-zinc-500 sm:col-span-3 sm:text-right">
                            {line.style}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
