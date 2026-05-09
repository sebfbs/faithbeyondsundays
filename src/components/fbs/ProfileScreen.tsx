import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, User, BookOpen, Medal, Crown, Users, Flame, LogOut, ShieldCheck, Check, Bell, BellOff, Phone, Camera, Loader2, Church, Trash2, AlertTriangle, Moon, BadgeCheck, Lock, X } from "lucide-react";
import { useTheme } from "next-themes";
import {
  NotificationDaysModal,
  NotificationTimeModal,
} from "./NotificationModals";
import type { UserData } from "./WelcomeScreen";
import type { CommunityMember } from "./communityData";
import PublicProfileScreen from "./PublicProfileScreen";
import { useNotificationPreferences, type NotificationType } from "@/hooks/useNotificationPreferences";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { getBadgeTier, getUserBadgeConfig, BADGE_TIERS, USER_BADGE_CONFIGS, type UserBadgeConfig } from "./badgeConfig";
import BadgeStackGroup, { type BadgeItem } from "./BadgeStackGroup";
import { useDemoMode } from "./DemoModeProvider";

interface ProfileScreenProps {
  onBack: () => void;
  user: UserData;
  onSignOut: () => void;
  onUpdateUser?: (updated?: UserData) => void;
}

function badgeIcon(type: string): React.ReactNode {
  if (type === "founding_member") return <Crown size={20} color="white" />;
  if (type === "group_member") return <Users size={20} color="white" />;
  if (type.startsWith("streak_")) return <Flame size={20} color="white" />;
  if (type.startsWith("scripture_")) return <BookOpen size={20} color="white" />;
  return <Medal size={20} color="white" />;
}

function userBadgeToItem(cfg: UserBadgeConfig): BadgeItem {
  return { label: cfg.label, detail: cfg.detail, howToEarn: cfg.howToEarn, color: cfg.color, gradient: cfg.gradient, animated: cfg.animated, icon: badgeIcon(cfg.type) };
}

/* ---- Verified Profile Badge ---- */

