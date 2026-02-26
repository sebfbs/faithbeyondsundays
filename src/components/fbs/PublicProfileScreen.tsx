import { useState, useEffect } from "react";
import { ArrowLeft, Medal, Star, Users, Calendar, UserCheck, UserPlus, HeartHandshake, ShieldCheck, BookOpen } from "lucide-react";
import { type CommunityMember, isFollowing, toggleFollow, isFollowingDb, followUserDb, unfollowUserDb, getFollowerCount, getFollowingCount, DEMO_MEMBERS } from "./communityData";
import { getAccentColors } from "./themeColors";
import { getBadgeTier } from "./badgeConfig";
import FollowListSheet from "./FollowListSheet";
import type { FollowListUser } from "./communityData";
import fbsBg from "@/assets/FBS_with_grain_and_blue.png";
import fbsLogoWhite from "@/assets/FBS_Logo_white_2.png";

interface PublicProfileScreenProps {
  member: CommunityMember & { hasInvited?: boolean; reflectionMilestone?: number };
  onBack: () => void;
  isDemo?: boolean;
}

export default function PublicProfileScreen({ member, onBack, isDemo }: PublicProfileScreenProps) {
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followListMode, setFollowListMode] = useState<"followers" | "following" | null>(null);
  const [viewingMember, setViewingMember] = useState<CommunityMember | null>(null);
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

  const reflectionBadge = member.reflectionMilestone ? getBadgeTier(member.reflectionMilestone) : undefined;

  const badges: { icon: any; label: string; detail: string; color?: string; gradient?: string; animated?: boolean }[] = [
    ...(member.role === "pastor"
      ? [{ icon: ShieldCheck, label: "Pastor", detail: member.churchName, color: "hsl(38, 100%, 47%)" }]
      : []),
    { icon: Calendar, label: "Member Since", detail: member.memberSince, color: "hsl(207, 65%, 55%)" },
    ...(reflectionBadge
      ? [{
          icon: BookOpen,
          label: reflectionBadge.label,
          detail: reflectionBadge.detail,
          color: reflectionBadge.color,
          gradient: reflectionBadge.gradient,
          animated: reflectionBadge.animated,
        }]
      : []),
    ...(member.isGroupMember
      ? [{ icon: Users, label: "Group Member", detail: "Community", color: "hsl(150, 55%, 45%)" }]
      : []),
    ...(member.hasInvited
      ? [{ icon: HeartHandshake, label: "Community Builder", detail: "Invited a friend", color: "hsl(170, 55%, 45%)" }]
      : []),
  ];

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
        <h1 className="text-xl font-bold text-foreground">Profile</h1>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center pt-2 pb-2">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-card mb-3 overflow-hidden"
          style={{ background: colors.accentBg }}
        >
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold" style={{ color: colors.accent }}>
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
      <section className="bg-card rounded-3xl p-5 shadow-card">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Badges
        </p>
        <div className="grid grid-cols-2 gap-3">
          {badges.map(({ icon: Icon, label, detail, color, gradient, animated }) => (
            <div
              key={label}
              className="rounded-2xl p-3.5 bg-muted/50"
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${animated ? "animate-gradient-rotate" : ""}`}
                style={
                  gradient
                    ? { background: gradient, backgroundSize: "200% 200%" }
                    : { background: `${color}22` }
                }
              >
                <Icon size={17} style={{ color: animated ? "white" : color }} />
              </div>
              <p className="text-xs font-bold text-foreground leading-tight">
                {label}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
