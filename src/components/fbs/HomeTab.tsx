import { useState } from "react";
import { Sparkles, BookText, CheckCircle2, Save } from "lucide-react";
import { SERMON } from "./data";
import { getAccentColors } from "./themeColors";

const STARS = [
  { top: '3%', left: '8%', size: 2, opacity: 0.7, twinkle: true },
  { top: '5%', left: '25%', size: 1.5, opacity: 0.5 },
  { top: '2%', left: '42%', size: 2.5, opacity: 0.8, twinkle: true },
  { top: '7%', left: '55%', size: 1.5, opacity: 0.4 },
  { top: '4%', left: '70%', size: 2, opacity: 0.6 },
  { top: '1%', left: '85%', size: 1.5, opacity: 0.9, twinkle: true },
  { top: '9%', left: '15%', size: 1.5, opacity: 0.5 },
  { top: '11%', left: '35%', size: 2, opacity: 0.3 },
  { top: '8%', left: '62%', size: 2.5, opacity: 0.7, twinkle: true },
  { top: '12%', left: '78%', size: 1.5, opacity: 0.4 },
  { top: '6%', left: '92%', size: 2, opacity: 0.6 },
  { top: '14%', left: '5%', size: 1.5, opacity: 0.5, twinkle: true },
  { top: '10%', left: '48%', size: 2, opacity: 0.3 },
  { top: '15%', left: '88%', size: 1.5, opacity: 0.6 },
  { top: '13%', left: '22%', size: 2, opacity: 0.4 },
  { top: '16%', left: '58%', size: 1.5, opacity: 0.7, twinkle: true },
  { top: '3%', left: '38%', size: 1.5, opacity: 0.5 },
  { top: '18%', left: '72%', size: 2, opacity: 0.3 },
];

function Stars() {
  return (
    <div className="absolute top-0 left-0 w-full h-60 pointer-events-none overflow-hidden z-0">
      {STARS.map((s, i) => (
        <div
          key={i}
          className={s.twinkle ? 'animate-twinkle' : ''}
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: '50%',
            background: 'white',
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getSkyGradient() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 20%, hsl(22, 55%, 88%) 55%, hsl(40, 30%, 97%) 100%)";
  }
  if (hour < 17) {
    return "linear-gradient(180deg, hsl(210, 70%, 55%) 0%, hsl(210, 60%, 72%) 25%, hsl(205, 40%, 85%) 55%, hsl(40, 25%, 96%) 100%)";
  }
  return "linear-gradient(180deg, hsl(225, 55%, 22%) 0%, hsl(220, 50%, 38%) 25%, hsl(215, 40%, 55%) 50%, hsl(30, 70%, 60%) 80%, hsl(35, 80%, 65%) 100%)";
}

function formatDate() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDailyPromptIndex(): number {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return -1; // weekend
  return day - 1; // Mon=0, Tue=1, Wed=2, Thu=3, Fri=4
}

function getDailyPrompt(): string {
  const idx = getDailyPromptIndex();
  if (idx === -1) return SERMON.weekendReflection;
  return SERMON.reflectionQuestions[idx] || SERMON.reflectionQuestions[0];
}

interface HomeTabProps {
  onAddJournalEntry: (entry: any) => void;
  reflectedToday: boolean;
  userName?: string;
  churchName?: string;
}

export default function HomeTab({ onAddJournalEntry, reflectedToday, userName = "there", churchName }: HomeTabProps) {
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const colors = getAccentColors();

  const completed = reflectedToday || justSaved;

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) return;
    const now = new Date();
    onAddJournalEntry({
      id: `reflection-${Date.now()}`,
      date: now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      type: "sermon" as const,
      tag: "Sermon",
      preview: reflectionText.slice(0, 120) + (reflectionText.length > 120 ? "..." : ""),
      sermonTitle: SERMON.title,
      bookmarked: false,
      fullText: reflectionText,
    });
    setJustSaved(true);
    setReflectionOpen(false);
  };

  return (
    <div
      className="animate-fade-in min-h-screen relative"
      style={{ background: getSkyGradient() }}
    >
      {new Date().getHours() >= 17 && <Stars />}
      {/* Greeting */}
      <div className="px-5 pb-2" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <h1 className="text-2xl font-bold leading-tight" style={{ color: "hsl(0 0% 100%)" }}>
          {getGreeting()}, {userName}
        </h1>
        {churchName && (
          <p className="text-sm mt-0.5 font-medium" style={{ color: "hsl(0 0% 100% / 0.85)" }}>{churchName}</p>
        )}
        <p className="text-sm mt-0.5 font-medium" style={{ color: "hsl(207 60% 92%)" }}>{formatDate()}</p>
      </div>

      <div className="px-5 pt-6 pb-6 space-y-6">

      {/* Today's Spark */}
      <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
            <Sparkles size={14} style={{ color: colors.accent }} />
          </div>
          <span
            className="text-[0.7rem] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: colors.accentBg, color: colors.accent }}
          >
            Today's Spark
          </span>
        </div>
        <p className="text-foreground font-medium text-base leading-relaxed italic">
          "{SERMON.spark}"
        </p>
        <p className="text-muted-foreground text-xs mt-2 font-medium">
          From Sunday's sermon · {SERMON.title}
        </p>
      </div>

      {/* Today's Reflection */}
      <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
            <BookText size={14} style={{ color: colors.accent }} />
          </div>
          <span
            className="text-[0.7rem] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: colors.accentBg, color: colors.accent }}
          >
            Today's Reflection
          </span>
        </div>
        <p className="text-foreground font-medium text-base leading-relaxed">
          {getDailyPrompt()}
        </p>
        <p className="text-muted-foreground text-xs mt-2 font-medium">
          From Sunday's sermon · {SERMON.title}
        </p>

        {!completed && !reflectionOpen && (
          <button
            onClick={() => setReflectionOpen(true)}
            className="w-full mt-4 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity hover:opacity-90"
            style={{ background: colors.buttonBg, boxShadow: colors.buttonShadow }}
          >
            <BookText size={16} />
            Reflect
          </button>
        )}

        {!completed && reflectionOpen && (
          <div className="mt-4 space-y-3">
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write your thoughts and reflections here..."
              className="w-full h-32 text-sm text-foreground bg-transparent resize-none outline-none placeholder:text-muted-foreground leading-relaxed rounded-2xl p-3"
              style={{ background: "hsl(40 25% 97%)" }}
              autoFocus
            />
            <button
              onClick={handleSaveReflection}
              disabled={!reflectionText.trim()}
              className="w-full flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity disabled:opacity-40"
              style={{ background: colors.buttonBg, boxShadow: reflectionText.trim() ? colors.buttonShadow : "none" }}
            >
              <Save size={15} />
              Save Reflection
            </button>
          </div>
        )}

        {completed && (
          <div className="mt-4 flex items-center gap-2" style={{ color: colors.statusText }}>
            <CheckCircle2 size={18} style={{ fill: colors.accent, color: colors.accentFg }} />
            <span className="text-sm font-semibold">Reflected today</span>
            <span className="text-xs text-muted-foreground ml-auto">View in Journal →</span>
          </div>
        )}
      </div>

      {/* Bottom spacer for nav */}
      <div className="h-2" />
      </div>
    </div>
  );
}
