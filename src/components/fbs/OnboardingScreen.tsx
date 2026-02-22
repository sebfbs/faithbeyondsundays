import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Church, AtSign, Check, X, Search, MapPin, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

interface ChurchEntry {
  id: string;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
}

type Step = "church" | "username";

export default function OnboardingScreen() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("church");
  const [searchQuery, setSearchQuery] = useState("");
  const [churches, setChurches] = useState<ChurchEntry[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<ChurchEntry | null>(null);

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
    // TODO: Save to database in future
    setRequestSubmitted(true);
  };

  const handleComplete = async () => {
    if (!user || !selectedChurch || !username || usernameError) return;
    setSaving(true);

    // Extract name from user metadata or email
    const meta = user.user_metadata || {};
    const firstName = meta.full_name?.split(" ")[0] || meta.name?.split(" ")[0] || "";
    const lastName = meta.full_name?.split(" ").slice(1).join(" ") || meta.name?.split(" ").slice(1).join(" ") || "";

    const { error } = await supabase.from("profiles").insert({
      user_id: user.id,
      church_id: selectedChurch.id,
      username,
      first_name: firstName,
      last_name: lastName,
      avatar_url: meta.avatar_url || null,
      onboarding_complete: true,
    });

    if (error) {
      console.error("Profile creation error:", error);
      setUsernameError(error.message.includes("unique") ? "Username is already taken" : "Something went wrong. Please try again.");
      setSaving(false);
    } else {
      // Force full reload so useProfile picks up the new profile
      window.location.reload();
    }
  };

  // Church selection step
  if (step === "church") {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-6">
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
                  onClick={() => setStep("username")}
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

  // Username step
  return (
    <div
      className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="pt-14 pb-6">
        <button onClick={() => setStep("church")} className="mb-4 tap-active">
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-bg flex items-center justify-center">
            <AtSign size={18} className="text-amber" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Choose a Username</h1>
            <p className="text-xs text-muted-foreground">This is how others will find you</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-base">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            placeholder="your_username"
            maxLength={20}
            className={`w-full bg-card rounded-2xl pl-9 pr-12 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40 ${
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
          <p className="text-xs text-destructive ml-1">{usernameError}</p>
        )}
        {!usernameError && !checkingUsername && username.length >= 3 && (
          <p className="text-xs text-emerald-600 ml-1">Username is available!</p>
        )}
        <p className="text-xs text-muted-foreground ml-1">
          3–20 characters · lowercase letters, numbers, underscores
        </p>
      </div>

      <div className="pb-12 pt-6">
        <button
          onClick={handleComplete}
          disabled={!username || !!usernameError || checkingUsername || saving}
          className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : null}
          Get Started
        </button>
      </div>
    </div>
  );
}
