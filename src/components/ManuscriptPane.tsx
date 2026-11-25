import React from "react";
import { Play, RotateCcw, Trash2 } from "lucide-react";
import {
  countWords,
  DEFAULT_STORY_TEXT,
  STORY_SCENES,
  StoryScene,
} from "../data/story";

export type ManuscriptTab = "read" | "edit" | "scenes";

interface ManuscriptPaneProps {
  title: string;
  text: string;
  activeTab: ManuscriptTab;
  isGenerating: boolean;
  activeSceneId: string | null;
  onTabChange: (tab: ManuscriptTab) => void;
  onTitleChange: (title: string) => void;
  onTextChange: (text: string) => void;
  onPlayScene: (scene: StoryScene) => void;
  onResetDefault: () => void;
}

function renderFormattedLine(line: string, idx: number) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // Standalone paper sign message: *I’M SORRY.*
  const fullNoteMatch = trimmed.match(/^\*([^*]+)\*$/);
  if (fullNoteMatch) {
    return (
      <div
        key={idx}
        className="my-3 rounded-lg bg-zinc-50 px-5 py-2.5 text-center font-serif text-[15px] italic tracking-wider text-[#312E81]"
      >
        {fullNoteMatch[1]}
      </div>
    );
  }

  // Inline note inside prose, e.g. *YOU COULD STILL GO,* Eli wrote.
  const parts = trimmed.split(/(\*[^*]+\*)/g);
  return (
    <p key={idx} className="font-serif text-[17px] leading-[1.8] text-zinc-800">
      {parts.map((part, pIdx) => {
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return (
            <span
              key={pIdx}
              className="italic tracking-wide text-[#312E81]"
            >
              {part.slice(1, -1)}
            </span>
          );
        }
        return <React.Fragment key={pIdx}>{part}</React.Fragment>;
      })}
    </p>
  );
}

export const ManuscriptPane: React.FC<ManuscriptPaneProps> = ({
  title,
  text,
  activeTab,
  isGenerating,
  activeSceneId,
  onTabChange,
  onTitleChange,
  onTextChange,
  onPlayScene,
  onResetDefault,
}) => {
  const isDefaultStory = text.trim() === DEFAULT_STORY_TEXT.trim();
  const wordCount = countWords(text);
  const charCount = text.length;

  const derivedScenes: StoryScene[] = isDefaultStory
    ? STORY_SCENES
    : text
        .split(/\n{2,}/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk, i) => ({
          id: `custom-scene-${i + 1}`,
          index: String(i + 1).padStart(2, "0"),
          title: `Passage ${i + 1}`,
          timeMarker: `${countWords(chunk)} words`,
          text: chunk,
        }));

  const lines = text.split("\n");

  return (
    <section
      id="story"
      aria-label="Manuscript Workspace"
      className="rounded-2xl border border-zinc-200/90 bg-white p-6 md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div>
          <p className="text-xs font-medium text-zinc-500">Manuscript</p>
          <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-zinc-900">
            {title || "Untitled Reading"}
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Manuscript views"
          className="flex items-center gap-1 rounded-lg bg-zinc-100 p-1"
        >
          {(
            [
              { id: "read", label: "Read View" },
              { id: "edit", label: "Edit Text" },
              { id: "scenes", label: "Scenes" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] ${
                activeTab === tab.id
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "read" && (
        <div className="mt-6 space-y-3.5 max-w-[68ch]">
          {lines.map((line, idx) => renderFormattedLine(line, idx))}
        </div>
      )}

      {activeTab === "edit" && (
        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="manuscript-title"
              className="block text-xs font-medium text-zinc-600"
            >
              Recording Title
            </label>
            <input
              id="manuscript-title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter a title for this audio reading"
              className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-sm text-zinc-900 focus:border-[#312E81] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-4">
              <label
                htmlFor="manuscript-textarea"
                className="block text-xs font-medium text-zinc-600"
              >
                Text to Convert into Voice
              </label>
              <span className="font-mono text-xs tabular-nums text-zinc-500">
                {wordCount} words · {charCount.toLocaleString()} / 12,000 chars
              </span>
            </div>
            <textarea
              id="manuscript-textarea"
              rows={18}
              value={text}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder="Paste or write any story, script, or passage to convert into voice..."
              className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 font-serif text-[16px] leading-relaxed text-zinc-900 focus:border-[#312E81] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-zinc-500">
              Text wrapped in *asterisks* is read cleanly as expressive notes or
              emphasis.
            </p>
            <div className="flex items-center gap-2">
              {!isDefaultStory && (
                <button
                  type="button"
                  onClick={onResetDefault}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 whitespace-nowrap"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restore Original Story</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onTextChange("")}
                disabled={!text}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-40 whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "scenes" && (
        <div id="scenes" className="mt-6 divide-y divide-zinc-100">
          {derivedScenes.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              Add paragraphs in Edit Text to view passages individually.
            </p>
          ) : (
            derivedScenes.map((scene) => {
              const isActive = activeSceneId === scene.id;
              return (
                <div
                  key={scene.id}
                  className="flex flex-col justify-between gap-4 py-5 first:pt-1 last:pb-1 sm:flex-row sm:items-start"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono tabular-nums text-zinc-400">
                        {scene.index}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{scene.timeMarker}</span>
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-zinc-900">
                      {scene.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-zinc-600">
                      {scene.text.replace(/\*/g, "")}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isGenerating}
                    onClick={() => onPlayScene(scene)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#312E81] disabled:opacity-50 ${
                      isActive
                        ? "border-[#312E81] bg-[#312E81] text-white"
                        : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                    }`}
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{isActive ? "Active Scene" : "Speak Scene"}</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};
