import { useState } from "react";
import { Sparkles, Target, CheckCircle2, Flame, BookText, ChevronRight } from "lucide-react";
import { SERMON } from "./data";
import confetti from "canvas-confetti";
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
    // Morning: soft sunrise — light blue to warm peach to golden amber
    return "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 20%, hsl(22, 55%, 88%) 55%, hsl(40, 30%, 97%) 100%)";
  }
  if (hour < 17) {
    // Afternoon: bright midday — vivid blue to lighter blue to soft warm cream
    return "linear-gradient(180deg, hsl(210, 70%, 55%) 0%, hsl(210, 60%, 72%) 25%, hsl(205, 40%, 85%) 55%, hsl(40, 25%, 96%) 100%)";
  }
  // Evening: deep navy to medium blue to warm amber/orange horizon
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

type ChallengeStage = "idle" | "accepted" | "completed";

interface HomeTabProps {
  onGuidedReflection: () => void;
  userName?: string;
  churchName?: string;
}

export default function HomeTab({ onGuidedReflection, userName = "there", churchName }: HomeTabProps) {
  const [challengeStage, setChallengeStage] = useState<ChallengeStage>("idle");
  const colors = getAccentColors();

  return (
    <div
      className="animate-fade-in min-h-screen relative"
      style={{
        background: getSkyGradient(),
      }}
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
      <div className="bg-card rounded-3xl p-5 shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
            <Sparkles size={14} style={{ color: colors.accent }} />
          </div>
          <span
            className="text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: colors.pillBg, color: colors.pillText }}
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

      {/* This Week header */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "hsl(0 0% 100%)" }}>
          This Week
        </h2>
      </div>

      {/* Weekly Challenge */}
      <div className="bg-card rounded-3xl p-5 shadow-card -mt-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
            <Target size={14} style={{ color: colors.accent }} />
          </div>
          <span
            className="text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider"
            style={{ background: colors.pillBg, color: colors.pillText }}
          >
            Weekly Challenge
          </span>
        </div>
        <p className="text-foreground font-medium text-base leading-relaxed">
          {SERMON.weeklyChallenge}
        </p>
        <p className="text-muted-foreground text-xs mt-2 font-medium">
          Challenge drawn from Sunday's sermon · {SERMON.title}
        </p>

        <div className="mt-4 space-y-3">
          {challengeStage === "idle" && (
            <button
              onClick={() => setChallengeStage("accepted")}
              className="w-full flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity hover:opacity-90"
              style={{ background: colors.buttonBg, boxShadow: colors.buttonShadow }}
            >
              <CheckCircle2 size={16} />
              Accept Challenge
            </button>
          )}

          {challengeStage === "accepted" && (
            <>
              <div
                className="w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-2xl"
                style={{ background: colors.statusBg, color: colors.statusText }}
              >
                <CheckCircle2 size={16} style={{ fill: colors.accent, color: colors.accentFg }} />
                Challenge Accepted!
              </div>
              <button
                onClick={() => {
                  setChallengeStage("completed");
                  confetti({ particleCount: 120, spread: 80, origin: { x: 0.5, y: 0 }, gravity: 0.8, startVelocity: 45 });
                }}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity hover:opacity-90"
              >
                <CheckCircle2 size={16} />
                Mark as Complete
              </button>
            </>
          )}

          {challengeStage === "completed" && (
            <div
              className="w-full flex items-center justify-center gap-2 font-semibold text-sm py-2.5 rounded-2xl"
              style={{ background: colors.statusBg, color: colors.statusText }}
            >
              <CheckCircle2 size={16} style={{ fill: colors.accent, color: colors.accentFg }} />
              Challenge Completed! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Streak banner */}
      <div
        className="rounded-3xl p-5"
        style={{
          background: colors.streakGradient,
          border: colors.streakBorder,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: colors.streakIconBg }}>
            <Flame size={18} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Ready to start your challenge streak?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete 7 challenges to earn your first badge
            </p>
          </div>
        </div>
      </div>

      {/* Guided Reflection */}
      <button
        onClick={onGuidedReflection}
        className="w-full bg-card rounded-3xl p-5 shadow-card flex items-center justify-between tap-active text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: colors.accentBg }}>
            <BookText size={17} style={{ color: colors.accent }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Guided Reflection
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Journal prompts for this sermon
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>

      {/* Bottom spacer for nav */}
      <div className="h-2" />
      </div>
    </div>
  );
}

