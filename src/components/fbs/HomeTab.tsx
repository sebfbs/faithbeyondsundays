import { useState } from "react";
import { Sparkles, Target, CheckCircle2, Flame, BookText, ChevronRight } from "lucide-react";
import { SERMON } from "./data";


function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
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

  return (
    <div
      className="animate-fade-in min-h-screen"
      style={{
        background: "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 20%, hsl(22, 55%, 88%) 55%, hsl(40, 30%, 97%) 100%)",
      }}
    >
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
          <div className="w-7 h-7 rounded-full bg-amber-bg flex items-center justify-center">
            <Sparkles size={14} className="text-amber" />
          </div>
          <span className="amber-pill">Today's Spark</span>
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
          <div className="w-7 h-7 rounded-full bg-amber-bg flex items-center justify-center">
            <Target size={14} className="text-amber" />
          </div>
          <span className="amber-pill">Weekly Challenge</span>
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
              className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
            >
              <CheckCircle2 size={16} />
              Accept Challenge
            </button>
          )}

          {challengeStage === "accepted" && (
            <>
              <div className="w-full flex items-center justify-center gap-2 bg-amber-bg text-amber font-semibold text-sm py-3 rounded-2xl">
                <CheckCircle2 size={16} className="fill-amber text-primary-foreground" />
                Challenge Accepted!
              </div>
              <button
                onClick={() => setChallengeStage("completed")}
                className="w-full flex items-center justify-center gap-2 bg-foreground text-background font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity hover:opacity-90"
              >
                <CheckCircle2 size={16} />
                Mark as Complete
              </button>
            </>
          )}

          {challengeStage === "completed" && (
            <div className="w-full flex items-center justify-center gap-2 bg-amber-bg text-amber font-semibold text-sm py-2.5 rounded-2xl">
              <CheckCircle2 size={16} className="fill-amber text-primary-foreground" />
              Challenge Completed! 🎉
            </div>
          )}
        </div>
      </div>

      {/* Streak banner */}
      <div
        className="rounded-3xl p-5"
        style={{
          background:
            "linear-gradient(135deg, hsl(38 100% 95%) 0%, hsl(38 80% 90%) 100%)",
          border: "1.5px solid hsl(38 100% 85%)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber flex items-center justify-center flex-shrink-0">
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
          <div className="w-9 h-9 rounded-2xl bg-amber-bg flex items-center justify-center">
            <BookText size={17} className="text-amber" />
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

