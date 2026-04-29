import { useState, useEffect } from "react";
import { ArrowLeft, Medal, Crown, Users, Flame, UserCheck, UserPlus, BookOpen, MoreHorizontal } from "lucide-react";
import ReportBlockSheet from "./ReportBlockSheet";
import { type CommunityMember, isFollowing, toggleFollow, isFollowingDb, followUserDb, unfollowUserDb, getFollowerCount, getFollowingCount, DEMO_MEMBERS } from "./communityData";
import { getAccentColors } from "./themeColors";
import { getBadgeTier, getUserBadgeConfig, BADGE_TIERS, type UserBadgeConfig } from "./badgeConfig";
import BadgeStackGroup, { type BadgeItem } from "./BadgeStackGroup";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import FollowListSheet from "./FollowListSheet";
import type { FollowListUser } from "./communityData";
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
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListMode, setFollowListMode] = useState<"followers" | "following" | null>(null);
  const [viewingMember, setViewingMember] = useState<CommunityMember | null>(null);
  const [showReport, setShowReport] = useState(false);
  const colors = getAccentColors();

  useEffect(() => {
    if (isDemo) {
      setFollowing(isFollowing(member.username));
      // Demo counts must match FollowListSheet demo slices
      setFollowerCount(Math.min(DEMO_MEMBERS.length, 5));
      setFollowingCount(Math.min(DEMO_MEMBERS.length, 3));
      return;
    }
    if (!member.userId) return;
    const load = async () => {
      const [isF, fc, fgc] = await Promise.all([
        isFollowingDb(member.userId!),
        getFollowerCount(member.userId!),
        getFollowingCount(member.userId!),
      ]);
      setFollowing(isF);
      setFollowerCount(fc);
      setFollowingCount(fgc);
    };
    load();
  }, [member.userId, member.username, isDemo]);

  const handleToggleFollow = async () => {
    if (isDemo) {
      toggleFollow(member.username);
      setFollowing((prev) => !prev);
      setFollowerCount((prev) => following ? prev - 1 : prev + 1);
      return;
    }
    if (!member.userId) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowerCount((prev) => wasFollowing ? prev - 1 : prev + 1);
    if (wasFollowing) {
      await unfollowUserDb(member.userId);
    } else {
      await followUserDb(member.userId);
    }
  };

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

  // Show nested public profile
  if (viewingMember) {
    return (
      <PublicProfileScreen
        member={viewingMember}
        onBack={() => setViewingMember(null)}
        isDemo={isDemo}
      />
    );
  }

  // Show follow list overlay
  if (followListMode) {
    const handleViewProfile = (u: FollowListUser) => {
      const asMember: CommunityMember = {
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        avatarUrl: u.avatarUrl,
        userId: u.userId,
        churchName: "",
        churchCode: "",
        memberSince: "",
        challengesCompleted: 0,
        isGroupMember: false,
      };
      setFollowListMode(null);
      setViewingMember(asMember);
    };
    return (
      <FollowListSheet
        userId={member.userId || member.username}
        mode={followListMode}
        onClose={() => setFollowListMode(null)}
        onViewProfile={handleViewProfile}
        isDemo={isDemo}
      />
    );
  }

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

        {/* Follower / Following counts */}
        <div className="flex items-center gap-4 mt-2">
          <button onClick={() => setFollowListMode("followers")} className="text-center tap-active">
            <span className="text-sm font-bold text-foreground">{followerCount}</span>
            <span className="text-xs text-muted-foreground ml-1">Followers</span>
          </button>
          <div className="w-px h-4 bg-border" />
          <button onClick={() => setFollowListMode("following")} className="text-center tap-active">
            <span className="text-sm font-bold text-foreground">{followingCount}</span>
            <span className="text-xs text-muted-foreground ml-1">Following</span>
          </button>
        </div>

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

        {/* Follow button */}
        <button
          onClick={handleToggleFollow}
          className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-sm tap-active transition-colors"
          style={
            following
              ? { background: colors.accentBg, color: colors.accent }
              : { background: colors.accent, color: colors.accentFg }
          }
        >
          {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
          {following ? "Following" : "Follow"}
        </button>
      </div>

      {/* Badges */}
      {(reflectionEarned.length > 0 || streakEarned.length > 0 || scriptEarned.length > 0 || specialEarned.length > 0) && (
        <section className="bg-card rounded-3xl p-5 shadow-card">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-5">
            Badges
          </p>
          <BadgeStackGroup label="Reflections" earned={reflectionEarned} locked={[]} isOwn={false} />
          <BadgeStackGroup label="Streaks"     earned={streakEarned}     locked={[]} isOwn={false} />
          <BadgeStackGroup label="Scripture"   earned={scriptEarned}     locked={[]} isOwn={false} />
          <BadgeStackGroup label="Special"     earned={specialEarned}    locked={[]} isOwn={false} />
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
