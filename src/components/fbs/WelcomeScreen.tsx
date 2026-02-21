import { useState } from "react";
import { ArrowLeft, ArrowRight, Church, UserPlus, AtSign, Check, X, Search, MapPin, CheckCircle } from "lucide-react";
import fbsLogo from "@/assets/FBS_Logo_white.png";
import { validateUsername } from "./communityData";

export interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  churchName: string;
  churchCode: string;
  username: string;
  avatarUrl?: string;
  role?: "pastor";
  instagramHandle?: string;
}

interface WelcomeScreenProps {
  onComplete: (data: UserData) => void;
}

interface ChurchEntry {
  code: string;
  name: string;
  pastor: string;
  city: string;
  state: string;
}

const CHURCHES: ChurchEntry[] = [
  { code: "cornerstone", name: "Cornerstone Community Church", pastor: "Pastor James Wilson", city: "Dallas", state: "TX" },
  { code: "grace", name: "Grace Fellowship", pastor: "Pastor Maria Santos", city: "Austin", state: "TX" },
  { code: "faith", name: "Faith Chapel", pastor: "Pastor David Kim", city: "Houston", state: "TX" },
];

type Step = 1 | 2 | 3 | 4;

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState<Step>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChurch, setSelectedChurch] = useState<ChurchEntry | null>(null);
  const [churchName, setChurchName] = useState("");
  const [churchCode, setChurchCode] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Request form state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [requestForm, setRequestForm] = useState({ name: "", city: "", state: "" });
  const [requestErrors, setRequestErrors] = useState<Record<string, string>>({});

  const filteredChurches = searchQuery.trim().length >= 2
    ? CHURCHES.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.pastor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.city.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectChurch = (church: ChurchEntry) => {
    setSelectedChurch(church);
    setChurchName(church.name);
    setChurchCode(church.code);
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
    // Save to localStorage for future Supabase migration
    const requests = JSON.parse(localStorage.getItem("churchRequests") || "[]");
    requests.push({ ...requestForm, requestedAt: new Date().toISOString() });
    localStorage.setItem("churchRequests", JSON.stringify(requests));
    setRequestSubmitted(true);
  };

  const handleCreateAccount = () => {
    const newErrors: Record<string, string> = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStep(4);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Step 1: Welcome
  if (step === 1) {
    return (
      <div
        className="w-full min-h-screen flex flex-col items-center justify-center animate-fade-in"
        style={{
          background:
            "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <img src={fbsLogo} alt="Faith Beyond Sundays" className="w-24 h-24 object-contain mb-6" />
          <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: "hsl(0 0% 100%)" }}>
            Faith Beyond<br />Sundays
          </h1>
          <p className="text-sm font-medium max-w-[260px] leading-relaxed" style={{ color: "hsl(0, 0%, 100%)" }}>
            Stay connected to Sunday's message all week long
          </p>
        </div>
        <div className="w-full max-w-[430px] px-8 pb-12">
          <button
            onClick={() => setStep(2)}
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
          >
            Get Started
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Find Your Church
  if (step === 2) {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-6">
          <button onClick={() => { setStep(1); setShowRequestForm(false); setRequestSubmitted(false); setSelectedChurch(null); setSearchQuery(""); }} className="mb-4 tap-active">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-2">Find Your Church</h1>
          <p className="text-sm text-muted-foreground">Search for your church by name</p>
        </div>

        {/* Request submitted — dead end */}
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
              onClick={() => { setRequestSubmitted(false); setShowRequestForm(false); setSearchQuery(""); setRequestForm({ name: "", city: "", state: "" }); }}
              className="text-sm font-medium text-amber tap-active"
            >
              ← Back to Search
            </button>
          </div>
        ) : showRequestForm ? (
          /* Request Your Church form */
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
              <button
                onClick={handleRequestSubmit}
                className="w-full max-w-[430px] mx-auto flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowRequestForm(false)}
                className="w-full text-sm font-medium text-muted-foreground tap-active"
              >
                ← Back to Search
              </button>
            </div>
          </div>
        ) : (
          /* Search + results */
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

            {/* Results */}
            {searchQuery.trim().length >= 2 && (
              <div className="space-y-2 animate-fade-in">
                {filteredChurches.length > 0 ? (
                  filteredChurches.map((church) => (
                    <button
                      key={church.code}
                      onClick={() => handleSelectChurch(church)}
                      className={`w-full text-left bg-card rounded-2xl p-4 shadow-card tap-active transition-all ${
                        selectedChurch?.code === church.code ? "ring-2 ring-amber" : ""
                      }`}
                    >
                      <p className="text-sm font-bold text-foreground">{church.name}</p>
                      <p className="text-xs text-foreground/70 mt-0.5">{church.pastor}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin size={12} className="text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{church.city}, {church.state}</p>
                      </div>
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

            {/* Continue button when church selected */}
            {selectedChurch && (
              <div className="animate-fade-in">
                <button
                  onClick={() => setStep(3)}
                  className="w-full max-w-[430px] mx-auto flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
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

  // Step 3: Create Account
  if (step === 3) {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-6">
          <button onClick={() => setStep(2)} className="mb-4 tap-active">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-bg flex items-center justify-center">
              <UserPlus size={18} className="text-amber" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Create Account</h1>
              <p className="text-xs text-muted-foreground">{churchName}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 flex-1">
          {[
            { key: "firstName", label: "First Name", type: "text", placeholder: "First name" },
            { key: "lastName", label: "Last Name", type: "text", placeholder: "Last name" },
            { key: "phone", label: "Phone", type: "tel", placeholder: "(555) 123-4567" },
            { key: "email", label: "Email", type: "email", placeholder: "you@email.com" },
          ].map(({ key, type, placeholder }) => (
            <div key={key}>
              <input
                type={type}
                value={form[key as keyof typeof form]}
                onChange={(e) => updateField(key, e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40 ${
                  errors[key] ? "ring-2 ring-destructive/50" : ""
                }`}
              />
              {errors[key] && (
                <p className="text-xs text-destructive mt-1 ml-1">{errors[key]}</p>
              )}
            </div>
          ))}
        </div>

        <div className="pb-12 pt-6">
          <button
            onClick={handleCreateAccount}
            className="w-full max-w-[430px] mx-auto flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Choose Username
  const handleUsernameChange = (value: string) => {
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(clean);
    if (clean.length >= 3) {
      setUsernameError(validateUsername(clean));
    } else {
      setUsernameError(clean.length > 0 ? "Username must be at least 3 characters" : null);
    }
  };

  const handleUsernameSubmit = () => {
    const err = validateUsername(username);
    if (err) {
      setUsernameError(err);
      return;
    }
    onComplete({
      ...form,
      churchName,
      churchCode: churchCode.trim().toLowerCase(),
      username,
    });
  };

  return (
    <div
      className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in !max-w-[430px]"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="pt-14 pb-6">
        <button onClick={() => setStep(3)} className="mb-4 tap-active">
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
            } ${!usernameError && username.length >= 3 ? "ring-2 ring-emerald-400/50" : ""}`}
          />
          {username.length >= 3 && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2">
              {usernameError ? (
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
        {!usernameError && username.length >= 3 && (
          <p className="text-xs text-emerald-600 ml-1">Username is available!</p>
        )}
        <p className="text-xs text-muted-foreground ml-1">
          3–20 characters · lowercase letters, numbers, underscores
        </p>
      </div>

      <div className="pb-12 pt-6">
        <button
          onClick={handleUsernameSubmit}
          disabled={!username || !!usernameError}
          className="w-full max-w-[430px] mx-auto flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <UserPlus size={18} />
          Create Account
        </button>
      </div>
    </div>
  );
}
