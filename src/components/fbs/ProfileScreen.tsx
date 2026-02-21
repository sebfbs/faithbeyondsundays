import { useState } from "react";
import { ArrowLeft, Settings, ChevronRight, User, Award, Medal, Star, Users, LogOut } from "lucide-react";
import {
  NotificationDaysModal,
  NotificationTimeModal,
} from "./NotificationModals";
import type { UserData } from "./WelcomeScreen";

interface ProfileScreenProps {
  onBack: () => void;
  user: UserData;
  onSignOut: () => void;
}

const BADGES = [
  { icon: Medal, label: "Member Since", detail: "Jan 2025", color: "hsl(38 100% 47%)" },
  { icon: Star, label: "Founding Member", detail: "Early Supporter", color: "hsl(207 65% 55%)" },
  { icon: Award, label: "Challenge Accepted", detail: "First Challenge", color: "hsl(340 70% 55%)" },
  { icon: Users, label: "Group Member", detail: "Community", color: "hsl(150 55% 45%)" },
];

type Appearance = "light" | "dark" | "horizon";

export default function ProfileScreen({ onBack, user, onSignOut }: ProfileScreenProps) {
  const [appearance, setAppearance] = useState<Appearance>("horizon");
  const [daysModal, setDaysModal] = useState(false);
  const [timeModal, setTimeModal] = useState(false);
  const [notifDays, setNotifDays] = useState(["Mon", "Wed", "Fri"]);
  const [notifTime, setNotifTime] = useState("Morning (8 AM)");

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
          {BADGES.map(({ icon: Icon, label, detail, color }) => (
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
