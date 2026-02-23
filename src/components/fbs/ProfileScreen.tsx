import { useState, useRef } from "react";
import { ArrowLeft, Settings, ChevronRight, User, BookOpen, Medal, Star, Users, LogOut, HeartHandshake, ShieldCheck, Check, Bell, BellOff, Phone, Camera, Loader2 } from "lucide-react";
import {
  NotificationDaysModal,
  NotificationTimeModal,
} from "./NotificationModals";
import type { UserData } from "./WelcomeScreen";
import { hasInvited } from "./communityData";
import { useNotificationPreferences, type NotificationType } from "@/hooks/useNotificationPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";

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
  const { user: authUser } = useAuth();
  const [appearance, setAppearance] = useState<Appearance>("horizon");
  const [daysModal, setDaysModal] = useState<NotificationType | null>(null);
  const [timeModal, setTimeModal] = useState<NotificationType | null>(null);
  const { preferences, updatePreference } = useNotificationPreferences();
  const badges = getProfileBadges(user);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  // Instagram handle editing
  const [igInput, setIgInput] = useState(user.instagramHandle || "");
  const [igSaved, setIgSaved] = useState(false);

  // Phone number editing
  const [phoneInput, setPhoneInput] = useState(user.phoneNumber || "");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [showPhone, setShowPhone] = useState(user.showPhoneNumber || false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${authUser.id}/avatar.${ext}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error("Avatar upload error:", uploadError);
      setUploading(false);
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    // Update profile
    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", authUser.id);

    setAvatarUrl(publicUrl);
    onUpdateUser?.({ ...user, avatarUrl: publicUrl });
    setUploading(false);
  };

  const sanitizeIgHandle = (value: string) => {
    return value.replace(/^@/, "").replace(/[^a-zA-Z0-9._]/g, "").slice(0, 30);
  };

  const handleSaveIg = () => {
    const clean = sanitizeIgHandle(igInput);
    const updated = { ...user, instagramHandle: clean || undefined };
    onUpdateUser?.(updated);
    setIgSaved(true);
    setTimeout(() => setIgSaved(false), 2000);
  };

  const handleSavePhone = () => {
    const updated = { ...user, phoneNumber: phoneInput.trim() || undefined };
    onUpdateUser?.(updated);
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };

  const handleToggleShowPhone = () => {
    const newVal = !showPhone;
    setShowPhone(newVal);
    const updated = { ...user, showPhoneNumber: newVal };
    onUpdateUser?.(updated);
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
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-amber flex items-center justify-center shadow-amber overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <User size={34} className="text-primary-foreground" />
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-foreground/30 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber flex items-center justify-center shadow-amber tap-active"
          >
            <Camera size={14} className="text-primary-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <h2 className="text-lg font-bold text-foreground mt-3">{user.firstName} {user.lastName}</h2>
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

      {/* Social & Contact */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Social & Contact
        </p>
        {/* Instagram */}
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

        {/* Phone Number */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-2xl px-3 py-3">
            <Phone size={16} className="text-muted-foreground shrink-0" />
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => { setPhoneInput(e.target.value); setPhoneSaved(false); }}
              placeholder="Phone number"
              maxLength={20}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={handleSavePhone}
            disabled={phoneSaved || phoneInput.trim() === (user.phoneNumber || "")}
            className="w-10 h-10 rounded-2xl flex items-center justify-center tap-active transition-colors disabled:opacity-40"
            style={{ background: phoneSaved ? "hsl(150, 55%, 45%)" : "hsl(var(--muted))" }}
          >
            <Check size={16} className={phoneSaved ? "text-white" : "text-foreground"} />
          </button>
        </div>

        {/* Show phone toggle */}
        <button
          onClick={handleToggleShowPhone}
          className="w-full flex items-center justify-between mt-3 py-3 tap-active"
        >
          <div className="text-left">
            <span className="text-sm font-medium text-foreground">Show phone on profile</span>
            <p className="text-xs text-muted-foreground mt-0.5">Let others see your number for networking</p>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${showPhone ? "bg-amber" : "bg-border"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${showPhone ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
        </button>
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
        <div className="space-y-1">
          {/* New Sermon — toggle only */}
          <NotifToggleRow
            label="New Sermon Available"
            sublabel="When your church publishes a new sermon"
            enabled={preferences.find(p => p.notification_type === "new_sermon")?.enabled ?? true}
            onToggle={(v) => updatePreference("new_sermon", { enabled: v })}
          />

          {/* Daily Spark — toggle + days/time */}
          <NotifToggleRow
            label="Daily Spark"
            sublabel="Daily devotional reminder"
            enabled={preferences.find(p => p.notification_type === "daily_spark")?.enabled ?? true}
            onToggle={(v) => updatePreference("daily_spark", { enabled: v })}
          />
          {preferences.find(p => p.notification_type === "daily_spark")?.enabled !== false && (
            <NotifScheduleRow
              days={preferences.find(p => p.notification_type === "daily_spark")?.days ?? []}
              time={preferences.find(p => p.notification_type === "daily_spark")?.preferred_time ?? "Morning (8 AM)"}
              onDaysPress={() => setDaysModal("daily_spark")}
              onTimePress={() => setTimeModal("daily_spark")}
            />
          )}

          {/* Daily Reflection — toggle + days/time */}
          <NotifToggleRow
            label="Daily Reflection"
            sublabel="Reflection question reminder"
            enabled={preferences.find(p => p.notification_type === "daily_reflection")?.enabled ?? true}
            onToggle={(v) => updatePreference("daily_reflection", { enabled: v })}
          />
          {preferences.find(p => p.notification_type === "daily_reflection")?.enabled !== false && (
            <NotifScheduleRow
              days={preferences.find(p => p.notification_type === "daily_reflection")?.days ?? []}
              time={preferences.find(p => p.notification_type === "daily_reflection")?.preferred_time ?? "Morning (8 AM)"}
              onDaysPress={() => setDaysModal("daily_reflection")}
              onTimePress={() => setTimeModal("daily_reflection")}
            />
          )}

          {/* New Follower — always on, shown as info */}
          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div>
              <span className="text-sm font-medium text-foreground">New Follower</span>
              <p className="text-xs text-muted-foreground mt-0.5">Always on</p>
            </div>
            <Bell size={16} className="text-amber" />
          </div>

          {/* Someone Prayed for You — always on */}
          <div className="flex items-center justify-between py-3.5">
            <div>
              <span className="text-sm font-medium text-foreground">Someone Prayed for You</span>
              <p className="text-xs text-muted-foreground mt-0.5">Always on</p>
            </div>
            <Bell size={16} className="text-amber" />
          </div>
        </div>
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
          onClose={() => setDaysModal(null)}
          selectedDays={preferences.find(p => p.notification_type === daysModal)?.days ?? []}
          onSave={(days) => updatePreference(daysModal, { days })}
        />
      )}
      {timeModal && (
        <NotificationTimeModal
          onClose={() => setTimeModal(null)}
          selectedTime={preferences.find(p => p.notification_type === timeModal)?.preferred_time ?? "Morning (8 AM)"}
          onSave={(time) => updatePreference(timeModal, { preferred_time: time })}
        />
      )}
    </div>
  );
}

