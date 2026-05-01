import { useState, useEffect, useCallback } from "react";
import { Sparkles } from "lucide-react";
import { getSkyGradient } from "./HomeTab";
import { useTheme } from "next-themes";

const STORAGE_KEY = "fbs_spark_seen_date";
const CHAR_DELAY = 35;

const STARS = [
  { top: '6%', left: '10%', size: 2, opacity: 0.7, twinkle: true },
  { top: '10%', left: '30%', size: 1.5, opacity: 0.5 },
  { top: '5%', left: '50%', size: 2.5, opacity: 0.8, twinkle: true },
  { top: '14%', left: '65%', size: 1.5, opacity: 0.4 },
  { top: '8%', left: '80%', size: 2, opacity: 0.6 },
  { top: '18%', left: '15%', size: 1.5, opacity: 0.9, twinkle: true },
  { top: '12%', left: '45%', size: 2, opacity: 0.3 },
  { top: '20%', left: '75%', size: 2.5, opacity: 0.7, twinkle: true },
  { top: '16%', left: '90%', size: 1.5, opacity: 0.5 },
  { top: '22%', left: '35%', size: 2, opacity: 0.4 },
  { top: '25%', left: '60%', size: 1.5, opacity: 0.6, twinkle: true },
  { top: '3%', left: '88%', size: 1.5, opacity: 0.5 },
];

function OverlayStars() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {STARS.map((s, i) => (
        <div
          key={i}
          className={s.twinkle ? "animate-twinkle" : ""}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background: "white",
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function hasSeenToday() {
  try {
    return localStorage.getItem(STORAGE_KEY) === getTodayStr();
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, getTodayStr());
  } catch {}
}

interface DailySparkOverlayProps {
  sparkMessage: string;
}

export default function DailySparkOverlay({ sparkMessage }: DailySparkOverlayProps) {
  const { resolvedTheme } = useTheme();
  const [visible, setVisible] = useState(() => !hasSeenToday());
  const [fadingOut, setFadingOut] = useState(false);
  const [displayedChars, setDisplayedChars] = useState(0);
  const [typingDone, setTypingDone] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (!visible || !sparkMessage) return;
    if (displayedChars >= sparkMessage.length) {
      setTypingDone(true);
      return;
    }
    const timer = setTimeout(() => setDisplayedChars((c) => c + 1), CHAR_DELAY);
    return () => clearTimeout(timer);
  }, [visible, displayedChars, sparkMessage]);

  const dismiss = useCallback(() => {
    setFadingOut(true);
    markSeen();
    setTimeout(() => setVisible(false), 300);
  }, []);

  if (!visible || !sparkMessage) return null;

  const isEvening = new Date().getHours() >= 17;

  return (
    <div
      onClick={dismiss}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center cursor-pointer select-none"
      style={{
        background: resolvedTheme === "dark"
          ? `linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.4) 100%), linear-gradient(180deg, hsl(225, 45%, 8%) 0%, hsl(220, 40%, 14%) 60%, hsl(215, 35%, 20%) 100%)`
          : `linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.22) 100%), ${getSkyGradient()}`,
        opacity: fadingOut ? 0 : 1,
        transition: "opacity 300ms ease",
      }}
    >
      {isEvening && <OverlayStars />}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-8 max-w-lg">
        {/* Label */}
        <div className="flex items-center gap-2 mb-6">
          <Sparkles size={16} style={{ color: "hsl(0 0% 100% / 0.8)" }} />
          <span
            className="text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: "hsl(0 0% 100% / 0.7)" }}
          >
            Today's Spark
          </span>
        </div>

        {/* Message with typewriter */}
        <p
          className="text-center font-semibold leading-relaxed"
          style={{
            color: "hsl(0 0% 100%)",
            fontSize: "1.35rem",
            lineHeight: 1.6,
          }}
        >
          {sparkMessage.slice(0, displayedChars)}
          {!typingDone && (
            <span
              className="inline-block ml-0.5 animate-pulse"
              style={{
                width: 2,
                height: "1.2em",
                background: "hsl(0 0% 100% / 0.8)",
                verticalAlign: "text-bottom",
              }}
            />
          )}
        </p>
      </div>

      {/* Tap to continue */}
      <div
        className="pb-16 relative z-10"
        style={{
          opacity: typingDone ? 1 : 0,
          transition: "opacity 600ms ease",
        }}
      >
        <span
          className="text-sm font-medium"
          style={{ color: "hsl(0 0% 100% / 0.6)" }}
        >
          Tap to continue
        </span>
      </div>
    </div>
  );
}
