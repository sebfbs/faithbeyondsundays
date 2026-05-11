import { useState, useEffect } from "react";
import { ArrowRight, Check, X, Loader2, Phone, User, Sparkles, BookOpen, PenLine, Users, Bell, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useNotificationPreferences, NotificationType } from "@/hooks/useNotificationPreferences";
import { Switch } from "@/components/ui/switch";
import confetti from "canvas-confetti";

type Step = "details" | "username" | "tour1" | "tour2a" | "tour2" | "tour3" | "tour4" | "tour5";

const STEPS: Step[] = ["details", "username", "tour1", "tour2a", "tour2", "tour3", "tour4", "tour5"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_OPTIONS = [
  { label: "Morning", time: "8 AM" },
  { label: "Midday", time: "12 PM" },
  { label: "Evening", time: "6 PM" },
];

function ProgressDots({ current }: { current: Step }) {
  const idx = STEPS.indexOf(current);
  return (
    <div className="flex justify-center gap-1.5 mb-6">
      {STEPS.map((s, i) => (
        <div
          key={s}
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: i === idx ? 20 : 6,
            background: i <= idx ? "hsl(var(--amber))" : "hsl(var(--border))",
          }}
        />
      ))}
    </div>
  );
}

interface NotificationSetupProps {
  type: NotificationType;
  enabled: boolean;
  days: string[];
  time: string;
  onToggle: (enabled: boolean) => void;
  onDaysChange: (days: string[]) => void;
  onTimeChange: (time: string) => void;
}

