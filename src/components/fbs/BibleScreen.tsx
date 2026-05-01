import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Loader2, RefreshCw, ChevronDown, Check, Search, X } from "lucide-react";
import { useTheme } from "next-themes";
import { BIBLE_BOOKS, BIBLE_TRANSLATIONS, type BibleBook, type BibleTranslation } from "./bibleData";
import { useAccentColors } from "./themeColors";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

interface BibleScreenProps {
  onBack: () => void;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
  onViewChange?: (view: View) => void;
}

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

type View = "books" | "chapters" | "text";

export default function BibleScreen({ onBack, initialBook, initialChapter, initialVerse, onViewChange }: BibleScreenProps) {
  const colors = useAccentColors();
  const { user: authUser } = useAuth();
  const [view, setView] = useState<View>("books");
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<BibleTranslation>(
    BIBLE_TRANSLATIONS.find((t) => t.id === "kjv")!
  );
  const [showTranslationPicker, setShowTranslationPicker] = useState(false);
  const cache = useRef<Record<string, Verse[]>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [bookSearch, setBookSearch] = useState("");
  const { theme, setTheme } = useTheme();

  const changeView = (v: View) => {
    setView(v);
    onViewChange?.(v);
  };
  const [showReadingSettings, setShowReadingSettings] = useState(false);
  const [readingBg, setReadingBg] = useState<"white" | "sepia">(() =>
    (localStorage.getItem("bible-bg") as "white" | "sepia") || "white"
  );
  const [readingSize, setReadingSize] = useState<15 | 17 | 20>(() =>
    (Number(localStorage.getItem("bible-size")) as 15 | 17 | 20) || 17
  );
  const [readingFont, setReadingFont] = useState<"sans" | "serif">(() =>
    (localStorage.getItem("bible-font") as "sans" | "serif") || "sans"
  );

  const isNtOnly = translation.id === "ylt";
  const otBooks = isNtOnly ? [] : BIBLE_BOOKS.filter((b) => b.testament === "OT");
  const ntBooks = BIBLE_BOOKS.filter((b) => b.testament === "NT");

  const filteredOtBooks = useMemo(() => 
    otBooks.filter((b) => b.name.toLowerCase().includes(bookSearch.toLowerCase())), [bookSearch, isNtOnly]
  );
  const filteredNtBooks = useMemo(() => 
    ntBooks.filter((b) => b.name.toLowerCase().includes(bookSearch.toLowerCase())), [bookSearch]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [view, selectedBook, selectedChapter]);

  // Auto-navigate to a specific book/chapter/verse when deep-linking
  useEffect(() => {
    if (!initialBook) return;
    const book = BIBLE_BOOKS.find(
      (b) => b.name.toLowerCase() === initialBook.toLowerCase()
    );
    if (!book) return;
    setSelectedBook(book);
    const ch = initialChapter || 1;
    setSelectedChapter(ch);
    fetchChapter(book, ch);
    setView("text");
    onViewChange?.("text");
  }, [initialBook, initialChapter]);

  const logChapterRead = (book: BibleBook, chapter: number) => {
    if (!authUser) return;
    supabase.from("bible_reads" as any)
      .insert({ user_id: authUser.id, book: book.name, chapter })
      .then(({ error }) => { if (error && error.code !== "23505") console.error("bible_reads insert:", error); });
  };

  const fetchChapter = async (book: BibleBook, chapter: number) => {
    const cacheKey = `${translation.id}:${book.name}:${chapter}`;
    if (cache.current[cacheKey]) {
      setVerses(cache.current[cacheKey]);
      logChapterRead(book, chapter);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const encoded = encodeURIComponent(`${book.name} ${chapter}`);
      const res = await fetch(
        `https://bible-api.com/${encoded}?translation=${translation.id}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      const v: Verse[] = data.verses || [];
      cache.current[cacheKey] = v;
      setVerses(v);
      logChapterRead(book, chapter);
    } catch {
      setError("Couldn't load this chapter. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    if (book.chapters === 1) {
      setSelectedChapter(1);
      fetchChapter(book, 1);
      changeView("text");
    } else {
      changeView("chapters");
    }
  };

  const handleChapterSelect = (ch: number) => {
    setSelectedChapter(ch);
    fetchChapter(selectedBook!, ch);
    changeView("text");
  };

  const handleBack = () => {
    if (view === "text") {
      setShowReadingSettings(false);
      if (selectedBook && selectedBook.chapters === 1) {
        changeView("books");
        setSelectedBook(null);
      } else {
        changeView("chapters");
      }
      setVerses([]);
      setError(null);
    } else if (view === "chapters") {
      changeView("books");
      setSelectedBook(null);
    } else {
      onBack();
    }
  };

  const handleTranslationChange = (t: BibleTranslation) => {
    setTranslation(t);
    setShowTranslationPicker(false);
    scrollRef.current?.scrollTo(0, 0);
    window.scrollTo(0, 0);
    // If currently viewing text, re-fetch with new translation
    if (view === "text" && selectedBook && selectedChapter) {
      const cacheKey = `${t.id}:${selectedBook.name}:${selectedChapter}`;
      if (cache.current[cacheKey]) {
        setVerses(cache.current[cacheKey]);
      } else {
        // Need to fetch with new translation
        setLoading(true);
        setError(null);
        const encoded = encodeURIComponent(`${selectedBook.name} ${selectedChapter}`);
        fetch(`https://bible-api.com/${encoded}?translation=${t.id}`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed");
            return res.json();
          })
          .then((data) => {
            const v: Verse[] = data.verses || [];
            cache.current[cacheKey] = v;
            setVerses(v);
          })
          .catch(() => setError("Couldn't load this chapter."))
          .finally(() => setLoading(false));
      }
    }
  };

  const getNavTargets = () => {
    if (!selectedBook || !selectedChapter) return { prev: null, next: null };
    const books = isNtOnly ? ntBooks : [...otBooks, ...ntBooks];
    const bookIdx = books.findIndex((b) => b.name === selectedBook.name);
    if (bookIdx === -1) return { prev: null, next: null };

    let prev: { book: BibleBook; chapter: number } | null = null;
    if (selectedChapter > 1) {
      prev = { book: selectedBook, chapter: selectedChapter - 1 };
    } else if (bookIdx > 0) {
      const pb = books[bookIdx - 1];
      prev = { book: pb, chapter: pb.chapters };
    }

    let next: { book: BibleBook; chapter: number } | null = null;
    if (selectedChapter < selectedBook.chapters) {
      next = { book: selectedBook, chapter: selectedChapter + 1 };
    } else if (bookIdx < books.length - 1) {
      const nb = books[bookIdx + 1];
      next = { book: nb, chapter: 1 };
    }

    return { prev, next };
  };

  const handleNavigate = (book: BibleBook, chapter: number) => {
    setShowReadingSettings(false);
    setSelectedBook(book);
    setSelectedChapter(chapter);
    fetchChapter(book, chapter);
  };

  const handleBgSelect = (bg: "white" | "sepia" | "dark") => {
    if (bg === "dark") {
      setTheme("dark");
    } else {
      if (theme === "dark") setTheme("light");
      setReadingBg(bg);
      localStorage.setItem("bible-bg", bg);
    }
  };

  const handleSizeSelect = (size: 15 | 17 | 20) => {
    setReadingSize(size);
    localStorage.setItem("bible-size", String(size));
  };

  const handleFontSelect = (font: "sans" | "serif") => {
    setReadingFont(font);
    localStorage.setItem("bible-font", font);
  };

  const title =
    view === "text" && selectedBook
      ? `${selectedBook.name} ${selectedChapter}`
      : view === "chapters" && selectedBook
      ? selectedBook.name
      : "Bible";

  const renderBookList = () => (
    <div className="px-4 pb-6 space-y-6">
      {/* Translation Picker */}
      <div className="relative">
        <button
          onClick={() => setShowTranslationPicker(!showTranslationPicker)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/50 tap-active"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: colors.accentBg }}
            >
              <BookOpen size={16} style={{ color: colors.accent }} />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">{translation.shortName}</p>
              <p className="text-xs text-muted-foreground">{translation.name}</p>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`text-muted-foreground transition-transform ${showTranslationPicker ? "rotate-180" : ""}`}
          />
        </button>

        {showTranslationPicker && (
          <div className="mt-2 rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
            {BIBLE_TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTranslationChange(t)}
                className="w-full flex items-start gap-3 p-3 tap-active hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{t.shortName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
                </div>
                {translation.id === t.id && (
                  <Check size={16} style={{ color: colors.accent }} className="mt-0.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search books…"
          value={bookSearch}
          onChange={(e) => setBookSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {bookSearch && (
          <button
            onClick={() => setBookSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 tap-active"
          >
            <X size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Old Testament */}
      {filteredOtBooks.length > 0 && (
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          Old Testament
        </h3>
        <div className="space-y-1">
          {filteredOtBooks.map((book) => (
            <button
              key={book.name}
              onClick={() => handleBookSelect(book)}
              className="w-full flex items-center justify-between p-3 rounded-2xl tap-active hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{book.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{book.chapters} ch</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* New Testament */}
      {filteredNtBooks.length > 0 && (
      <div>
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
          New Testament
        </h3>
        <div className="space-y-1">
          {filteredNtBooks.map((book) => (
            <button
              key={book.name}
              onClick={() => handleBookSelect(book)}
              className="w-full flex items-center justify-between p-3 rounded-2xl tap-active hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-medium text-foreground">{book.name}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{book.chapters} ch</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </div>
      )}

      {filteredOtBooks.length === 0 && filteredNtBooks.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No books found for "{bookSearch}"</p>
      )}
    </div>
  );

  const renderChapterGrid = () => {
    if (!selectedBook) return null;
    const chapters = Array.from({ length: selectedBook.chapters }, (_, i) => i + 1);
    return (
      <div className="px-4 pb-6">
        <p className="text-xs text-muted-foreground mb-4 px-1">
          {selectedBook.chapters} chapters · {translation.shortName}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {chapters.map((ch) => (
            <button
              key={ch}
              onClick={() => handleChapterSelect(ch)}
              className="aspect-square rounded-2xl bg-muted/50 flex items-center justify-center text-sm font-semibold text-foreground tap-active hover:bg-muted transition-colors"
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderText = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading chapter…</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 px-4">
          <p className="text-sm text-muted-foreground text-center">{error}</p>
          <button
            onClick={() => selectedBook && selectedChapter && fetchChapter(selectedBook, selectedChapter)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold tap-active"
            style={{ background: colors.accentBg, color: colors.accent }}
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      );
    }
    return (
      <div className="px-5 pb-8">
        <p className="text-xs text-muted-foreground mb-4">{translation.shortName} · {translation.name}</p>
        <div
          className="space-y-1 leading-[1.85] text-foreground"
          style={{
            fontSize: readingSize,
            fontFamily: readingFont === "serif" ? "Georgia, 'Times New Roman', serif" : undefined,
            color: theme !== "dark" && readingBg === "sepia" ? "#3B2400" : undefined,
          }}
        >
          {verses.map((v) => (
            <span key={v.verse}>
              <sup className="text-[10px] font-bold text-muted-foreground mr-1 select-none">
                {v.verse}
              </sup>
              {v.text.trim()}{" "}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
          <button onClick={handleBack} className="tap-active p-1 -ml-1">
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">{title}</h1>
          {view === "text" && (
            <button
              onClick={() => { setShowTranslationPicker(!showTranslationPicker); setShowReadingSettings(false); }}
              className="px-3 py-1.5 rounded-full text-xs font-bold tap-active"
              style={{ background: colors.accentBg, color: colors.accent }}
            >
              {translation.shortName}
            </button>
          )}
        </div>
      </div>

      {/* Translation picker in text view */}
      {view === "text" && showTranslationPicker && (
        <div className="px-4 pb-3">
          <div className="rounded-2xl bg-card border border-border shadow-lg overflow-hidden">
            {BIBLE_TRANSLATIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTranslationChange(t)}
                className="w-full flex items-start gap-3 p-3 tap-active hover:bg-muted/50 transition-colors text-left border-b border-border last:border-b-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{t.shortName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
                </div>
                {translation.id === t.id && (
                  <Check size={16} style={{ color: colors.accent }} className="mt-0.5 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          ...(view === "text" && theme !== "dark" && readingBg === "sepia" ? { backgroundColor: "#FFF8DC" } : {}),
          ...(view === "text" ? { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" } : {}),
        }}
      >
        {view === "books" && renderBookList()}
        {view === "chapters" && renderChapterGrid()}
        {view === "text" && renderText()}
      </div>

      {/* Fixed reading toolbar — only in text view */}
      {view === "text" && (() => {
        const { prev, next } = getNavTargets();
        return (
          <>
            {/* Reading settings sheet — slides up above toolbar */}
            {showReadingSettings && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowReadingSettings(false)} />
                <div
                  className="fixed left-0 right-0 z-40 bg-card border-t border-border shadow-xl rounded-t-3xl px-5 pt-5 space-y-4"
                  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 64px)", paddingBottom: "20px" }}
                >
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Background</p>
                    <div className="flex gap-2">
                      {(["white", "sepia", "dark"] as const).map((opt) => {
                        const isSelected = opt === "dark" ? theme === "dark" : theme !== "dark" && readingBg === opt;
                        return (
                          <button key={opt} onClick={() => handleBgSelect(opt)}
                            className="flex-1 py-2.5 rounded-2xl text-sm font-semibold tap-active transition-colors"
                            style={isSelected ? { background: colors.accentBg, color: colors.accent } : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
                          >
                            {opt.charAt(0).toUpperCase() + opt.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Size</p>
                    <div className="flex gap-2">
                      {([15, 17, 20] as const).map((size, i) => (
                        <button key={size} onClick={() => handleSizeSelect(size)}
                          className="flex-1 py-2.5 rounded-2xl font-semibold tap-active transition-colors"
                          style={{
                            fontSize: i === 0 ? 12 : i === 1 ? 14 : 17,
                            ...(readingSize === size ? { background: colors.accentBg, color: colors.accent } : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }),
                          }}
                        >
                          {["A−", "A", "A+"][i]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Font</p>
                    <div className="flex gap-2">
                      {(["sans", "serif"] as const).map((font) => (
                        <button key={font} onClick={() => handleFontSelect(font)}
                          className="flex-1 py-2.5 rounded-2xl text-sm font-semibold tap-active transition-colors"
                          style={{
                            fontFamily: font === "serif" ? "Georgia, 'Times New Roman', serif" : undefined,
                            ...(readingFont === font ? { background: colors.accentBg, color: colors.accent } : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }),
                          }}
                        >
                          {font === "sans" ? "Sans" : "Serif"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Toolbar */}
            <div
              className="fixed left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border"
              style={{ bottom: 0, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
            >
              <div className="flex items-center px-5 py-2 gap-3">
                <div className="flex-1 min-w-0">
                  {prev && (
                    <button onClick={() => handleNavigate(prev.book, prev.chapter)}
                      className="flex items-center gap-1 tap-active max-w-full"
                    >
                      <ChevronLeft size={15} style={{ color: colors.accent }} className="shrink-0" />
                      <span className="text-xs font-semibold truncate" style={{ color: colors.accent }}>
                        {prev.book.name} {prev.chapter}
                      </span>
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowReadingSettings(!showReadingSettings)}
                  className="w-12 h-9 rounded-2xl flex items-center justify-center text-sm font-bold tap-active shrink-0"
                  style={showReadingSettings
                    ? { background: colors.accent, color: "white" }
                    : { background: colors.accentBg, color: colors.accent }
                  }
                >
                  Aa
                </button>
                <div className="flex-1 flex justify-end min-w-0">
                  {next && (
                    <button onClick={() => handleNavigate(next.book, next.chapter)}
                      className="flex items-center gap-1 tap-active max-w-full"
                    >
                      <span className="text-xs font-semibold truncate" style={{ color: colors.accent }}>
                        {next.book.name} {next.chapter}
                      </span>
                      <ChevronRight size={15} style={{ color: colors.accent }} className="shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
