import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, BookText, CheckCircle2, Save, BookOpen, Heart, Users, X } from "lucide-react";
import { getAccentColors } from "./themeColors";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import CommunityPulse from "./CommunityPulse";
import type { SermonUIData } from "@/hooks/useCurrentSermon";
import type { FeatureFlags } from "@/hooks/useFeatureFlags";

const STARS = [
  { top: '8%', left: '8%', size: 2, opacity: 0.7, twinkle: true },
  { top: '10%', left: '25%', size: 1.5, opacity: 0.5 },
  { top: '7%', left: '42%', size: 2.5, opacity: 0.8, twinkle: true },
  { top: '12%', left: '55%', size: 1.5, opacity: 0.4 },
  { top: '9%', left: '70%', size: 2, opacity: 0.6 },
  { top: '6%', left: '85%', size: 1.5, opacity: 0.9, twinkle: true },
  { top: '14%', left: '15%', size: 1.5, opacity: 0.5 },
  { top: '16%', left: '35%', size: 2, opacity: 0.3 },
  { top: '13%', left: '62%', size: 2.5, opacity: 0.7, twinkle: true },
  { top: '17%', left: '78%', size: 1.5, opacity: 0.4 },
  { top: '11%', left: '92%', size: 2, opacity: 0.6 },
  { top: '19%', left: '5%', size: 1.5, opacity: 0.5, twinkle: true },
  { top: '15%', left: '48%', size: 2, opacity: 0.3 },
  { top: '20%', left: '88%', size: 1.5, opacity: 0.6 },
  { top: '18%', left: '22%', size: 2, opacity: 0.4 },
  { top: '21%', left: '58%', size: 1.5, opacity: 0.7, twinkle: true },
  { top: '8%', left: '38%', size: 1.5, opacity: 0.5 },
  { top: '23%', left: '72%', size: 2, opacity: 0.3 },
];