function NotificationSetup({ enabled, days, time, onToggle, onDaysChange, onTimeChange }: NotificationSetupProps) {
  const toggleDay = (day: string) => {
    onDaysChange(
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day]
    );
  };

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between bg-card rounded-2xl px-4 py-3 shadow-card">
        <div className="flex items-center gap-2.5">
          <Bell size={16} className="text-amber" />
          <span className="text-sm font-semibold text-foreground">Notifications</span>
        </div>
        <Switch checked={enabled} onCheckedChange={onToggle} />
      </div>

      {enabled && (
        <>
          {/* Day pills */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 ml-1">Pick your days</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map((day) => {
                const active = days.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors tap-active ${
                      active
                        ? "bg-amber text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time selector */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 ml-1">Time of day</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map(({ label, time: t }) => {
                const value = `${label} (${t})`;
                const isSelected = time === value;
                return (
                  <button
                    key={label}
                    onClick={() => onTimeChange(value)}
                    className={`flex flex-col items-center py-2.5 rounded-2xl text-xs font-semibold transition-colors tap-active ${
                      isSelected
                        ? "bg-amber text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock size={14} className="mb-0.5" />
                    <span>{label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(() => {
    const param = new URLSearchParams(window.location.search).get("step");
    return (STEPS.includes(param as Step) ? param : "details") as Step;
  });

  const [churchIdFromUrl] = useState(() => new URLSearchParams(window.location.search).get("church_id"));

  // Details step
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Username step
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [saving, setSaving] = useState(false);


  // Notification preferences for tour cards
  const { preferences, updatePreference } = useNotificationPreferences();

  // Local state for spark notification setup
  const [sparkEnabled, setSparkEnabled] = useState(true);
  const [sparkDays, setSparkDays] = useState(DAYS);
  const [sparkTime, setSparkTime] = useState("Morning (8 AM)");

  // Sync local state from preferences when loaded
  useEffect(() => {
    const spark = preferences.find((p) => p.notification_type === "daily_spark");
    if (spark) {
      setSparkEnabled(spark.enabled);
      setSparkDays(spark.days || DAYS);
      setSparkTime(spark.preferred_time || "Morning (8 AM)");
    }
  }, [preferences]);

  // Validate username
  useEffect(() => {
    if (username.length < 3) {
      setUsernameError(username.length > 0 ? "Username must be at least 3 characters" : null);
      return;
    }
    if (!/^[a-z0-9_]+$/.test(username)) {
      setUsernameError("Only lowercase letters, numbers, and underscores");
      return;
    }

    setCheckingUsername(true);
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();
      setUsernameError(data ? "Username is already taken" : null);
      setCheckingUsername(false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [username]);

  const handleUsernameChange = (value: string) => {
    setUsername(value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20));
  };

  const handleClaimUsername = async () => {
    if (!user || !username || usernameError) return;
    setSaving(true);

    const churchId = churchIdFromUrl || localStorage.getItem("fbs_church_id") || null;
    const joinedVia = localStorage.getItem("fbs_joined_via") || "church_link";

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      church_id: churchId,
      joined_via: joinedVia,
      username,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      phone_number: phoneNumber.trim() || null,
      avatar_url: null,
      onboarding_complete: true,
    });

    if (error) {
      console.error("Profile creation error:", error);
      setUsernameError(error.message.includes("unique") ? "Username is already taken" : "Something went wrong. Please try again.");
      setSaving(false);
    } else {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#e09a00", "#f5c542", "#38bdf8", "#ffffff"],
      });
      setTimeout(() => setStep("tour1"), 800);
    }
  };

  const handleSaveSparkPrefs = () => {
    updatePreference("daily_spark", {
      enabled: sparkEnabled,
      days: sparkEnabled ? sparkDays : null,
      preferred_time: sparkEnabled ? sparkTime : null,
    });
    setStep("tour3");
  };

  const displayUsername = username || "yourname";

  // ─── Details step ───
  if (step === "details") {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pb-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}>
          <ProgressDots current="details" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-bg flex items-center justify-center">
              <User size={18} className="text-amber" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">About You</h1>
              <p className="text-xs text-muted-foreground">Tell us a bit about yourself</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              maxLength={50}
              className="bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              maxLength={50}
              className="bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number (optional)"
              maxLength={20}
              className="w-full bg-card rounded-2xl pl-11 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
            />
          </div>
          <p className="text-xs text-muted-foreground ml-1">
            Your phone number is private by default.
          </p>
        </div>

        <div className="pb-12 pt-6">
          <button
            onClick={() => setStep("username")}
            disabled={!firstName.trim() || !lastName.trim()}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-30"
          >
            Continue
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Username step (ethereal) ───
  if (step === "username") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative !max-w-[430px] mx-auto">
        {/* Aurora background */}
        <div className="fixed inset-0 animate-aurora-bg" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="bg-card/95 backdrop-blur-sm rounded-3xl animate-fade-in animate-shimmer-border shadow-xl p-6 space-y-6">
            <div className="text-center space-y-3">
              <ProgressDots current="username" />
              <h1 className="text-2xl font-bold text-card-foreground tracking-tight">Claim Your @</h1>
              <p className="text-sm text-muted-foreground">Every great name is still available. Pick yours.</p>
            </div>

            {/* Live username preview */}
            <div className="flex justify-center">
              <span
                className="text-3xl font-bold tracking-tight transition-all duration-300 bg-gradient-to-r from-amber-400 via-yellow-400 to-sky-400 bg-clip-text text-transparent"
                style={{ transform: username.trim() ? "scale(1.05)" : "scale(1)" }}
              >
                @{displayUsername}
              </span>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-lg font-semibold">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="yourname"
                  maxLength={20}
                  autoFocus
                  className={`w-full bg-muted/50 rounded-2xl pl-9 pr-12 py-4 text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber/40 ${
                    usernameError && username.length >= 3 ? "ring-2 ring-destructive/50" : ""
                  } ${!usernameError && !checkingUsername && username.length >= 3 ? "ring-2 ring-emerald-400/50" : ""}`}
                />
                {username.length >= 3 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2">
                    {checkingUsername ? (
                      <Loader2 size={16} className="animate-spin text-muted-foreground" />
                    ) : usernameError ? (
                      <X size={16} className="text-destructive" />
                    ) : (
                      <Check size={16} className="text-emerald-500" />
                    )}
                  </span>
                )}
              </div>
              {usernameError && username.length >= 3 && (
                <p className="text-xs text-destructive text-center">{usernameError}</p>
              )}
              {!usernameError && !checkingUsername && username.length >= 3 && (
                <p className="text-xs text-emerald-600 text-center">Username is available!</p>
              )}
              <p className="text-xs text-muted-foreground text-center">Letters, numbers, and underscores only</p>
            </div>

            <button
              onClick={handleClaimUsername}
              disabled={!username || !!usernameError || checkingUsername || saving}
              className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : null}
              Claim @{displayUsername}
            </button>

            <button onClick={() => setStep("details")} className="w-full text-sm font-medium text-muted-foreground tap-active text-center">
              ← Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tour Card wrapper ───
  const TourCard = ({
    icon,
    iconGradient,
    headline,
    description,
    children,
    buttonLabel,
    onNext,
    currentStep,
  }: {
    icon: React.ReactNode;
    iconGradient: string;
    headline: string;
    description: string;
    children?: React.ReactNode;
    buttonLabel: string;
    onNext: () => void;
    currentStep: Step;
  }) => (
    <div
      className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}>
        <ProgressDots current={currentStep} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mb-6 ${iconGradient}`}>
          {icon}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3 leading-tight max-w-[300px]">{headline}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-[320px] mb-6">{description}</p>
        {children}
      </div>

      <div className="pb-12 pt-6">
        <button
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
        >
          {buttonLabel}
          {buttonLabel !== "Let's Go" && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );

  // ─── Tour 1: Stay connected between Sundays ───
  if (step === "tour1") {
    return (
      <TourCard
        currentStep="tour1"
        icon={<Sparkles size={36} style={{ color: "hsl(var(--amber))" }} />}
        iconGradient="bg-muted/50"
        headline="Stay connected between Sundays."
        description="Daily content, scripture, and community — all in one place."
        buttonLabel="Next"
        onNext={() => setStep("tour2a")}
      />
    );
  }

  // ─── Tour 2a: Daily Sparks intro (visual) ───
  if (step === "tour2a") {
    const churchName = "Your Church";
    const initial = churchName[0].toUpperCase();
    const logoUrl = null;

    const tour2aStyles = `
      @keyframes notifPop {
        0%   { opacity: 0; transform: translateY(14px) scale(0.9); }
        65%  { opacity: 1; transform: translateY(-3px) scale(1.03); }
        100% { opacity: 1; transform: translateY(0)   scale(1); }
      }
    `;

    const hour = new Date().getHours();
    const skyGradient = hour < 12
      ? "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 20%, hsl(22, 55%, 88%) 55%, hsl(40, 30%, 97%) 100%)"
      : hour < 17
      ? "linear-gradient(180deg, hsl(210, 70%, 55%) 0%, hsl(210, 60%, 72%) 25%, hsl(205, 40%, 85%) 55%, hsl(40, 25%, 96%) 100%)"
      : "linear-gradient(180deg, hsl(225, 55%, 22%) 0%, hsl(220, 50%, 38%) 25%, hsl(215, 40%, 55%) 50%, hsl(30, 70%, 60%) 80%, hsl(35, 80%, 65%) 100%)";
    const isNight = hour >= 17;

    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <style>{tour2aStyles}</style>
        <div className="pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}>
          <ProgressDots current="tour2a" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h1 className="text-2xl font-bold text-foreground mb-2 leading-tight">Daily Sparks</h1>
          <p className="text-sm text-muted-foreground mb-8">A daily nudge from Sunday's sermon.</p>

          {/* iPhone mockup */}
          <div className="relative mx-auto mb-8" style={{ width: 265 }}>
            {/* Volume buttons */}
            <div className="absolute" style={{ left: -5, top: 84, width: 4, height: 26, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ left: -5, top: 118, width: 4, height: 46, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ left: -5, top: 172, width: 4, height: 46, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            {/* Power button */}
            <div className="absolute" style={{ right: -5, top: 126, width: 4, height: 68, background: "#3a3a3a", borderRadius: "0 2px 2px 0" }} />

            {/* Phone shell — clipped mid-body so bottom corners never show */}
            <div style={{ overflow: "hidden", maxHeight: 265, borderRadius: "46px 46px 0 0", maskImage: "linear-gradient(to bottom, black 85%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 85%, transparent 100%)" }}>
              <div style={{ borderRadius: 46, border: "10px solid #1e1e1e", background: "#1e1e1e", overflow: "hidden", height: 560, boxShadow: "0 28px 64px rgba(0,0,0,0.5)" }}>
                {/* Screen */}
                <div style={{ borderRadius: 37, overflow: "hidden", background: skyGradient, position: "relative", height: "100%" }}>
                  {/* Notch */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div style={{ width: 110, height: 24, background: "#1e1e1e", borderRadius: "0 0 18px 18px" }} />
                  </div>
                  {/* Time */}
                  <div className="text-center pt-2 pb-4 px-4">
                    <p className={`leading-none ${isNight ? "text-white" : "text-black/75"}`} style={{ fontSize: 56, fontWeight: 200, letterSpacing: -2 }}>9:41</p>
                    <p className={`text-xs mt-1.5 ${isNight ? "text-white/70" : "text-black/55"}`}>Monday, April 28</p>
                  </div>
                  {/* Notification card */}
                  <div className="mx-4 mb-4 rounded-2xl overflow-hidden text-left" style={{ background: "rgba(220,220,220,0.82)", backdropFilter: "blur(24px)", animation: "notifPop 0.45s ease-out 0.5s both" }}>
                    <div className="px-3.5 pt-3 pb-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="w-5 h-5 rounded-md object-cover shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white font-bold" style={{ background: "hsl(var(--amber))", fontSize: 9 }}>
                            {initial}
                          </div>
                        )}
                        <span className="text-gray-500 font-semibold uppercase tracking-wide flex-1 truncate" style={{ fontSize: 9 }}>{churchName}</span>
                        <span className="text-gray-400 shrink-0" style={{ fontSize: 9 }}>now</span>
                      </div>
                      <p className="text-gray-900 font-medium leading-snug" style={{ fontSize: 12 }}>Grace meets you in the storm, not on the other side of it.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-12 pt-4 space-y-3">
          <button
            onClick={() => { setSparkEnabled(true); setStep("tour2"); }}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
          >
            Turn on Daily Sparks
            <ArrowRight size={16} />
          </button>
          <button
            onClick={() => { setSparkEnabled(false); setStep("tour3"); }}
            className="w-full text-sm font-medium text-muted-foreground tap-active text-center py-2"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // ─── Tour 2: Daily Sparks (inlined to prevent remount on state change) ───
  if (step === "tour2") {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.5rem)" }}>
          <ProgressDots current="tour2" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h1 className="text-2xl font-bold text-foreground mb-1 leading-tight">When do you want them?</h1>
          <p className="text-sm text-muted-foreground mb-6">Pick the days and time that work for you.</p>
          <div className="w-full text-left space-y-4">
            {/* Day pills */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 ml-1">Pick your days</p>
              <div className="flex flex-wrap gap-1.5">
                {DAYS.map((day) => {
                  const active = sparkDays.includes(day);
                  return (
                    <button
                      key={day}
                      onClick={() => setSparkDays(active ? sparkDays.filter(d => d !== day) : [...sparkDays, day])}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors tap-active ${
                        active ? "bg-amber text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time selector */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 ml-1">Time of day</p>
              <div className="grid grid-cols-3 gap-2">
                {TIME_OPTIONS.map(({ label, time: t }) => {
                  const value = `${label} (${t})`;
                  const isSelected = sparkTime === value;
                  return (
                    <button
                      key={label}
                      onClick={() => setSparkTime(value)}
                      className={`flex flex-col items-center py-2.5 rounded-2xl text-xs font-semibold transition-colors tap-active ${
                        isSelected ? "bg-amber text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Clock size={14} className="mb-0.5" />
                      <span>{label}</span>
                      <span className={`text-[10px] mt-0.5 ${isSelected ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>{t}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 ml-1">You can change these anytime in your profile settings.</p>
            </div>
          </div>
        </div>

        <div className="pb-12 pt-6">
          <button
            onClick={handleSaveSparkPrefs}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
          >
            Next
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Tour 3: Reflect. Write. Grow. ───
  if (step === "tour3") {
    return (
      <TourCard
        currentStep="tour3"
        icon={<PenLine size={36} style={{ color: "#a78bfa" }} />}
        iconGradient="bg-muted/50"
        headline="Reflect. Write. Grow."
        description="Daily prompts and a personal journal to help your faith go deeper."
        buttonLabel="Next"
        onNext={() => setStep("tour4")}
      />
    );
  }

  // ─── Tour 4: The Word, Always With You ───
  if (step === "tour4") {
    return (
      <TourCard
        currentStep="tour4"
        icon={<BookOpen size={36} style={{ color: "#60a5fa" }} />}
        iconGradient="bg-muted/50"
        headline="The Word, always with you."
        description="Read scripture and build the habit, one chapter at a time."
        buttonLabel="Next"
        onNext={() => setStep("tour5")}
      />
    );
  }

  // ─── Tour 5: Stay connected with your community ───
  if (step === "tour5") {
    return (
      <TourCard
        currentStep="tour5"
        icon={<Users size={36} style={{ color: "#34d399" }} />}
        iconGradient="bg-muted/50"
        headline="Stay connected with your community."
        description="Groups, prayer, and the people walking this journey with you."
        buttonLabel="Let's Go"
        onNext={() => window.location.reload()}
      />
    );
  }

  return null;
}
