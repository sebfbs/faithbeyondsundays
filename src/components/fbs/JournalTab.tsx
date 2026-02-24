import { useState, useRef, forwardRef } from "react";
import { Bookmark, ChevronRight, SlidersHorizontal, Check, Plus, X, Pencil, Trash2, Camera, Loader2 } from "lucide-react";
import type { JournalEntry } from "@/hooks/useJournalEntries";
import { getAccentColors } from "./themeColors";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

type FilterType = "all" | "reflection" | "personal" | "bookmarked";

interface JournalTabProps {
  entries: JournalEntry[];
  onAddEntry?: (entry: JournalEntry) => void;
  onUpdateEntry?: (entry: JournalEntry) => void;
  onDeleteEntry?: (id: string) => void;
  isDemo?: boolean;
}

const DEMO_TRANSCRIPTION = "Today I'm grateful for the small moments of peace I found during my morning walk. The sunrise reminded me that each day is a fresh start and that God's mercies are new every morning.";

function checkImageQuality(imageData: ImageData): string | null {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  let sumBrightness = 0;

  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    sumBrightness += brightness;
  }

  const avgBrightness = sumBrightness / totalPixels;

  let sumVariance = 0;
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    sumVariance += (brightness - avgBrightness) ** 2;
  }
  const stddev = Math.sqrt(sumVariance / totalPixels);

  if (avgBrightness < 60) return "Your photo looks too dark. Try better lighting.";
  if (avgBrightness > 240) return "Your photo looks overexposed. Try reducing glare.";
  if (stddev < 30) return "Hard to distinguish text. Try a flat, well-lit surface.";
  return null;
}

