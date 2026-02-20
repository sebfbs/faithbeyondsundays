import { useState } from "react";
import { Sparkles, Target, CheckCircle2, Flame } from "lucide-react";
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

export default function HomeTab() {
  const [challengeAccepted, setChallengeAccepted] = useState(false);

  return (
    <div className="animate-fade-in">
      {/* Greeting — gradient header */}
      <div
        className="px-5 pt-10 pb-8"
        style={{
          background: "linear-gradient(160deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 50%, hsl(22, 55%, 88%) 100%)",
        }}
      >
        <h1 className="text-2xl font-bold leading-tight" style={{ color: "hsl(0 0% 100%)" }}>
          {getGreeting()}, Jordan ✨
        </h1>
        <p className="text-sm mt-1 font-medium" style={{ color: "hsl(207 60% 92%)" }}>{formatDate()}</p>
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
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
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

        <div className="mt-4">
          {!challengeAccepted ? (
            <button
              onClick={() => setChallengeAccepted(true)}
              className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
            >
              <CheckCircle2 size={16} />
              Accept Challenge
            </button>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 bg-amber-bg text-amber font-semibold text-sm py-3 rounded-2xl">
              <CheckCircle2 size={16} className="fill-amber text-primary-foreground" />
              Challenge Accepted!
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

      {/* Bottom spacer for nav */}
      <div className="h-2" />
      </div>
    </div>
  );
}