function Stars() {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-screen h-60 pointer-events-none overflow-hidden z-0">
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

function SunRays() {
  return (
    <div className="absolute top-0 right-0 w-full h-72 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute animate-sun-pulse"
        style={{
          top: '-10%',
          right: '-5%',
          width: '50%',
          height: '60%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, hsl(42 90% 70% / 0.35) 0%, hsl(38 100% 60% / 0.1) 50%, transparent 70%)',
        }}
      />
      <div
        className="absolute animate-sun-pulse"
        style={{
          top: '2%',
          right: '10%',
          width: '4px',
          height: '90px',
          borderRadius: '4px',
          background: 'linear-gradient(180deg, hsl(42 90% 75% / 0.5) 0%, transparent 100%)',
          transform: 'rotate(-25deg)',
          transformOrigin: 'top center',
          animationDelay: '0.5s',
        }}
      />
      <div
        className="absolute animate-sun-pulse"
        style={{
          top: '0%',
          right: '22%',
          width: '3px',
          height: '70px',
          borderRadius: '4px',
          background: 'linear-gradient(180deg, hsl(42 90% 75% / 0.4) 0%, transparent 100%)',
          transform: 'rotate(-40deg)',
          transformOrigin: 'top center',
          animationDelay: '1.2s',
        }}
      />
      <div
        className="absolute animate-sun-pulse"
        style={{
          top: '5%',
          right: '2%',
          width: '3px',
          height: '80px',
          borderRadius: '4px',
          background: 'linear-gradient(180deg, hsl(42 90% 75% / 0.45) 0%, transparent 100%)',
          transform: 'rotate(-10deg)',
          transformOrigin: 'top center',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute animate-sun-pulse"
        style={{
          top: '-2%',
          right: '15%',
          width: '30px',
          height: '120px',
          borderRadius: '50%',
          background: 'linear-gradient(180deg, hsl(42 85% 72% / 0.25) 0%, transparent 100%)',
          transform: 'rotate(-20deg)',
          transformOrigin: 'top center',
          animationDelay: '1.5s',
        }}
      />
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function getSkyGradientTopColor() {
  const hour = new Date().getHours();
  if (hour < 12) return "hsl(207, 65%, 62%)";
  if (hour < 17) return "hsl(210, 70%, 55%)";
  return "hsl(225, 55%, 22%)";
}

export function getSkyGradient() {
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

function getDailyPrompt(sermon: SermonUIData): string {
  const day = new Date().getDay();
  if (day === 0 || day === 6) return sermon.weekendReflection || "Look back on this week — what has God been teaching you?";
  const idx = day - 1; // Mon=0..Fri=4
  return sermon.reflectionQuestions[idx] || sermon.reflectionQuestions[0] || "";
}

interface DailyContent {
  spark_message: string;
  reflection_prompt: string;
}

const FALLBACK_SPARK = "Even when the path ahead looks a bit foggy, we can trust the One who is leading the way. Focus on taking just the next right step in faith — the rest will unfold as it should.";
const FALLBACK_REFLECTION = "What would look different in your week if you truly believed God was already in the middle of it?";

interface HomeTabProps {
  sermon: SermonUIData | null;
  isLoading?: boolean;
  featureFlags: FeatureFlags;
  onAddJournalEntry: (entry: any) => void;
  reflectedToday: boolean;
  userName?: string;
  churchName?: string;
  hasChurch?: boolean;
  onNavigate?: (screen: string) => void;
  churchId?: string;
  userId?: string;
  isDemo?: boolean;
}

export default function HomeTab({ sermon, isLoading, featureFlags, onAddJournalEntry, reflectedToday, userName = "there", churchName, hasChurch = true, onNavigate, churchId, userId, isDemo }: HomeTabProps) {
  const reflectionCardRef = useRef<HTMLDivElement>(null);
  const [reflectionOpen, setReflectionOpen] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const colors = getAccentColors();

  // Fetch AI-generated daily content for churchless users
  const { data: dailyContent, isLoading: isDailyContentLoading } = useQuery<DailyContent>({
    queryKey: ["daily-content"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-daily-content");
      if (error) throw error;
      return data as DailyContent;
    },
    enabled: !hasChurch,
    staleTime: 1000 * 60 * 60, // 1 hour
    retry: 1,
  });

  const completed = reflectedToday || justSaved;

  const handleSaveReflection = () => {
    if (!reflectionText.trim()) return;
    if (sermon) {
      onAddJournalEntry({
        content: reflectionText,
        title: sermon.title,
        entryType: "reflection",
        sermonId: sermon.id,
      });
    } else {
      // Churchless reflection
      onAddJournalEntry({
        content: reflectionText,
        title: "Daily Reflection",
        entryType: "reflection",
      });
    }
    setJustSaved(true);
    setReflectionOpen(false);
  };

  // Quick links filtered by feature flags
  const quickLinks = [
    { icon: BookOpen, label: "Bible", screen: "bible", visible: true },
    { icon: Heart, label: "Prayer", screen: "prayer", visible: featureFlags.prayer },
    { icon: Users, label: "Community", screen: "community", visible: featureFlags.community },
  ].filter((l) => l.visible);

  return (
    <div className="animate-fade-in min-h-screen relative">
      {new Date().getHours() >= 17 ? <Stars /> : null}
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

      {/* Churchless experience */}
      {!hasChurch && (
        <>
          {/* Daily Spark - AI generated */}
          <div style={{ filter: reflectionOpen ? 'blur(6px)' : 'none', opacity: reflectionOpen ? 0.3 : 1, transition: 'filter 0.4s ease, opacity 0.4s ease', pointerEvents: reflectionOpen ? 'none' as const : 'auto' as const }}>
          {isDailyContentLoading ? (
            <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : (
            <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
                  <Sparkles size={14} style={{ color: colors.accent }} />
                </div>
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Today's Spark
                </span>
              </div>
               <p className="text-foreground font-medium text-base leading-relaxed">
                {dailyContent?.spark_message || FALLBACK_SPARK}
              </p>
            </div>
          )}
          </div>

          {/* Guided Reflection - AI generated */}
          {isDailyContentLoading ? (
            <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="w-7 h-7 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : (
            <div ref={reflectionCardRef} style={{ position: 'relative', zIndex: reflectionOpen ? 10 : 'auto' as any, transform: reflectionOpen ? 'scale(1.01)' : 'scale(1)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
            <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: reflectionOpen ? '0 8px 32px -4px hsl(38 100% 47% / 0.18), 0 2px 12px hsl(220 25% 15% / 0.08)' : undefined }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
                  <BookText size={14} style={{ color: colors.accent }} />
                </div>
                <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                  Today's Reflection
                </span>
              </div>
              <p className="text-foreground font-medium text-base leading-relaxed">
                {dailyContent?.reflection_prompt || FALLBACK_REFLECTION}
              </p>

              {!completed && !reflectionOpen && (
                <button
                  onClick={() => { setReflectionOpen(true); setTimeout(() => { reflectionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }}
                   className="w-full mt-4 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity hover:opacity-90"
                   style={{ background: colors.buttonBg, boxShadow: colors.buttonShadow }}
                >
                  <BookText size={16} />
                  Reflect
                </button>
              )}

              {!completed && reflectionOpen && (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-end">
                    <button onClick={() => { setReflectionOpen(false); setReflectionText(""); }} className="p-1 rounded-full tap-active transition-opacity hover:opacity-70" aria-label="Close reflection">
                      <X size={18} className="text-muted-foreground" />
                    </button>
                  </div>
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
            </div>
          )}

          {/* Connect to a Church */}
          <div style={{ filter: reflectionOpen ? 'blur(6px)' : 'none', opacity: reflectionOpen ? 0.3 : 1, transition: 'filter 0.4s ease, opacity 0.4s ease', pointerEvents: reflectionOpen ? 'none' as const : 'auto' as const }}>
          <button
            onClick={() => onNavigate?.("community")}
            className="w-full rounded-3xl p-5 shadow-card text-left tap-active hover:opacity-90 transition-opacity"
            style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
                <Users size={18} style={{ color: colors.accent }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Connect to a Church</p>
                <p className="text-xs text-muted-foreground">Join a community for sermons, prayer & more</p>
              </div>
            </div>
          </button>
          </div>
        </>
      )}

      {/* Empty state when no sermon (has church but no sermon yet) */}
      {hasChurch && !isLoading && !sermon && (
        <div className="rounded-3xl p-6 shadow-card text-center" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: colors.accentBg }}>
            <Sparkles size={24} style={{ color: colors.accent }} />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Welcome to Faith Beyond Sundays</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your pastor hasn't uploaded a sermon yet. Once they do, you'll see daily sparks, reflections, and scripture right here.
          </p>
        </div>
      )}

      {/* Today's Spark */}
      {sermon && (
      <div style={{ filter: reflectionOpen ? 'blur(6px)' : 'none', opacity: reflectionOpen ? 0.3 : 1, transition: 'filter 0.4s ease, opacity 0.4s ease', pointerEvents: reflectionOpen ? 'none' as const : 'auto' as const }}>
      <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
            <Sparkles size={14} style={{ color: colors.accent }} />
          </div>
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            Today's Spark
          </span>
        </div>
        <p className="text-foreground font-medium text-base leading-relaxed">
          {sermon.spark}
        </p>
        <p className="text-muted-foreground text-xs mt-2 font-medium">
          From Sunday's sermon · {sermon.title}
        </p>
      </div>
      </div>
      )}

      {/* Today's Reflection */}
      {sermon && (
      <div ref={reflectionCardRef} style={{ position: 'relative', zIndex: reflectionOpen ? 10 : 'auto' as any, transform: reflectionOpen ? 'scale(1.01)' : 'scale(1)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' }}>
      <div className="rounded-3xl p-5 shadow-card" style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", boxShadow: reflectionOpen ? '0 8px 32px -4px hsl(38 100% 47% / 0.18), 0 2px 12px hsl(220 25% 15% / 0.08)' : undefined }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
            <BookText size={14} style={{ color: colors.accent }} />
          </div>
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            Today's Reflection
          </span>
        </div>
        <p className="text-foreground font-medium text-base leading-relaxed">
          {getDailyPrompt(sermon)}
        </p>
        <p className="text-muted-foreground text-xs mt-2 font-medium">
          From Sunday's sermon · {sermon.title}
        </p>

        {!completed && !reflectionOpen && (
          <button
            onClick={() => { setReflectionOpen(true); setTimeout(() => { reflectionCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100); }}
            className="w-full mt-4 flex items-center justify-center gap-2 text-primary-foreground font-semibold text-sm py-3 rounded-2xl tap-active transition-opacity hover:opacity-90"
            style={{ background: colors.buttonBg, boxShadow: colors.buttonShadow }}
          >
            <BookText size={16} />
            Reflect
          </button>
        )}

        {!completed && reflectionOpen && (
          <div className="mt-4 space-y-3">
            <div className="flex justify-end">
              <button onClick={() => { setReflectionOpen(false); setReflectionText(""); }} className="p-1 rounded-full tap-active transition-opacity hover:opacity-70" aria-label="Close reflection">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
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
      </div>
      )}

      {/* Community Pulse */}
      <div style={{ filter: reflectionOpen ? 'blur(6px)' : 'none', opacity: reflectionOpen ? 0.3 : 1, transition: 'filter 0.4s ease, opacity 0.4s ease', pointerEvents: reflectionOpen ? 'none' as const : 'auto' as const }}>
      <CommunityPulse
        churchId={churchId}
        userId={userId}
        isDemo={isDemo}
        locked={!hasChurch && !isDemo}
        onNavigate={onNavigate}
      />
      </div>

      {/* Quick Links */}
      <div style={{ filter: reflectionOpen ? 'blur(6px)' : 'none', opacity: reflectionOpen ? 0.3 : 1, transition: 'filter 0.4s ease, opacity 0.4s ease', pointerEvents: reflectionOpen ? 'none' as const : 'auto' as const }}>
      <div className={`grid gap-3`} style={{ gridTemplateColumns: `repeat(${quickLinks.length}, minmax(0, 1fr))` }}>
        {quickLinks.map(({ icon: Icon, label, screen }) => (
          <button
            key={screen}
            onClick={() => onNavigate?.(screen)}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 tap-active transition-opacity hover:opacity-90 shadow-card"
            style={{ background: "hsl(0 0% 100% / 0.8)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
          >
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: colors.accentBg }}>
              <Icon size={18} style={{ color: colors.accent }} />
            </div>
            <span className="text-xs font-semibold text-foreground">{label}</span>
          </button>
        ))}
      </div>
      </div>

      <div className="h-2" />
      </div>
    </div>
  );
}
