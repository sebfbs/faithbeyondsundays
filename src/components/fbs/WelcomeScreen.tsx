import { useState } from "react";
import { ArrowLeft, ArrowRight, Church, UserPlus, AtSign, Check, X } from "lucide-react";
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
}

interface WelcomeScreenProps {
  onComplete: (data: UserData) => void;
}

// Demo church code lookup
const CHURCH_CODES: Record<string, string> = {
  cornerstone: "Cornerstone Community Church",
  grace: "Grace Fellowship",
  faith: "Faith Chapel",
};

function lookupChurch(code: string): string {
  const normalized = code.trim().toLowerCase();
  return CHURCH_CODES[normalized] || "Cornerstone Community Church";
}

type Step = 1 | 2 | 3 | 4;

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState<Step>(1);
  const [churchCode, setChurchCode] = useState("");
  const [churchName, setChurchName] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChurchSubmit = () => {
    if (!churchCode.trim()) return;
    const name = lookupChurch(churchCode);
    setChurchName(name);
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
        className="app-container mx-auto flex flex-col items-center justify-center min-h-screen px-8 text-center animate-fade-in"
        style={{
          background:
            "linear-gradient(180deg, hsl(207, 65%, 62%) 0%, hsl(207, 55%, 75%) 25%, hsl(22, 55%, 88%) 60%, hsl(40, 30%, 97%) 100%)",
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center">
          <img src={fbsLogo} alt="Faith Beyond Sundays" className="w-24 h-24 object-contain mb-6" />
          <h1 className="text-3xl font-bold leading-tight mb-3" style={{ color: "hsl(0 0% 100%)" }}>
            Faith Beyond<br />Sundays
          </h1>
          <p className="text-sm font-medium max-w-[260px] leading-relaxed" style={{ color: "hsl(0, 0%, 100%)" }}>
            Stay connected to Sunday's message all week long
          </p>
        </div>
        <div className="w-full pb-12">
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

  // Step 2: Church Code
  if (step === 2) {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="pt-14 pb-8">
          <button onClick={() => setStep(1)} className="mb-4 tap-active">
            <ArrowLeft size={24} className="text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground mb-2">Find Your Church</h1>
          <p className="text-sm text-muted-foreground">Enter the code your church provided</p>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <input
              type="text"
              value={churchCode}
              onChange={(e) => {
                setChurchCode(e.target.value);
                setChurchName("");
              }}
              placeholder="Church code"
              className="w-full bg-card rounded-2xl px-4 py-4 text-base text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40 uppercase font-mono tracking-widest"
            />
          </div>

          {!churchName && (
            <button
              onClick={handleChurchSubmit}
              disabled={!churchCode.trim()}
              className="w-full bg-foreground text-background font-semibold text-sm py-3.5 rounded-2xl tap-active transition-opacity hover:opacity-90 disabled:opacity-30"
            >
              Look Up Church
            </button>
          )}

          {churchName && (
            <div className="bg-card rounded-2xl p-5 shadow-card animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-bg flex items-center justify-center">
                  <Church size={22} className="text-amber" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{churchName}</p>
                  <p className="text-xs text-muted-foreground">Church found!</p>
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-sm py-3.5 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 3: Create Account
  if (step === 3) {
    return (
      <div
        className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in"
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
            className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90"
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
      className="app-container mx-auto flex flex-col min-h-screen px-6 animate-fade-in"
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
          className="w-full flex items-center justify-center gap-2 bg-amber text-primary-foreground font-semibold text-base py-4 rounded-2xl tap-active shadow-amber transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <UserPlus size={18} />
          Create Account
        </button>
      </div>
    </div>
  );
}