function VerifiedProfileBadge({ isVerified, email }: { isVerified: boolean; email?: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!email || sending || sent) return;
    setSending(true);
    setSendError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/verify-profile` },
      });
      if (error) {
        console.error("Verify OTP error:", error);
        setSendError("Couldn't send the email. Please try again.");
      } else {
        setSent(true);
      }
    } catch (err) {
      console.error("Verify OTP exception:", err);
      setSendError("Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (isVerified) {
    // Earned — blue gradient, same style as BadgeCard
    return (
      <div
        style={{
          borderRadius: 20,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "linear-gradient(135deg, #2563EB, #3B82F6, #60A5FA)",
          boxShadow: "0 4px 20px rgba(59,130,246,0.35)",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <BadgeCheck size={20} color="white" />
        </div>
        <div>
          <p style={{ color: "white", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>Verified Profile</p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Email Confirmed</p>
        </div>
      </div>
    );
  }

  // Locked — grayed out card with tap-to-open modal
  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        style={{
          borderRadius: 20,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "hsl(var(--muted))",
          cursor: "pointer",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: 0.4,
          }}
        >
          <BadgeCheck size={20} color="#3B82F6" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "hsl(var(--muted-foreground))", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            Verified Profile
          </p>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, opacity: 0.7 }}>Email Confirmed</p>
        </div>
        <Lock size={17} color="hsl(var(--muted-foreground))" style={{ flexShrink: 0, opacity: 0.5 }} />
      </div>

      {modalOpen && (
        <div
          onClick={() => { if (!sending) { setModalOpen(false); setSent(false); setSendError(null); } }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "hsl(var(--card))",
              borderRadius: 24,
              padding: "24px 20px",
              width: "100%",
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            {/* Close button */}
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => { setModalOpen(false); setSent(false); setSendError(null); }}
                style={{
                  background: "hsl(var(--muted))",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={14} color="hsl(var(--muted-foreground))" />
              </button>
            </div>

            {/* Badge icon preview */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB, #3B82F6, #60A5FA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BadgeCheck size={24} color="white" />
            </div>

            {/* Title & body */}
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                Verified Profile
              </p>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, lineHeight: 1.5 }}>
                {sent
                  ? "Check your inbox! Tap the link in your email to verify."
                  : "Verify your email to earn this badge. We'll send a link to your inbox — one tap and you're verified."}
              </p>
            </div>

            {/* Error */}
            {sendError && (
              <p style={{ color: "hsl(var(--destructive))", fontSize: 12, textAlign: "center" }}>{sendError}</p>
            )}

            {/* Action button */}
            {!sent && (
              <button
                onClick={handleVerify}
                disabled={sending}
                style={{
                  width: "100%",
                  padding: "12px 0",
                  borderRadius: 14,
                  background: sending ? "hsl(43, 78%, 52%)" : "hsl(43, 78%, 61%)",
                  border: "none",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: sending ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: sending ? 0.75 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {sending && <Loader2 size={15} className="animate-spin" />}
                {sending ? "Sending…" : "Verify Profile Now"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function ProfileScreen({ onBack, user, onSignOut, onUpdateUser }: ProfileScreenProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isDemo } = useDemoMode();

  const { data: verifiedData } = useQuery({
    queryKey: ["profile-manually-verified", authUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("manually_verified")
        .eq("user_id", authUser!.id)
        .single();
      return data as any;
    },
    enabled: !!authUser && !isDemo,
    refetchOnWindowFocus: true,
  });

  const isEmailVerified = !!(verifiedData?.manually_verified);
  const [daysModal, setDaysModal] = useState<NotificationType | null>(null);
  const [timeModal, setTimeModal] = useState<NotificationType | null>(null);
  const { preferences, updatePreference } = useNotificationPreferences();
  const [viewingMember, setViewingMember] = useState<CommunityMember | null>(null);

  // Fetch all earned reflection badges (highest first)
  const { data: reflectionBadges = [] } = useQuery({
    queryKey: ["all-reflection-badges", authUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reflection_badges" as any)
        .select("milestone")
        .eq("user_id", authUser!.id)
        .order("milestone", { ascending: false });
      return ((data || []) as any[]).map((r) => getBadgeTier(r.milestone)).filter(Boolean) as ReturnType<typeof getBadgeTier>[];
    },
    enabled: !!authUser && !isDemo,
  });

  // Fetch all earned user badges (group member, streak, scripture, founding member)
  const { data: earnedUserBadges = [] } = useQuery({
    queryKey: ["user-badges", authUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges" as any)
        .select("badge_type")
        .eq("user_id", authUser!.id);
      return ((data || []) as any[]).map((r) => getUserBadgeConfig(r.badge_type)).filter(Boolean) as UserBadgeConfig[];
    },
    enabled: !!authUser && !isDemo,
  });

  const earnedTypes = new Set(earnedUserBadges.map((b) => b.type));

  // Build earned/locked lists per group
  const reflectionEarned: BadgeItem[] = reflectionBadges.map((t) => ({
    label: t!.label, detail: t!.detail, color: t!.color, gradient: t!.gradient, animated: t!.animated,
    icon: <Medal size={20} color="white" />,
  }));
  const reflectionLocked: BadgeItem[] = BADGE_TIERS
    .filter((t) => !reflectionBadges.find((e) => e?.milestone === t.milestone))
    .slice(0, 1)
    .map((t) => ({ label: t.label, detail: t.detail, howToEarn: t.howToEarn, color: t.color, gradient: t.gradient, icon: <Medal size={20} color="white" /> }));

  const streakEarned  = earnedUserBadges.filter((b) => b.group === "streak").map(userBadgeToItem);
  const streakLocked  = USER_BADGE_CONFIGS.filter((b) => b.group === "streak"  && !earnedTypes.has(b.type)).slice(0, 1).map(userBadgeToItem);
  const scriptEarned  = earnedUserBadges.filter((b) => b.group === "scripture").map(userBadgeToItem);
  const scriptLocked  = USER_BADGE_CONFIGS.filter((b) => b.group === "scripture" && !earnedTypes.has(b.type)).slice(0, 1).map(userBadgeToItem);
  const specialEarned = earnedUserBadges.filter((b) => b.group === "special").map(userBadgeToItem);
  const specialLocked = USER_BADGE_CONFIGS.filter((b) => b.group === "special" && !earnedTypes.has(b.type) && b.type !== "founding_member").slice(0, 1).map(userBadgeToItem);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  // Instagram handle editing
  const [igInput, setIgInput] = useState((user.instagramHandle || "").toLowerCase());
  const [igSaved, setIgSaved] = useState(false);

  // Phone number editing
  const [phoneInput, setPhoneInput] = useState(user.phoneNumber || "");
  const [phoneSaved, setPhoneSaved] = useState(false);


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

  const handleRemoveAvatar = async () => {
    if (!authUser || removingAvatar) return;
    setRemovingAvatar(true);
    await supabase.from("profiles").update({ avatar_url: null }).eq("user_id", authUser.id);
    setAvatarUrl(undefined);
    onUpdateUser?.({ ...user, avatarUrl: undefined });
    setRemovingAvatar(false);
  };

  const sanitizeIgHandle = (value: string) => {
    return value.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 30);
  };

  const handleSaveIg = async () => {
    const clean = sanitizeIgHandle(igInput);
    if (authUser) {
      await supabase
        .from("profiles")
        .update({ instagram_handle: clean || null })
        .eq("user_id", authUser.id);
    }
    onUpdateUser?.({ ...user, instagramHandle: clean || undefined });
    setIgSaved(true);
    setTimeout(() => setIgSaved(false), 2000);
  };

  const handleSavePhone = async () => {
    const trimmed = phoneInput.trim();
    if (authUser) {
      await supabase
        .from("profiles")
        .update({ phone_number: trimmed || null })
        .eq("user_id", authUser.id);
    }
    onUpdateUser?.();
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2000);
  };


  // Show public profile overlay
  if (viewingMember) {
    return (
      <PublicProfileScreen
        member={viewingMember}
        onBack={() => setViewingMember(null)}
        isDemo={isDemo}
      />
    );
  }

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
        <div className="w-9 h-9" />
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
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-muted flex items-center justify-center shadow-sm border border-border/50 tap-active"
          >
            <Camera size={14} className="text-muted-foreground" />
          </button>
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              disabled={removingAvatar}
              className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shadow-sm border border-border/50 tap-active disabled:opacity-50"
            >
              {removingAvatar ? (
                <Loader2 size={12} className="animate-spin text-destructive" />
              ) : (
                <Trash2 size={12} className="text-destructive" />
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
        </div>
        <h2 className="text-lg font-bold text-foreground mt-3">{user.firstName} {user.lastName}</h2>
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          {isEmailVerified && (
            <BadgeCheck size={18} color="#3B82F6" />
          )}
        </div>

        {user.instagramHandle && (
          <button
            onClick={() => window.open(`https://instagram.com/${user.instagramHandle}`, "_blank")}
            className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-full tap-active transition-opacity hover:opacity-80"
            style={{ background: "hsl(var(--muted))" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
              <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="6" r="1.5" fill="currentColor" />
            </svg>
            <span className="text-xs font-medium text-muted-foreground">@{user.instagramHandle}</span>
          </button>
        )}

        {user.churchName ? (
          <p className="text-xs text-muted-foreground mt-0.5">{user.churchName}</p>
        ) : (
          <button
            onClick={() => navigate("/community")}
            className="flex items-center gap-1 text-xs font-medium text-primary mt-0.5 hover:underline"
          >
            <Church className="w-3 h-3" />
            Find a Church
          </button>
        )}
      </div>

      {/* Badges */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">
          Badges
        </p>
        {/* Special group — Verified Profile badge always rendered first */}
        <div style={{ marginBottom: 24 }}>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest" style={{ marginBottom: 10 }}>
            Special
            {(specialEarned.length > 0 || isEmailVerified) && (
              <span className="ml-2 font-normal normal-case" style={{ color: "rgba(255,255,255,0.25)" }}>
                {specialEarned.length + (isEmailVerified ? 1 : 0)} earned
              </span>
            )}
          </p>
          <VerifiedProfileBadge isVerified={isEmailVerified} email={authUser?.email ?? undefined} />
          {specialEarned.length > 0 || specialLocked.length > 0 ? (
            <BadgeStackGroup label="" earned={specialEarned} locked={specialLocked} isOwn={true} />
          ) : null}
        </div>
        <BadgeStackGroup label="Streaks"     earned={streakEarned}     locked={streakLocked}     isOwn={true} />
        <BadgeStackGroup label="Reflections" earned={reflectionEarned} locked={reflectionLocked} isOwn={true} />
        <BadgeStackGroup label="Scripture"   earned={scriptEarned}     locked={scriptLocked}     isOwn={true} />
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
        {igInput && !/^[a-z0-9._]{1,30}$/.test(igInput) && (
          <p className="text-xs text-destructive mt-2 ml-1">Only letters, numbers, periods, and underscores</p>
        )}
        <p className="text-xs text-muted-foreground mt-1.5 ml-1">Shown on your profile when saved</p>

        {/* Phone Number — collected for church team, not displayed on profile */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-2 flex-1 bg-muted/50 rounded-2xl px-3 py-3">
            <Phone size={16} className="text-muted-foreground shrink-0" />
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => { setPhoneInput(e.target.value); setPhoneSaved(false); }}
              placeholder="Phone number (optional)"
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
        <p className="text-xs text-muted-foreground mt-1.5 ml-1">Only visible to your church team — never shown on your profile</p>
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

      {/* Appearance */}
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Appearance
        </p>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full flex items-center justify-between py-1 tap-active"
        >
          <div className="flex items-center gap-3">
            <Moon size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Dark Mode</span>
          </div>
          <div className={`w-11 h-6 rounded-full transition-colors relative ${theme === "dark" ? "bg-primary" : "bg-border"}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`} />
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

      {/* Delete Account */}
      <DeleteAccountSection authUser={authUser} onSignOut={onSignOut} isDemo={isDemo} />

      <div className="h-4" />

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

/* ---- Delete Account ---- */

function DeleteAccountSection({ authUser, onSignOut, isDemo }: { authUser: any; onSignOut: () => void; isDemo: boolean }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (isDemo) {
      setError("Delete account is disabled in demo mode.");
      return;
    }
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be signed in");
        setDeleting(false);
        return;
      }

      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) {
        setError("Failed to delete account. Please try again.");
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      onSignOut();
    } catch {
      setError("Something went wrong. Please try again.");
      setDeleting(false);
    }
  };

  

  return (
    <div className="pt-2">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground text-xs py-2 tap-active"
        >
          <Trash2 size={13} />
          Delete Account
        </button>
      ) : (
        <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 space-y-3 animate-fade-in">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-destructive">Delete your account?</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This will permanently delete your profile, journal entries, prayer requests, badges, and all associated data. This action cannot be undone.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Type <span className="font-bold text-destructive">DELETE</span> to confirm</label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full mt-1 bg-card rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/40"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => { setShowConfirm(false); setConfirmText(""); setError(null); }}
              className="flex-1 text-sm font-medium text-muted-foreground bg-muted rounded-xl py-2.5 tap-active"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={confirmText !== "DELETE" || deleting}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-destructive rounded-xl py-2.5 tap-active disabled:opacity-40"
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {deleting ? "Deleting…" : "Delete Forever"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
