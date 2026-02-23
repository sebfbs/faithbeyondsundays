import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Church, AtSign, Check, X, Search, MapPin, CheckCircle, Loader2, Phone, User, Sparkles, Play, BookOpen, PenLine, Users, Bell, Clock } from "lucide-react";
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

type Step = "church" | "details" | "username" | "tour1" | "tour2" | "tour3" | "tour4" | "tour5";

const STEPS: Step[] = ["church", "details", "username", "tour1", "tour2", "tour3", "tour4", "tour5"];
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
    <div className="space-y-4 animate-fade-in">
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
  const [step, setStep] = useState<Step>("church");
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

  // Request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", city: "", state: "" });
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

  // Notification preferences for tour cards
  const { preferences, updatePreference } = useNotificationPreferences();

  // Local state for spark notification setup
  const [sparkEnabled, setSparkEnabled] = useState(true);
  const [sparkDays, setSparkDays] = useState(DAYS);
  const [sparkTime, setSparkTime] = useState("Morning (8 AM)");

  // Local state for reflection notification setup
  const [reflectionEnabled, setReflectionEnabled] = useState(true);
  const [reflectionDays, setReflectionDays] = useState(DAYS);
  const [reflectionTime, setReflectionTime] = useState("Morning (8 AM)");

  // Sync local state from preferences when loaded
  useEffect(() => {
    const spark = preferences.find((p) => p.notification_type === "daily_spark");
    if (spark) {
      setSparkEnabled(spark.enabled);
      setSparkDays(spark.days || DAYS);
      setSparkTime(spark.preferred_time || "Morning (8 AM)");
    }
    const reflection = preferences.find((p) => p.notification_type === "daily_reflection");
    if (reflection) {
      setReflectionEnabled(reflection.enabled);
      setReflectionDays(reflection.days || DAYS);
      setReflectionTime(reflection.preferred_time || "Morning (8 AM)");
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

  const handleRequestSubmit = () => {
    const errs: Record<string, string> = {};
    if (!requestForm.name.trim()) errs.name = "Church name is required";
    if (!requestForm.city.trim()) errs.city = "City is required";
    if (!requestForm.state.trim()) errs.state = "State is required";
    if (Object.keys(errs).length > 0) {
      setRequestErrors(errs);
      return;
    }
    setRequestSubmitted(true);
  };

  const handleClaimUsername = async () => {
    if (!user || !selectedChurch || !username || usernameError) return;
    setSaving(true);

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      church_id: selectedChurch.id,
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

  const handleSaveReflectionPrefs = () => {
    updatePreference("daily_reflection", {
      enabled: reflectionEnabled,
      days: reflectionEnabled ? reflectionDays : null,
      preferred_time: reflectionEnabled ? reflectionTime : null,
    });
    setStep("tour4");
  };

  const displayUsername = username || "yourname";

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

        {requestSubmitted ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-amber-bg flex items-center justify-center mb-5">
              <CheckCircle size={32} className="text-amber" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">We're on it!</h2>
            <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-8">
              We'll reach out to <span className="font-semibold text-foreground">{requestForm.name}</span> and let you know when they're ready.
            </p>
            <button
              onClick={() => { setRequestSubmitted(false); setShowRequestForm(false); setSearchQuery(""); }}
              className="text-sm font-medium text-amber tap-active"
            >
              ← Back to Search
            </button>
          </div>
        ) : showRequestForm ? (
          <div className="space-y-3 flex-1 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-bg flex items-center justify-center">
                <Church size={18} className="text-amber" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Request Your Church</h2>
                <p className="text-xs text-muted-foreground">We'll get them set up</p>
              </div>
            </div>
            {[
              { key: "name", placeholder: "Church name" },
              { key: "city", placeholder: "City" },
              { key: "state", placeholder: "State" },
            ].map(({ key, placeholder }) => (
              <div key={key}>
                <input
                  type="text"
                  value={requestForm[key as keyof typeof requestForm]}
                  onChange={(e) => {
                    setRequestForm((prev) => ({ ...prev, [key]: e.target.value }));
                    if (requestErrors[key]) setRequestErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
                  }}
                  placeholder={placeholder}
                  className={`w-full bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40 ${requestErrors[key] ? "ring-2 ring-destructive/50" : ""}`}
                />
                {requestErrors[key] && <p className="text-xs text-destructive mt-1 ml-1">{requestErrors[key]}</p>}
              </div>
            ))}
            <div className="pt-4 space-y-3">
              <button onClick={handleRequestSubmit} className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90">
                Submit Request
              </button>
              <button onClick={() => setShowRequestForm(false)} className="w-full text-sm font-medium text-muted-foreground tap-active">
                ← Back to Search
              </button>
            </div>
          </div>
        ) : (
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
                      className={`w-full text-left bg-card rounded-2xl p-4 shadow-card tap-active transition-all ${
                        selectedChurch?.id === church.id ? "ring-2 ring-amber" : ""
                      }`}
                    >
                      <p className="text-sm font-bold text-foreground">{church.name}</p>
                      {(church.city || church.state) && (
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin size={12} className="text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {[church.city, church.state].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">Don't see your church?</p>
                    <button
                      onClick={() => { setShowRequestForm(true); setRequestForm((prev) => ({ ...prev, name: searchQuery })); }}
                      className="text-sm font-semibold text-amber tap-active"
                    >
                      Request Your Church →
                    </button>
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
            Your phone number is private by default. You can choose to share it later.
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
              <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-400 to-sky-300 flex items-center justify-center shadow-lg">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
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
        icon={<Play className="h-9 w-9 text-white" />}
        iconGradient="bg-gradient-to-br from-amber-400 to-amber-600"
        headline="Sunday Doesn't End on Sunday"
        description="Your pastor poured everything into that message. Now you can revisit it anytime — watch the sermon, unpack the key takeaways, and let it shape your whole week, not just your Sunday."
        buttonLabel="Next"
        onNext={() => setStep("tour2")}
      />
    );
  }

  // ─── Tour 2: Daily Sparks ───
  if (step === "tour2") {
    return (
      <TourCard
        currentStep="tour2"
        icon={<Sparkles className="h-9 w-9 text-white" />}
        iconGradient="bg-gradient-to-br from-amber-400 to-sky-400"
        headline="Daily Sparks"
        description="Short, powerful nudges pulled straight from this week's sermon. A spark a day keeps the message close — and you don't have to get one every day. You choose."
        buttonLabel="Next"
        onNext={handleSaveSparkPrefs}
      >
        <div className="w-full text-left">
          <NotificationSetup
            type="daily_spark"
            enabled={sparkEnabled}
            days={sparkDays}
            time={sparkTime}
            onToggle={setSparkEnabled}
            onDaysChange={setSparkDays}
            onTimeChange={setSparkTime}
          />
        </div>
      </TourCard>
    );
  }

  // ─── Tour 3: Guided Reflections ───
  if (step === "tour3") {
    return (
      <TourCard
        currentStep="tour3"
        icon={<PenLine className="h-9 w-9 text-white" />}
        iconGradient="bg-gradient-to-br from-sky-400 to-indigo-400"
        headline="Guided Reflections"
        description="Go deeper. Each reflection is a personal journal prompt rooted in the week's sermon — designed to help you process, pray, and grow. This is where the message becomes yours."
        buttonLabel="Next"
        onNext={handleSaveReflectionPrefs}
      >
        <div className="w-full text-left">
          <NotificationSetup
            type="daily_reflection"
            enabled={reflectionEnabled}
            days={reflectionDays}
            time={reflectionTime}
            onToggle={setReflectionEnabled}
            onDaysChange={setReflectionDays}
            onTimeChange={setReflectionTime}
          />
        </div>
      </TourCard>
    );
  }

  // ─── Tour 4: The Whole Bible ───
  if (step === "tour4") {
    return (
      <TourCard
        currentStep="tour4"
        icon={<BookOpen className="h-9 w-9 text-white" />}
        iconGradient="bg-gradient-to-br from-emerald-400 to-teal-500"
        headline="The Whole Bible, Right Here"
        description="When a verse hits different, you can look it up instantly. Every book, every chapter — right at your fingertips. No switching apps, no losing your train of thought."
        buttonLabel="Next"
        onNext={() => setStep("tour5")}
      />
    );
  }

  // ─── Tour 5: Your Church, Your People ───
  if (step === "tour5") {
    return (
      <TourCard
        currentStep="tour5"
        icon={<Users className="h-9 w-9 text-white" />}
        iconGradient="bg-gradient-to-br from-violet-400 to-pink-400"
        headline="Your Church. Your People."
        description="Follow friends from your congregation, discover members from other churches, and be part of a community that doesn't disappear after the closing prayer."
        buttonLabel="Let's Go"
        onNext={() => window.location.reload()}
      />
    );
  }

  return null;
}
