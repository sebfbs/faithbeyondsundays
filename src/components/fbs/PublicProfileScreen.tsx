import { useState } from "react";
import { ArrowLeft, Medal, Crown, Users, Flame, BookOpen, MoreHorizontal } from "lucide-react";
import ReportBlockSheet from "./ReportBlockSheet";
import { type CommunityMember } from "./communityData";
import { useAccentColors } from "./themeColors";
import { getBadgeTier, getUserBadgeConfig, BADGE_TIERS, type UserBadgeConfig } from "./badgeConfig";
import BadgeStackGroup, { type BadgeItem } from "./BadgeStackGroup";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import fbsBg from "@/assets/FBS_with_grain_and_blue.png";
import fbsLogoWhite from "@/assets/FBS_Logo_white_2.png";
import { getAvatarColor } from "./avatarColors";

interface PublicProfileScreenProps {
  member: CommunityMember & { hasInvited?: boolean; reflectionMilestone?: number };
  onBack: () => void;
  isDemo?: boolean;
  churchId?: string;
}

export default function PublicProfileScreen({ member, onBack, isDemo, churchId }: PublicProfileScreenProps) {
  const [showReport, setShowReport] = useState(false);
  const colors = useAccentColors();

  const { data: reflectionBadges = [] } = useQuery({
    queryKey: ["public-reflection-badges", member.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("reflection_badges" as any)
        .select("milestone")
        .eq("user_id", member.userId!)
        .order("milestone", { ascending: false });
      return ((data || []) as any[]).map((r) => getBadgeTier(r.milestone)).filter(Boolean) as ReturnType<typeof getBadgeTier>[];
    },
    enabled: !!member.userId && !isDemo,
  });

  const { data: earnedUserBadges = [] } = useQuery({
    queryKey: ["public-user-badges", member.userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_badges" as any)
        .select("badge_type")
        .eq("user_id", member.userId!);
      return ((data || []) as any[]).map((r) => getUserBadgeConfig(r.badge_type)).filter(Boolean) as UserBadgeConfig[];
    },
    enabled: !!member.userId && !isDemo,
  });

  function publicBadgeIcon(type: string): React.ReactNode {
    if (type === "founding_member") return <Crown size={20} color="white" />;
    if (type === "group_member") return <Users size={20} color="white" />;
    if (type.startsWith("streak_")) return <Flame size={20} color="white" />;
    if (type.startsWith("scripture_")) return <BookOpen size={20} color="white" />;
    return <Medal size={20} color="white" />;
  }

  const reflectionEarned: BadgeItem[] = reflectionBadges.map((t) => ({
    label: t!.label, detail: t!.detail, color: t!.color, gradient: t!.gradient, animated: t!.animated,
    icon: <Medal size={20} color="white" />,
  }));
  const streakEarned  = earnedUserBadges.filter((b) => b.group === "streak").map((b): BadgeItem => ({ label: b.label, detail: b.detail, color: b.color, gradient: b.gradient, animated: b.animated, icon: publicBadgeIcon(b.type) }));
  const scriptEarned  = earnedUserBadges.filter((b) => b.group === "scripture").map((b): BadgeItem => ({ label: b.label, detail: b.detail, color: b.color, gradient: b.gradient, animated: b.animated, icon: publicBadgeIcon(b.type) }));
  const specialEarned = earnedUserBadges.filter((b) => b.group === "special").map((b): BadgeItem => ({ label: b.label, detail: b.detail, color: b.color, gradient: b.gradient, animated: b.animated, icon: publicBadgeIcon(b.type) }));

  return (
    <div
      className="px-5 pb-6 space-y-5 animate-fade-in"
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground flex-1">Profile</h1>
        <button
          onClick={() => setShowReport(true)}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active"
        >
          <MoreHorizontal size={18} className="text-muted-foreground" />
        </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center pt-2 pb-2">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-card mb-3 overflow-hidden"
          style={{ background: member.avatarUrl ? colors.accentBg : getAvatarColor(member.username) }}
        >
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-white">
              {member.firstName[0]}
              {member.lastName[0]}
            </span>
          )}
        </div>
        <h2 className="text-lg font-bold text-foreground">
          {member.firstName} {member.lastName}
        </h2>
        {member.churchName && (
          <p className="text-sm text-muted-foreground mt-0.5">{member.churchName}</p>
        )}

        <div className="flex items-center flex-wrap gap-2 mt-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
            <span className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center relative">
              <img src={fbsBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <img src={fbsLogoWhite} alt="FBS" className="relative w-3 h-3" />
            </span>
            <span className="text-xs font-medium text-muted-foreground">@{member.username}</span>
          </div>

          {member.instagramHandle && (
            <button
              onClick={() => window.open(`https://instagram.com/${member.instagramHandle}`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 tap-active transition-colors hover:bg-muted"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-muted-foreground">
                <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="6" r="1.5" fill="currentColor" />
              </svg>
              <span className="text-xs font-medium text-muted-foreground">@{member.instagramHandle}</span>
            </button>
          )}

        </div>

      </div>

      {/* Badges */}
      {(reflectionEarned.length > 0 || streakEarned.length > 0 || scriptEarned.length > 0 || specialEarned.length > 0) && (
        <section className="bg-card rounded-3xl p-5 shadow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">
            Badges
          </p>
          <BadgeStackGroup label="Special"     earned={specialEarned}    locked={[]} isOwn={false} />
          <BadgeStackGroup label="Streaks"     earned={streakEarned}     locked={[]} isOwn={false} />
          <BadgeStackGroup label="Reflections" earned={reflectionEarned} locked={[]} isOwn={false} />
          <BadgeStackGroup label="Scripture"   earned={scriptEarned}     locked={[]} isOwn={false} />
        </section>
      )}

      <ReportBlockSheet
        open={showReport}
        onClose={() => setShowReport(false)}
        reportedUserId={member.userId || member.username}
        reportedUserName={member.firstName}
        contentType="profile"
        churchId={churchId}
        onBlock={onBack}
        isDemo={isDemo}
      />
    </div>
  );
}