const JournalTab = forwardRef<HTMLDivElement, JournalTabProps>(function JournalTab({ entries, onAddEntry, onUpdateEntry, onDeleteEntry, isDemo }, ref) {
  const colors = getAccentColors();
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

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [showScanTips, setShowScanTips] = useState(false);
  const [scanWarning, setScanWarning] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filters: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Daily Reflection", value: "reflection" },
    { label: "Personal", value: "personal" },
    { label: "Bookmarked", value: "bookmarked" },
  ];

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "bookmarked") return bookmarks[entry.id];
    if (activeFilter === "reflection") return entry.type === "reflection" || entry.type === "sermon";
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
      type: "personal" as const,
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

  const analyzeImage = (dataUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 200; // sample at low res for speed
        const scale = Math.min(maxDim / img.width, maxDim / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(checkImageQuality(imageData));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  };

  const transcribeImage = async (dataUrl: string) => {
    setScanning(true);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 1500));
        setNewBody((prev) => (prev ? prev + "\n\n" : "") + DEMO_TRANSCRIPTION);
        toast({ title: "Scan complete", description: "Handwriting transcribed successfully." });
      } else {
        const { data, error } = await supabase.functions.invoke("transcribe-journal", {
          body: { image: dataUrl },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        const text = data?.text || "";
        if (!text.trim()) {
          toast({ title: "No text found", description: "Could not detect handwriting in this image.", variant: "destructive" });
        } else {
          setNewBody((prev) => (prev ? prev + "\n\n" : "") + text);
          toast({ title: "Scan complete", description: "Handwriting transcribed successfully." });
        }
      }
    } catch (err: any) {
      console.error("Transcription error:", err);
      toast({ title: "Scan failed", description: err?.message || "Could not transcribe the image.", variant: "destructive" });
    } finally {
      setScanning(false);
      setPendingImage(null);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const warning = await analyzeImage(dataUrl);
      if (warning) {
        setPendingImage(dataUrl);
        setScanWarning(warning);
      } else {
        transcribeImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const scanTips = [
    { icon: "📱", text: "Hold phone directly above" },
    { icon: "🎯", text: "Center the text in the frame" },
    { icon: "💡", text: "Use even lighting" },
    { icon: "🚫", text: "Avoid shadows" },
  ];

  if (composing) {
    return (
      <div className="px-5 pb-32 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setComposing(false); setNewTitle(""); setNewBody(""); }}
            className="flex items-center gap-2 font-semibold text-sm tap-active"
            style={{ color: colors.accent }}
          >
            <X size={16} /> Cancel
          </button>
          <button
            onClick={handleSaveEntry}
            disabled={!newBody.trim()}
            className="text-sm font-bold px-4 py-1.5 rounded-full text-white disabled:opacity-40 tap-active transition-opacity"
            style={{ background: colors.buttonBg }}
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

        {/* Scan handwriting button — ethereal style */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowScanTips(true)}
            disabled={scanning}
            className="group relative flex items-center gap-2.5 text-sm font-semibold px-6 py-3 rounded-full tap-active transition-all duration-300 disabled:opacity-50 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${colors.accentBg}, hsl(0 0% 100% / 0.9), ${colors.accentBg})`,
              color: colors.accent,
              boxShadow: `0 0 20px -4px ${colors.accent}40, 0 0 40px -8px ${colors.accent}20, inset 0 1px 1px hsl(0 0% 100% / 0.6)`,
              border: `1px solid ${colors.accent}30`,
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Shimmer sweep */}
            <span
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `linear-gradient(105deg, transparent 40%, ${colors.accent}15 45%, ${colors.accent}25 50%, ${colors.accent}15 55%, transparent 60%)`,
                animation: "shimmer 2.5s ease-in-out infinite",
              }}
            />
            {/* Glow dot */}
            <span
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full opacity-60"
              style={{
                background: `radial-gradient(circle, ${colors.accent}80, transparent 70%)`,
                animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            />
            {scanning ? (
              <>
                <Loader2 size={16} className="animate-spin relative z-10" />
                <span className="relative z-10">Scanning...</span>
              </>
            ) : (
              <>
                <Camera size={16} className="relative z-10" />
                <span className="relative z-10">Scan handwriting</span>
                <span className="relative z-10 text-xs opacity-50">✦</span>
              </>
            )}
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Scan tips dialog */}
        <Dialog open={showScanTips} onOpenChange={setShowScanTips}>
          <DialogContent className="rounded-3xl max-w-sm mx-auto">
            <DialogTitle className="text-center text-lg font-bold text-foreground">
              Scanning Tips
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              For the best results, follow these tips before taking a photo.
            </DialogDescription>
            <div className="space-y-3 py-2">
              {scanTips.map((tip, i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <span className="text-xl">{tip.icon}</span>
                  <span className="text-sm font-medium text-foreground">{tip.text}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowScanTips(false);
                fileInputRef.current?.click();
              }}
              className="w-full py-3 rounded-full text-white font-bold text-sm tap-active transition-opacity"
              style={{ background: colors.buttonBg }}
            >
              Open Camera
            </button>
          </DialogContent>
        </Dialog>

        {/* Quality warning dialog */}
        <Dialog open={!!scanWarning} onOpenChange={(open) => { if (!open) { setScanWarning(null); setPendingImage(null); } }}>
          <DialogContent className="rounded-3xl max-w-sm mx-auto">
            <DialogTitle className="text-center text-lg font-bold text-foreground">
              Image Quality Warning
            </DialogTitle>
            <DialogDescription className="text-center text-sm text-muted-foreground">
              {scanWarning}
            </DialogDescription>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setScanWarning(null);
                  setPendingImage(null);
                  fileInputRef.current?.click();
                }}
                className="flex-1 py-2.5 rounded-full text-sm font-bold bg-muted text-foreground tap-active"
              >
                Retake
              </button>
              <button
                onClick={() => {
                  setScanWarning(null);
                  if (pendingImage) transcribeImage(pendingImage);
                }}
                className="flex-1 py-2.5 rounded-full text-sm font-bold text-white tap-active"
                style={{ background: colors.buttonBg }}
              >
                Use Anyway
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const selectedEntry = entries.find((e) => e.id === selected);

  if (selectedEntry && editing) {
    return (
      <div className="px-5 pb-32 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setEditing(false)}
            className="flex items-center gap-2 font-semibold text-sm tap-active"
            style={{ color: colors.accent }}
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
            className="text-sm font-bold px-4 py-1.5 rounded-full text-white disabled:opacity-40 tap-active transition-opacity"
            style={{ background: colors.buttonBg }}
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
            className="flex items-center gap-2 font-semibold text-sm tap-active"
            style={{ color: colors.accent }}
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
                      selectedEntry.type === "personal" ? "amber-pill" : "blue-pill"
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
    <>
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
                ? ""
                : "text-muted-foreground bg-muted"
            }`}
            style={activeFilter !== "all" ? { color: colors.accent, background: colors.accentBg } : undefined}
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
                    {activeFilter === f.value && <Check size={14} style={{ color: colors.accent }} />}
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
          <div
            key={entry.id}
            onClick={() => setSelected(entry.id)}
            role="button"
            tabIndex={0}
            className="w-full bg-card rounded-3xl p-5 shadow-card text-left tap-active cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={
                      entry.type === "personal" ? "amber-pill" : "blue-pill"
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
                        ? ""
                        : "text-muted-foreground"
                    }
                    style={bookmarks[entry.id] ? { color: colors.accent, fill: colors.accent } : undefined}
                  />
                </button>
                <ChevronRight size={14} className="text-muted-foreground mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="h-2" />
    </div>

    {/* Floating Add Button */}
    <button
      onClick={(e) => { e.stopPropagation(); setComposing(true); }}
      className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center tap-active active:scale-95 transition-transform"
      style={{ background: colors.buttonBg, WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
    >
      <Plus size={24} />
    </button>
    </>
  );
}); // forwardRef

export default JournalTab;
