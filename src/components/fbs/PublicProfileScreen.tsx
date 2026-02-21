import { useState } from "react";
import { ArrowLeft, Award, Medal, Star, Users, Calendar, UserCheck, UserPlus, HeartHandshake, ShieldCheck } from "lucide-react";
import { type CommunityMember, isFollowing, toggleFollow } from "./communityData";
import { getAccentColors } from "./themeColors";
import fbsBg from "@/assets/FBS_with_grain_and_blue.png";
import fbsLogoWhite from "@/assets/FBS_Logo_white_2.png";

interface PublicProfileScreenProps {
  member: CommunityMember & { hasInvited?: boolean };
  onBack: () => void;
}

export default function PublicProfileScreen({ member, onBack }: PublicProfileScreenProps) {
  const [following, setFollowing] = useState(() => isFollowing(member.username));
  const colors = getAccentColors();

  const handleToggleFollow = () => {
    toggleFollow(member.username);
    setFollowing((prev) => !prev);
  };

  const badges = [
    ...(member.role === "pastor"
      ? [
          {
            icon: ShieldCheck,
            label: "Pastor",
            detail: member.churchName,
            color: "hsl(38, 100%, 47%)",
          },
        ]
      : []),
    {
      icon: Calendar,
      label: "Member Since",
      detail: member.memberSince,
      color: "hsl(207, 65%, 55%)",
    },
    {
      icon: Award,
      label: "Challenges",
      detail: `${member.challengesCompleted} completed`,
      color: "hsl(38, 100%, 47%)",
    },
    ...(member.isGroupMember
      ? [
          {
            icon: Users,
            label: "Group Member",
            detail: "Community",
            color: "hsl(150, 55%, 45%)",
          },
        ]
      : []),
    ...(member.challengesCompleted >= 10
      ? [
          {
            icon: Star,
            label: "Dedicated",
            detail: "10+ challenges",
            color: "hsl(340, 70%, 55%)",
          },
        ]
      : []),
    ...(member.challengesCompleted >= 20
      ? [
          {
            icon: Medal,
            label: "Champion",
            detail: "20+ challenges",
            color: "hsl(270, 60%, 55%)",
          },
        ]
      : []),
    ...(member.hasInvited
      ? [
          {
            icon: HeartHandshake,
            label: "Community Builder",
            detail: "Invited a friend",
            color: "hsl(170, 55%, 45%)",
          },
        ]
      : []),
  ];

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
          {badges.map(({ icon: Icon, label, detail, color }) => (
            <div
              key={label}
              className="rounded-2xl p-3.5 bg-muted/50"
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
    </div>
  );
}