/* ---- Sub-components ---- */

function NotifToggleRow({ label, sublabel, enabled, onToggle }: {
  label: string;
  sublabel: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className="w-full flex items-center justify-between py-3.5 border-b border-border tap-active"
    >
      <div className="text-left">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
      </div>
      <div className={`w-11 h-6 rounded-full transition-colors relative ${enabled ? "bg-amber" : "bg-border"}`}>
        <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

function NotifScheduleRow({ days, time, onDaysPress, onTimePress }: {
  days: string[];
  time: string;
  onDaysPress: () => void;
  onTimePress: () => void;
}) {
  return (
    <div className="pl-4 border-b border-border">
      <button
        onClick={onDaysPress}
        className="w-full flex items-center justify-between py-3 tap-active"
      >
        <span className="text-xs font-medium text-muted-foreground">Days</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">
            {days.length === 0 ? "None" : days.length === 7 ? "Every day" : days.join(", ")}
          </span>
          <ChevronRight size={13} className="text-muted-foreground" />
        </div>
      </button>
      <button
        onClick={onTimePress}
        className="w-full flex items-center justify-between py-3 tap-active"
      >
        <span className="text-xs font-medium text-muted-foreground">Time</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{time}</span>
          <ChevronRight size={13} className="text-muted-foreground" />
        </div>
      </button>
    </div>
  );
}
