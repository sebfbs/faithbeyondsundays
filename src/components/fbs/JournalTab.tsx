import { useState } from "react";
import { Bookmark, ChevronRight, SlidersHorizontal, Check, Plus, X, Pencil, Trash2 } from "lucide-react";
import type { JournalEntry } from "@/pages/Index";

type FilterType = "all" | "sermon" | "challenge" | "bookmarked";

interface JournalTabProps {
  entries: JournalEntry[];
  onAddEntry?: (entry: JournalEntry) => void;
  onUpdateEntry?: (entry: JournalEntry) => void;
  onDeleteEntry?: (id: string) => void;
}

export default function JournalTab({ entries, onAddEntry, onUpdateEntry, onDeleteEntry }: JournalTabProps) {
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>(
    Object.fromEntries(entries.map((e) => [e.id, e.bookmarked]))
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Sermon", value: "sermon" },
    { label: "Challenge", value: "challenge" },
    { label: "Bookmarked", value: "bookmarked" },
  ];

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "bookmarked") return bookmarks[entry.id];
    return entry.type === activeFilter;
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveEntry = () => {
    if (!newBody.trim()) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const entry: JournalEntry = {
      id: `personal-${Date.now()}`,
      type: "sermon" as const,
      tag: "Personal",
      date: dateStr,
      sermonTitle: newTitle.trim() || "Personal Reflection",
      preview: newBody.trim().slice(0, 120),
      fullText: newBody.trim(),
      bookmarked: false,
    };
    onAddEntry?.(entry);
    setNewTitle("");
    setNewBody("");
    setComposing(false);
  };

  if (composing) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setComposing(false); setNewTitle(""); setNewBody(""); }}
            className="flex items-center gap-2 text-amber font-semibold text-sm tap-active"
          >
            <X size={16} /> Cancel
          </button>
          <button
            onClick={handleSaveEntry}
            disabled={!newBody.trim()}
            className="text-sm font-bold px-4 py-1.5 rounded-full bg-amber text-white disabled:opacity-40 tap-active transition-opacity"
          >
            Save
          </button>
        </div>
        <input
          type="text"
          placeholder="Title (optional)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="w-full bg-card rounded-2xl px-5 py-4 text-base font-semibold text-foreground placeholder:text-muted-foreground shadow-card outline-none"
        />
        <textarea
          placeholder="Write your thoughts..."
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={8}
          className="w-full bg-card rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground shadow-card outline-none resize-none leading-relaxed"
          autoFocus
        />
      </div>
    );
  }

  const selectedEntry = entries.find((e) => e.id === selected);

  if (selectedEntry && editing) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-2 text-amber font-semibold text-sm tap-active"
          >
            <X size={16} /> Cancel
          </button>
          <button
            onClick={() => {
              if (!editBody.trim()) return;
              onUpdateEntry?.({
                ...selectedEntry,
                sermonTitle: editTitle.trim() || selectedEntry.sermonTitle,
                fullText: editBody.trim(),
                preview: editBody.trim().slice(0, 120),
              });
              setEditing(false);
            }}
            disabled={!editBody.trim()}
            className="text-sm font-bold px-4 py-1.5 rounded-full bg-amber text-white disabled:opacity-40 tap-active transition-opacity"
          >
            Save
          </button>
        </div>
        <input
          type="text"
          placeholder="Title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-card rounded-2xl px-5 py-4 text-base font-semibold text-foreground placeholder:text-muted-foreground shadow-card outline-none"
        />
        <textarea
          placeholder="Write your thoughts..."
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          rows={8}
          className="w-full bg-card rounded-2xl px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground shadow-card outline-none resize-none leading-relaxed"
          autoFocus
        />
      </div>
    );
  }

  if (selectedEntry) {
    return (
      <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setSelected(null); setShowDeleteConfirm(false); }}
            className="flex items-center gap-2 text-amber font-semibold text-sm tap-active"
          >
            ← Back to Journal
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setEditTitle(selectedEntry.sermonTitle);
                setEditBody(selectedEntry.fullText);
                setEditing(true);
              }}
              className="tap-active p-1.5"
            >
              <Pencil size={16} className="text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="tap-active p-1.5"
            >
              <Trash2 size={16} className="text-destructive" />
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-foreground font-medium">Delete this entry?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-muted text-foreground tap-active"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteEntry?.(selectedEntry.id);
                  setSelected(null);
                  setShowDeleteConfirm(false);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-destructive text-destructive-foreground tap-active"
              >
                Delete
              </button>
            </div>
          </div>
        )}

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
        <div className="relative">
          <button
            onClick={() => setFilterOpen((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full tap-active transition-colors ${
              activeFilter !== "all"
                ? "text-amber bg-amber-bg"
                : "text-muted-foreground bg-muted"
            }`}
          >
            <SlidersHorizontal size={12} />
            {activeFilter === "all" ? "Filter" : filters.find(f => f.value === activeFilter)?.label}
          </button>
          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-card rounded-2xl shadow-card border border-border py-2 min-w-[160px]">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => {
                      setActiveFilter(f.value);
                      setFilterOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-foreground tap-active hover:bg-muted/50 transition-colors"
                  >
                    {f.label}
                    {activeFilter === f.value && <Check size={14} className="text-amber" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => (
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

      {/* Floating Add Button */}
      <button
        onClick={() => setComposing(true)}
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-amber text-white shadow-lg flex items-center justify-center tap-active active:scale-95 transition-transform"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
