import { useState } from "react";
import { ArrowLeft, Settings, ChevronRight, User, BookOpen, Medal, Star, Users, LogOut, HeartHandshake, ShieldCheck, Check } from "lucide-react";
import {
  NotificationDaysModal,
  NotificationTimeModal,
} from "./NotificationModals";
import type { UserData } from "./WelcomeScreen";
import { hasInvited } from "./communityData";

interface ProfileScreenProps {
  onBack: () => void;
  user: UserData;
  onSignOut: () => void;
  onUpdateUser?: (updated: UserData) => void;
}

const getProfileBadges = (user: UserData) => {
  const badges = [
    { icon: Medal, label: "Member Since", detail: "Jan 2025", color: "hsl(38 100% 47%)" },
    { icon: Star, label: "Founding Member", detail: "Early Supporter", color: "hsl(207 65% 55%)" },
    { icon: BookOpen, label: "First Reflection", detail: "Daily Journaler", color: "hsl(340 70% 55%)" },
    { icon: Users, label: "Group Member", detail: "Community", color: "hsl(150 55% 45%)" },
  ];
  if (hasInvited()) {
    badges.push({ icon: HeartHandshake, label: "Community Builder", detail: "Invited a friend", color: "hsl(170 55% 45%)" });
  }
  if (user.role === "pastor") {
    badges.unshift({ icon: ShieldCheck, label: "Pastor", detail: user.churchName, color: "hsl(38 100% 47%)" });
  }
  return badges;
};

type Appearance = "light" | "dark" | "horizon";

export default function ProfileScreen({ onBack, user, onSignOut, onUpdateUser }: ProfileScreenProps) {
  const [appearance, setAppearance] = useState<Appearance>("horizon");
  const [daysModal, setDaysModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);
  const [notifDays, setNotifDays] = useState(["Mon", "Wed", "Fri"]);
  const [notifTime, setNotifTime] = useState("Morning (8 AM)");
  const badges = getProfileBadges(user);

  // Instagram handle editing
  const [igInput, setIgInput] = useState(user.instagramHandle || "");
  const [igSaved, setIgSaved] = useState(false);

  const sanitizeIgHandle = (value: string) => {
    // Strip @ prefix and only allow valid IG characters
    return value.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30);
  };

  const handleSaveIg = () => {
    const clean = sanitizeIgHandle(igInput);
    const updated = { ...user, instagramHandle: clean || undefined };
    onUpdateUser?.(updated);
    setIgSaved(true);
    setTimeout(() => setIgSaved(false), 2000);
  };

  return (
    <div className="px-5 pb-6 space-y-5 animate-fade-in" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active"
          >
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>
        <button className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active">
          <Settings size={17} className="text-muted-foreground" />
        </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center pt-2 pb-2">
        <div className="w-20 h-20 rounded-full bg-amber flex items-center justify-center shadow-amber mb-3 overflow-hidden">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={34} className="text-primary-foreground" />
          )}
        </div>
        <h2 className="text-lg font-bold text-foreground">{user.firstName} {user.lastName}</h2>
        <p className="text-sm text-muted-foreground">@{user.username}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {user.churchName}
        </p>
      </div>

      {/* Badges */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Badges
        </p>
        <div className="grid grid-cols-2 gap-3">
          {badges.map(({ icon: Icon, label, detail, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3.5"
              style={{ background: "hsl(40 25% 97%)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                style={{ background: `${color}22` }}
              >
                <Icon size={17} style={{ color }} />
              </div>
              <p className="text-xs font-bold text-foreground leading-tight">
                {label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Social
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-2xl px-3 py-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-muted-foreground shrink-0">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="6" r="1.5" fill="currentColor" />
            </svg>
            <span className="text-muted-foreground text-sm">@</span>
            <input
              type="text"
              value={igInput}
              onChange={(e) => { setIgInput(sanitizeIgHandle(e.target.value)); setIgSaved(false); }}
              placeholder="your_handle"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={handleSaveIg}
            disabled={igSaved || sanitizeIgHandle(igInput) === (user.instagramHandle || "")}
            className="w-10 h-10 rounded-2xl flex items-center justify-center tap-active transition-colors disabled:opacity-40"
            style={{ background: igSaved ? "hsl(150, 55%, 45%)" : "hsl(var(--muted))" }}
          >
            <Check size={16} className={igSaved ? "text-white" : "text-foreground"} />
          </button>
        </div>
        {igInput && !/^[a-zA-Z0-9._]{1,30}$/.test(igInput) && (
          <p className="text-xs text-destructive mt-2 ml-1">Only letters, numbers, periods, and underscores</p>
        )}
      </section>

      {/* Appearance */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Appearance
        </p>
        <div className="flex gap-2">
          {(["light", "dark", "horizon"] as Appearance[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setAppearance(mode)}
              className={`flex-1 py-2.5 rounded-2xl text-xs font-semibold capitalize tap-active transition-colors ${
                appearance === mode
                  ? "bg-amber text-primary-foreground shadow-amber"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Notification Preferences
        </p>
        <button
          onClick={() => setDaysModal(true)}
          className="w-full flex items-center justify-between py-3.5 border-b border-border tap-active"
        >
          <span className="text-sm font-medium text-foreground">Frequency</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">
              {notifDays.length === 0 ? "Off" : notifDays.join(", ")}
            </span>
            <ChevronRight size={15} className="text-muted-foreground" />
          </div>
        </button>
        <button
          onClick={() => setTimeModal(true)}
          className="w-full flex items-center justify-between pt-3.5 tap-active"
        >
          <span className="text-sm font-medium text-foreground">Time of day</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">{notifTime}</span>
            <ChevronRight size={15} className="text-muted-foreground" />
          </div>
        </button>
      </section>

      {/* Sign Out */}
      <button
        onClick={onSignOut}
        className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive font-semibold text-sm py-3.5 rounded-2xl tap-active transition-colors hover:bg-destructive/15"
      >
        <LogOut size={16} />
        Sign Out
      </button>

      <div className="h-2" />

      {daysModal && (
        <NotificationDaysModal
          onClose={() => setDaysModal(false)}
          selectedDays={notifDays}
          onSave={setNotifDays}
        />
      )}
      {timeModal && (
        <NotificationTimeModal
          onClose={() => setTimeModal(false)}
          selectedTime={notifTime}
          onSave={setNotifTime}
        />
      )}
    </div>
  );
}
