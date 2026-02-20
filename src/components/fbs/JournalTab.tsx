import { useState } from "react";
import { Bookmark, ChevronRight } from "lucide-react";
import type { JournalEntry } from "@/pages/Index";

interface JournalTabProps {
  entries: JournalEntry[];
}

export default function JournalTab({ entries }: JournalTabProps) {
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(
    Object.fromEntries(entries.map((e) => [e.id, e.bookmarked]))
  );
  const [selected, setSelected] = useState<string | null>(null);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedEntry = entries.find((e) => e.id === selected);

  if (selectedEntry) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-amber font-semibold text-sm tap-active"
        >
          ← Back to Journal
        </button>
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={
                selectedEntry.type === "sermon" ? "blue-pill" : "amber-pill"
              }
            >
              {selectedEntry.tag}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {selectedEntry.date}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {selectedEntry.sermonTitle}
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {selectedEntry.fullText}
          </p>
        </div>

        {selectedEntry.suggestedScripture && (
          <div
            className="rounded-3xl p-5"
            style={{ background: "hsl(210 55% 94%)" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: "hsl(207 65% 40%)" }}
            >
              Suggested Scripture
            </p>
            <p
              className="text-xs font-bold mb-1.5"
              style={{ color: "hsl(207 65% 40%)" }}
            >
              {selectedEntry.suggestedScripture.reference}
            </p>
            <p
              className="text-sm leading-relaxed italic"
              style={{ color: "hsl(207 50% 30%)" }}
            >
              {selectedEntry.suggestedScripture.text}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reflection Journal
          </h1>
          <p className="text-sm text-muted-foreground font-medium mt-0.5">
            Your journey of faith and growth
          </p>
        </div>
        <button className="text-xs font-semibold text-amber bg-amber-bg px-3 py-1.5 rounded-full tap-active">
          Filter
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {entries.map((entry) => (
          <button
            key={entry.id}
            onClick={() => setSelected(entry.id)}
            className="w-full bg-card rounded-3xl p-5 shadow-card text-left tap-active"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={
                      entry.type === "sermon" ? "blue-pill" : "amber-pill"
                    }
                  >
                    {entry.tag}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {entry.date}
                  </span>
                </div>
                <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                  {entry.preview}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-medium truncate">
                  {entry.sermonTitle}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <button
                  onClick={(e) => toggleBookmark(entry.id, e)}
                  className="tap-active"
                >
                  <Bookmark
                    size={18}
                    className={
                      bookmarks[entry.id]
                        ? "text-amber fill-amber"
                        : "text-muted-foreground"
                    }
                  />
                </button>
                <ChevronRight size={14} className="text-muted-foreground mt-2" />
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="h-2" />
    </div>
  );
}
