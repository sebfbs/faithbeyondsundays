import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Church, AtSign, Check, X, Search, MapPin, CheckCircle, Loader2, Phone, User, Sparkles, BookOpen, PenLine, Users, Bell, Clock, ShieldCheck, ChevronDown, ChevronRight, MessageCircle, Share2 } from "lucide-react";
import AnimatedLogo from "./AnimatedLogo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useNotificationPreferences, NotificationType } from "@/hooks/useNotificationPreferences";
import { Switch } from "@/components/ui/switch";
import confetti from "canvas-confetti";

interface ChurchEntry {
  id: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
}

type Step = "age" | "church" | "details" | "username" | "tour1" | "tour2a" | "tour2" | "tour4" | "tour5";

const STEPS: Step[] = ["age", "church", "details", "username", "tour1", "tour2a", "tour2", "tour4", "tour5"];
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
    return (STEPS.includes(param as Step) ? param : "age") as Step;
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [churches, setChurches] = useState<ChurchEntry[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<ChurchEntry | null>(null);

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

  // Bible mockup animation (tour4)
  const [bibleView, setBibleView] = useState<0 | 1 | 2>(0);
  const [highlightBook, setHighlightBook] = useState(false);
  const [highlightChapter, setHighlightChapter] = useState(false);

  // Community mockup animation (tour5)
  const [commScrollY, setCommScrollY] = useState(0);
  const [commView, setCommView] = useState<0 | 1>(0);
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [joinPressed, setJoinPressed] = useState(false);
  const [highlightMember, setHighlightMember] = useState(false);
  const [highlightGroup, setHighlightGroup] = useState(false);

  // Local state for spark notification setup
  const [sparkEnabled, setSparkEnabled] = useState(true);
  const [sparkDays, setSparkDays] = useState(DAYS);
  const [sparkTime, setSparkTime] = useState("Morning (8 AM)");

  // Drive the Bible mockup animation when on tour4
  useEffect(() => {
    if (step !== "tour4") { setBibleView(0); setHighlightBook(false); setHighlightChapter(false); return; }
    setBibleView(0); setHighlightBook(false); setHighlightChapter(false);
    const tHB  = setTimeout(() => setHighlightBook(true),    2800);
    const t1   = setTimeout(() => { setBibleView(1); setHighlightBook(false); }, 3300);
    const tHC  = setTimeout(() => setHighlightChapter(true), 3900);
    const t2   = setTimeout(() => { setBibleView(2); setHighlightChapter(false); }, 4500);
    return () => { clearTimeout(tHB); clearTimeout(t1); clearTimeout(tHC); clearTimeout(t2); };
  }, [step]);

  // Drive the Community mockup animation when on tour5
  useEffect(() => {
    if (step !== "tour5") {
      setCommScrollY(0); setCommView(0); setShowGroupSheet(false);
      setJoinPressed(false); setHighlightMember(false); setHighlightGroup(false);
      return;
    }
    setCommScrollY(0); setCommView(0); setShowGroupSheet(false);
    setJoinPressed(false); setHighlightMember(false); setHighlightGroup(false);
    const ts = [
      setTimeout(() => setCommScrollY(-270), 3400),
      setTimeout(() => setHighlightMember(true), 5000),
      setTimeout(() => { setCommView(1); setHighlightMember(false); }, 5400),
      setTimeout(() => setCommView(0), 7100),
      setTimeout(() => setCommScrollY(0), 7700),
      setTimeout(() => setHighlightGroup(true), 9200),
      setTimeout(() => { setHighlightGroup(false); setShowGroupSheet(true); }, 9600),
      setTimeout(() => setJoinPressed(true), 10700),
    ];
    return () => ts.forEach(clearTimeout);
  }, [step]);

  // Sync local state from preferences when loaded
  useEffect(() => {
    const spark = preferences.find((p) => p.notification_type === "daily_spark");
    if (spark) {
      setSparkEnabled(spark.enabled);
      setSparkDays(spark.days || DAYS);
      setSparkTime(spark.preferred_time || "Morning (8 AM)");
    }
  }, [preferences]);

  // Search churches from database
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setChurches([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchLoading(true);
      const { data } = await supabase
        .from("churches")
        .select("id, code, name, city, state")
        .or(`name.ilike.%${searchQuery}%,city.ilike.%${searchQuery}%`)
        .eq("is_active", true)
        .limit(10);
      setChurches(data || []);
      setSearchLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

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

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      church_id: selectedChurch?.id || null,
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
    setStep("tour4");
  };

  const displayUsername = username || "yourname";

  // ─── Age verification step ───
  if (step === "age") {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-6">
          <ProgressDots current="age" />
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-bg flex items-center justify-center">
              <ShieldCheck size={18} className="text-amber" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Age Verification</h1>
              <p className="text-xs text-muted-foreground">We need to confirm your age</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-20 h-20 rounded-3xl bg-amber-bg flex items-center justify-center mb-6">
            <ShieldCheck size={36} className="text-amber" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-3">Are you 13 or older?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px] mb-8">
            Faith Beyond Sundays is designed for users ages 13 and up. By continuing, you confirm that you meet this age requirement.
          </p>

          <div className="w-full space-y-3 max-w-[320px]">
            <button
              onClick={() => setStep("church")}
              className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
            >
              <Check size={18} />
              Yes, I'm 13 or older
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active transition-opacity hover:opacity-90"
            >
              No, I'm under 13
            </button>
            <p className="text-[10px] text-muted-foreground leading-relaxed pt-1">
              In compliance with COPPA and App Store guidelines, users under 13 cannot create an account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Church selection step ───
  if (step === "church") {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-6">
          <ProgressDots current="church" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Find Your Church</h1>
          <p className="text-sm text-muted-foreground">Search for your church to get started</p>
        </div>

        {(
          <div className="space-y-4 flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSelectedChurch(null); }}
                placeholder="Search churches..."
                className="w-full bg-card rounded-2xl pl-11 pr-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
              />
            </div>

            {searchQuery.trim().length >= 2 && (
              <div className="space-y-2 animate-fade-in">
                {searchLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-muted-foreground" />
                  </div>
                ) : churches.length > 0 ? (
                  churches.map((church) => (
                    <button
                      key={church.id}
                      onClick={() => setSelectedChurch(church)}
                      className={`w-full text-left bg-card rounded-2xl p-4 shadow-card tap-active transition-all flex items-center ${
                        selectedChurch?.id === church.id ? "ring-2 ring-amber" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{church.name}</p>
                        {(church.city || church.state) && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin size={12} className="text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">
                              {[church.city, church.state].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedChurch?.id === church.id && (
                        <CheckCircle size={20} className="text-amber ml-2 flex-shrink-0" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground">Can't find your church?</p>
                    <p className="text-sm text-muted-foreground mt-1">Contact <span className="font-medium text-foreground">support@faithbeyondsundays.com</span></p>
                  </div>
                )}
              </div>
            )}

            {selectedChurch && (
              <div className="animate-fade-in">
                <button
                  onClick={() => setStep("details")}
                  className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Details step ───
  if (step === "details") {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-6">
          <button onClick={() => setStep("church")} className="mb-4 tap-active">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
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
      <div className="pt-14 pb-4">
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

  // ─── Tour 1: Sunday Doesn't End on Sunday ───
  if (step === "tour1") {
    return (
      <TourCard
        currentStep="tour1"
        icon={<AnimatedLogo size={48} />}
        iconGradient="bg-muted/50"
        headline="Sunday Doesn't End on Sunday"
        description="Sunday's message lives here all week. Revisit it. Reflect on it. Live it out."
        buttonLabel="Next"
        onNext={() => setStep("tour2a")}
      />
    );
  }

  // ─── Tour 2a: Daily Sparks intro (visual) ───
  if (step === "tour2a") {
    const churchName = selectedChurch?.name || "Faith Beyond Sundays";
    const initial = churchName[0].toUpperCase();

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
        <div className="pt-14 pb-4">
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
            <div style={{ overflow: "hidden", maxHeight: 265, borderRadius: "46px 46px 0 0" }}>
              <div style={{ borderRadius: 46, border: "10px solid #1e1e1e", background: "#1e1e1e", overflow: "hidden", height: 560, boxShadow: "0 28px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
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
                        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-white font-bold" style={{ background: "hsl(var(--amber))", fontSize: 9 }}>
                          {initial}
                        </div>
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
            onClick={() => { setSparkEnabled(false); setStep("tour4"); }}
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
        <div className="pt-14 pb-4">
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

  // ─── Tour 4: The Whole Bible ───
  if (step === "tour4") {
    const tour4Styles = `
      @keyframes booksScroll {
        0%   { transform: translateY(0); }
        100% { transform: translateY(-750px); }
      }
    `;
    const OT_BOOKS = [
      { name: "Genesis", ch: 50 }, { name: "Exodus", ch: 40 }, { name: "Leviticus", ch: 27 },
      { name: "Numbers", ch: 36 }, { name: "Deuteronomy", ch: 34 }, { name: "Joshua", ch: 24 },
      { name: "Judges", ch: 21 }, { name: "Ruth", ch: 4 }, { name: "1 Samuel", ch: 31 },
      { name: "2 Samuel", ch: 24 }, { name: "1 Kings", ch: 22 }, { name: "2 Kings", ch: 25 },
      { name: "1 Chronicles", ch: 29 }, { name: "2 Chronicles", ch: 36 }, { name: "Ezra", ch: 10 },
      { name: "Nehemiah", ch: 13 }, { name: "Job", ch: 42 }, { name: "Psalms", ch: 150 },
      { name: "Proverbs", ch: 31 }, { name: "Ecclesiastes", ch: 12 }, { name: "Isaiah", ch: 66 },
      { name: "Jeremiah", ch: 52 }, { name: "Ezekiel", ch: 48 }, { name: "Daniel", ch: 12 },
      { name: "Malachi", ch: 4 },
    ];
    const NT_BOOKS = [
      { name: "Matthew", ch: 28 }, { name: "Mark", ch: 16 }, { name: "Luke", ch: 24 },
      { name: "John", ch: 21 }, { name: "Acts", ch: 28 }, { name: "Romans", ch: 16 },
      { name: "1 Corinthians", ch: 16 }, { name: "2 Corinthians", ch: 13 }, { name: "Galatians", ch: 6 },
      { name: "Ephesians", ch: 6 }, { name: "Philippians", ch: 4 }, { name: "Colossians", ch: 4 },
      { name: "1 Thessalonians", ch: 5 }, { name: "2 Thessalonians", ch: 3 },
    ];
    const panelStyle = (view: number): React.CSSProperties => ({
      position: "absolute", inset: 0, overflow: "hidden",
      background: "hsl(var(--background))",
      transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
      transform: `translateX(${bibleView === view ? "0%" : bibleView < view ? "100%" : "-100%"})`,
    });

    return (
      <div className="app-container mx-auto flex flex-col min-h-screen px-6 !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}>
        <style>{tour4Styles}</style>
        <div className="pt-14 pb-4"><ProgressDots current="tour4" /></div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h1 className="text-2xl font-bold text-foreground mb-6 leading-tight">The Whole Bible, Right Here</h1>

          {/* iPhone mockup */}
          <div className="relative mx-auto mb-8" style={{ width: 265 }}>
            <div className="absolute" style={{ left: -5, top: 84, width: 4, height: 26, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ left: -5, top: 118, width: 4, height: 46, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ left: -5, top: 172, width: 4, height: 46, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ right: -5, top: 126, width: 4, height: 68, background: "#3a3a3a", borderRadius: "0 2px 2px 0" }} />

            <div style={{ overflow: "hidden", maxHeight: 340, borderRadius: "46px 46px 0 0" }}>
              <div style={{ borderRadius: 46, border: "10px solid #1e1e1e", background: "#1e1e1e", overflow: "hidden", height: 600, boxShadow: "0 28px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
                {/* Notch */}
                <div style={{ display: "flex", justifyContent: "center", background: "hsl(var(--background))" }}>
                  <div style={{ width: 110, height: 24, background: "#1e1e1e", borderRadius: "0 0 18px 18px" }} />
                </div>

                {/* Panels */}
                <div style={{ position: "relative", height: "calc(100% - 24px)", overflow: "hidden" }}>

                  {/* Panel 0 — Book list: everything scrolls up together like the real app */}
                  <div style={panelStyle(0)}>
                    <div style={{ animation: bibleView === 0 ? "booksScroll 2.2s ease-in-out 0.3s both" : undefined }}>
                      {/* Header */}
                      <div className="flex items-center gap-2 px-3 pb-2" style={{ paddingTop: 10 }}>
                        <ArrowLeft size={13} className="text-foreground" />
                        <span className="font-bold text-foreground" style={{ fontSize: 13 }}>Bible</span>
                      </div>
                      <div className="px-3 space-y-2">
                        {/* Translation picker */}
                        <div className="flex items-center justify-between p-2 rounded-2xl bg-muted/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--amber-bg))" }}>
                              <BookOpen size={10} style={{ color: "hsl(var(--amber))" }} />
                            </div>
                            <div className="text-left">
                              <p style={{ fontSize: 8.5, fontWeight: 600, lineHeight: 1.2 }}>KJV</p>
                              <p style={{ fontSize: 7, color: "hsl(var(--muted-foreground))", lineHeight: 1.2 }}>King James Version</p>
                            </div>
                          </div>
                          <ChevronDown size={9} className="text-muted-foreground" />
                        </div>
                        {/* Search */}
                        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-2xl bg-muted/50">
                          <Search size={8} className="text-muted-foreground shrink-0" />
                          <span style={{ fontSize: 8, color: "hsl(var(--muted-foreground))" }}>Search books…</span>
                        </div>
                      </div>
                      {/* Book list — OT */}
                      <div className="px-3 mt-2">
                        <p style={{ fontSize: 7, fontWeight: 700, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>Old Testament</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {OT_BOOKS.map((book) => (
                            <div key={book.name} className="flex items-center justify-between rounded-2xl" style={{ padding: "5px 8px" }}>
                              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{book.name}</span>
                              <div className="flex items-center gap-0.5">
                                <span style={{ fontSize: 7.5, color: "hsl(var(--muted-foreground))" }}>{book.ch} ch</span>
                                <ChevronRight size={8} className="text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Book list — NT */}
                      <div className="px-3 mt-3">
                        <p style={{ fontSize: 7, fontWeight: 700, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>New Testament</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                          {NT_BOOKS.map((book) => (
                            <div key={book.name} className="flex items-center justify-between rounded-2xl" style={{ padding: "5px 8px", background: highlightBook && book.name === "Romans" ? "rgba(0,0,0,0.07)" : undefined }}>
                              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{book.name}</span>
                              <div className="flex items-center gap-0.5">
                                <span style={{ fontSize: 7.5, color: "hsl(var(--muted-foreground))" }}>{book.ch} ch</span>
                                <ChevronRight size={8} className="text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Panel 1 — Romans chapters (matches renderChapterGrid: aspect-square rounded-2xl bg-muted/50) */}
                  <div style={panelStyle(1)}>
                    <div className="flex items-center gap-2 px-3 pb-2" style={{ paddingTop: 10 }}>
                      <ArrowLeft size={13} className="text-foreground" />
                      <span className="font-bold text-foreground" style={{ fontSize: 13 }}>Romans</span>
                    </div>
                    <p className="px-4 pb-3" style={{ fontSize: 8, color: "hsl(var(--muted-foreground))" }}>16 chapters · KJV</p>
                    <div className="grid grid-cols-5 px-3" style={{ gap: 6 }}>
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i + 1} className="flex items-center justify-center bg-muted/50"
                          style={{ aspectRatio: "1", fontSize: 10, fontWeight: 600, borderRadius: 10,
                            background: highlightChapter && i === 7 ? "hsl(var(--amber))" : undefined,
                            color: highlightChapter && i === 7 ? "white" : undefined,
                          }}>
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel 2 — Romans 8 verses (matches renderText) */}
                  <div style={panelStyle(2)}>
                    <div className="flex items-center justify-between px-3 pb-2" style={{ paddingTop: 10 }}>
                      <div className="flex items-center gap-2">
                        <ArrowLeft size={13} className="text-foreground" />
                        <span className="font-bold text-foreground" style={{ fontSize: 13 }}>Romans 8</span>
                      </div>
                      <span className="rounded-full font-bold" style={{ fontSize: 8, padding: "2px 7px", background: "hsl(var(--amber-bg))", color: "hsl(var(--amber))" }}>KJV</span>
                    </div>
                    <div className="px-3">
                      <p style={{ fontSize: 7.5, color: "hsl(var(--muted-foreground))", marginBottom: 6 }}>KJV · King James Version</p>
                      <p style={{ fontSize: 9, lineHeight: 1.85 }}>
                        <sup style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginRight: 1 }}>1</sup>
                        There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.{" "}
                        <sup style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginRight: 1 }}>2</sup>
                        For the law of the Spirit of life in Christ Jesus hath made me free from the law of sin and death.{" "}
                        <sup style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginRight: 1 }}>3</sup>
                        For what the law could not do, in that it was weak through the flesh, God sending his own Son in the likeness of sinful flesh, and for sin, condemned sin in the flesh.{" "}
                        <sup style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginRight: 1 }}>4</sup>
                        That the righteousness of the law might be fulfilled in us, who walk not after the flesh, but after the Spirit.{" "}
                        <sup style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginRight: 1 }}>5</sup>
                        For they that are after the flesh do mind the things of the flesh; but they that are after the Spirit the things of the Spirit.{" "}
                        <sup style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", marginRight: 1 }}>6</sup>
                        For to be carnally minded is death; but to be spiritually minded is life and peace.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-12 pt-4">
          <button onClick={() => setStep("tour5")}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90">
            Next <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ─── Tour 5: Your Church, Your People ───
  if (step === "tour5") {
    const commPanelStyle = (view: number): React.CSSProperties => ({
      position: "absolute", inset: 0, overflow: "hidden",
      background: "hsl(var(--background))",
      transition: "transform 0.42s cubic-bezier(0.4,0,0.2,1)",
      transform: `translateX(${commView === view ? "0%" : commView < view ? "100%" : "-100%"})`,
    });
    const commMembers = [
      { initials: "JW", name: "James Whitfield", handle: "@pastor_james", tag: "Pastor", color: "hsl(var(--amber))" },
      { initials: "SM", name: "Sarah Mitchell", handle: "@sarah_m", tag: null, color: "#8b9dc8" },
      { initials: "DC", name: "David Chen", handle: "@david.chen", tag: null, color: "hsl(var(--amber))" },
      { initials: "GO", name: "Grace Obi", handle: "@grace_obi", tag: null, color: "#8b9dc8" },
      { initials: "MJ", name: "Marcus Johnson", handle: "@marcus_j", tag: null, color: "hsl(var(--amber))" },
    ];
    const sheetMembers = [
      { initials: "SM", name: "Sarah Mitchell", color: "#8b9dc8" },
      { initials: "GO", name: "Grace Obi", color: "#8b9dc8" },
      { initials: "RH", name: "Rachel Henderson", color: "#c8876b" },
      { initials: "AR", name: "Angela Rivera", color: "#8b9dc8" },
    ];

    return (
      <div className="app-container mx-auto flex flex-col min-h-screen px-6 !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}>
        <div className="pt-14 pb-4"><ProgressDots current="tour5" /></div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <h1 className="text-2xl font-bold text-foreground mb-2 leading-tight">Your Church. Your People.</h1>
          <p className="text-sm text-muted-foreground mb-8 max-w-[300px] leading-relaxed">
            Connect with your congregation, join small groups, and follow believers from churches everywhere.
          </p>

          {/* iPhone mockup */}
          <div className="relative mx-auto mb-8" style={{ width: 265 }}>
            <div className="absolute" style={{ left: -5, top: 84, width: 4, height: 26, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ left: -5, top: 118, width: 4, height: 46, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ left: -5, top: 172, width: 4, height: 46, background: "#3a3a3a", borderRadius: "2px 0 0 2px" }} />
            <div className="absolute" style={{ right: -5, top: 126, width: 4, height: 68, background: "#3a3a3a", borderRadius: "0 2px 2px 0" }} />

            <div style={{ overflow: "hidden", maxHeight: 350, borderRadius: "46px 46px 0 0" }}>
              <div style={{ borderRadius: 46, border: "10px solid #1e1e1e", background: "#1e1e1e", overflow: "hidden", height: 600, boxShadow: "0 28px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)" }}>
                <div style={{ display: "flex", justifyContent: "center", background: "hsl(var(--background))" }}>
                  <div style={{ width: 110, height: 24, background: "#1e1e1e", borderRadius: "0 0 18px 18px" }} />
                </div>

                {/* Panels container */}
                <div style={{ position: "relative", height: "calc(100% - 24px)", overflow: "hidden" }}>

                  {/* Panel 0: Community list */}
                  <div style={commPanelStyle(0)}>
                    <div style={{ transform: `translateY(${commScrollY}px)`, transition: "transform 1.4s ease-in-out", padding: "10px 18px 0" }}>
                      <div className="flex items-center gap-2 mb-3">
                        <ArrowLeft size={13} className="text-foreground" />
                        <span className="font-bold text-foreground" style={{ fontSize: 13 }}>Community</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3 rounded-2xl" style={{ padding: "7px 10px", background: "hsl(var(--card))", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                        <Search size={9} className="text-muted-foreground shrink-0" />
                        <span style={{ fontSize: 8, color: "hsl(var(--muted-foreground))" }}>Search by name or @username</span>
                      </div>
                      <div className="flex items-center gap-2 mb-3 rounded-2xl" style={{ padding: "7px 10px", background: "hsl(var(--card))", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "hsl(174,55%,88%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Share2 size={10} style={{ color: "hsl(174,55%,38%)" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}>Invite a friend</p>
                          <p style={{ fontSize: 7, color: "hsl(var(--muted-foreground))" }}>Invite a friend &amp; earn a badge</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Your Church</p>
                      <div className="flex items-center gap-2 mb-3 rounded-2xl" style={{ padding: "8px 10px", background: "hsl(var(--card))", boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: "hsl(var(--amber-bg))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Church size={13} style={{ color: "hsl(var(--amber))" }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.2 }}>Cornerstone Community Church</p>
                          <p style={{ fontSize: 7, color: "hsl(var(--muted-foreground))" }}>34 members</p>
                        </div>
                      </div>
                      <p style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Groups</p>
                      <div className="flex gap-2 mb-3">
                        {[{ name: "Women's Group", count: 14, joined: joinPressed }, { name: "Men's Group", count: 11, joined: false }].map((g, gi) => (
                          <div key={g.name} className="flex-1 rounded-2xl" style={{ padding: "10px 9px", background: highlightGroup && gi === 0 ? "hsl(var(--muted))" : "hsl(var(--card))", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "background 0.2s" }}>
                            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "hsl(var(--amber-bg))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
                              <MessageCircle size={10} style={{ color: "hsl(var(--amber))" }} />
                            </div>
                            <p style={{ fontSize: 8.5, fontWeight: 700, lineHeight: 1.3 }}>{g.name}</p>
                            <p style={{ fontSize: 7, color: "hsl(var(--muted-foreground))", marginBottom: 3 }}>{g.count} members</p>
                            {g.joined && <span style={{ fontSize: 6.5, background: "hsl(var(--amber-bg))", color: "hsl(var(--amber))", fontWeight: 700, borderRadius: 99, padding: "2px 6px", display: "inline-block" }}>Joined</span>}
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>Church Members</p>
                      {commMembers.map(m => (
                        <div key={m.initials} className="flex items-center gap-2 mb-2 rounded-2xl" style={{ padding: "7px 10px", background: highlightMember && m.initials === "JW" ? "hsl(var(--muted))" : "hsl(var(--card))", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "background 0.2s" }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: m.color, color: "white", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.initials}</div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p style={{ fontSize: 9, fontWeight: 700 }}>{m.name}</p>
                              {m.tag && <span style={{ fontSize: 6.5, background: "hsl(var(--amber-bg))", color: "hsl(var(--amber))", fontWeight: 700, borderRadius: 99, padding: "1px 5px" }}>{m.tag}</span>}
                            </div>
                            <p style={{ fontSize: 7.5, color: "hsl(var(--muted-foreground))" }}>{m.handle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Panel 1: James Whitfield profile */}
                  <div style={commPanelStyle(1)}>
                    <div style={{ padding: "10px 12px 0", overflowY: "hidden", height: "100%" }}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ArrowLeft size={13} className="text-foreground" />
                          <span className="font-bold text-foreground" style={{ fontSize: 13 }}>Profile</span>
                        </div>
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                          {[0,1,2].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "hsl(var(--foreground))" }} />)}
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center mb-3">
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "hsl(var(--amber))", color: "white", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 6 }}>JW</div>
                        <p style={{ fontSize: 11, fontWeight: 700 }}>James Whitfield</p>
                        <p style={{ fontSize: 7.5, color: "hsl(var(--muted-foreground))", marginBottom: 5 }}>Cornerstone Community Church</p>
                        <div className="flex items-center gap-3 mb-3">
                          <span style={{ fontSize: 8 }}><strong>5</strong> <span style={{ color: "hsl(var(--muted-foreground))" }}>Followers</span></span>
                          <span style={{ color: "hsl(var(--muted-foreground))", fontSize: 8 }}>|</span>
                          <span style={{ fontSize: 8 }}><strong>3</strong> <span style={{ color: "hsl(var(--muted-foreground))" }}>Following</span></span>
                        </div>
                        <div style={{ width: "75%", background: "hsl(var(--amber))", color: "white", borderRadius: 99, padding: "5px 0", fontSize: 9, fontWeight: 700, textAlign: "center" }}>Follow</div>
                      </div>
                      <p style={{ fontSize: 6.5, fontWeight: 700, color: "hsl(var(--muted-foreground))", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Badges</p>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {[
                          { icon: <ShieldCheck size={10} style={{ color: "#4a9eff" }} />, title: "Pastor", sub: "Cornerstone Community Church" },
                          { icon: <Clock size={10} style={{ color: "#4a9eff" }} />, title: "Member Since", sub: "Sep 2024" },
                          { icon: <Users size={10} style={{ color: "#4a9eff" }} />, title: "Group Member", sub: "Community" },
                          { icon: <Sparkles size={10} style={{ color: "#4adb9e" }} />, title: "Community Builder", sub: "Invited a friend" },
                        ].map(b => (
                          <div key={b.title} style={{ background: "hsl(var(--muted))", borderRadius: 10, padding: "7px" }}>
                            <div style={{ marginBottom: 4 }}>{b.icon}</div>
                            <p style={{ fontSize: 8, fontWeight: 700, lineHeight: 1.2 }}>{b.title}</p>
                            <p style={{ fontSize: 6.5, color: "hsl(var(--muted-foreground))", lineHeight: 1.3 }}>{b.sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Women's Group bottom sheet overlay — height constrained to visible clip area */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 316, zIndex: 10, background: "rgba(0,0,0,0.35)", opacity: showGroupSheet ? 1 : 0, pointerEvents: "none", transition: "opacity 0.35s", display: "flex", alignItems: "flex-end" }}>
                    <div style={{ width: "100%", background: "hsl(var(--background))", borderRadius: "14px 14px 0 0", padding: "6px 10px 10px", transform: showGroupSheet ? "translateY(0)" : "translateY(100%)", transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)" }}>
                      <div style={{ width: 28, height: 3, borderRadius: 99, background: "hsl(var(--muted-foreground))", opacity: 0.35, margin: "0 auto 7px" }} />
                      <div className="flex items-center justify-between mb-1.5">
                        <span style={{ fontSize: 11, fontWeight: 700 }}>Women's Group</span>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "hsl(var(--muted))", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <X size={9} className="text-muted-foreground" />
                        </div>
                      </div>
                      <p style={{ fontSize: 7, color: "hsl(var(--muted-foreground))", marginBottom: 6, lineHeight: 1.4 }}>A space for women to connect, share, and grow in faith together.</p>
                      <div className="flex items-center justify-between mb-3">
                        <span style={{ fontSize: 7.5, color: "hsl(var(--muted-foreground))" }}>14 members</span>
                        <div style={{ fontSize: 8, fontWeight: 700, padding: "4px 10px", borderRadius: 99, background: joinPressed ? "hsl(var(--muted))" : "hsl(var(--amber))", color: joinPressed ? "hsl(var(--muted-foreground))" : "white", transition: "all 0.3s" }}>
                          {joinPressed ? "✓ Joined" : "→ Join"}
                        </div>
                      </div>
                      {sheetMembers.map(m => (
                        <div key={m.initials} className="flex items-center gap-1.5 mb-1.5">
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: m.color, color: "white", fontSize: 6.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{m.initials}</div>
                          <span style={{ fontSize: 8, fontWeight: 600 }}>{m.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-12 pt-4">
          <button onClick={() => window.location.reload()}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90">
            Let's Go
          </button>
        </div>
      </div>
    );
  }

  return null;
}
