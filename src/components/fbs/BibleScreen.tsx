import { useState, useRef, useEffect, useMemo } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Loader2, RefreshCw, ChevronDown, Check, Search, X } from "lucide-react";
import { BIBLE_BOOKS, BIBLE_TRANSLATIONS, type BibleBook, type BibleTranslation } from "./bibleData";
import { getAccentColors } from "./themeColors";

interface BibleScreenProps {
  onBack: () => void;
  initialBook?: string;
  initialChapter?: number;
  initialVerse?: number;
}

interface Verse {
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

type View = "books" | "chapters" | "text";

export default function BibleScreen({ onBack, initialBook, initialChapter, initialVerse }: BibleScreenProps) {
  const colors = getAccentColors();
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
  }, [initialBook, initialChapter]);

  const fetchChapter = async (book: BibleBook, chapter: number) => {
    const cacheKey = `${translation.id}:${book.name}:${chapter}`;
    if (cache.current[cacheKey]) {
      setVerses(cache.current[cacheKey]);
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
      setView("text");
    } else {
      setView("chapters");
    }
  };

  const handleChapterSelect = (ch: number) => {
    setSelectedChapter(ch);
    fetchChapter(selectedBook!, ch);
    setView("text");
  };

  const handleBack = () => {
    if (view === "text") {
      if (selectedBook && selectedBook.chapters === 1) {
        setView("books");
        setSelectedBook(null);
      } else {
        setView("chapters");
      }
      setVerses([]);
      setError(null);
    } else if (view === "chapters") {
      setView("books");
      setSelectedBook(null);
    } else {
      onBack();
    }
  };

  const handleTranslationChange = (t: BibleTranslation) => {
    setTranslation(t);
    setShowTranslationPicker(false);
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
        <div className="space-y-1 leading-[1.85] text-[15px] text-foreground">
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
              onClick={() => setShowTranslationPicker(!showTranslationPicker)}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {view === "books" && renderBookList()}
        {view === "chapters" && renderChapterGrid()}
        {view === "text" && renderText()}
      </div>
    </div>
  );
}
