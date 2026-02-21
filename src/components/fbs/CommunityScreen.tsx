import { useState, useMemo } from "react";
import { ArrowLeft, Search, Church, Users, Award, Share2 } from "lucide-react";
import { DEMO_MEMBERS, getFollows, markInviteSent, type CommunityMember } from "./communityData";
import { getAccentColors } from "./themeColors";
import { toast } from "@/hooks/use-toast";

interface CommunityScreenProps {
  onBack: () => void;
  onViewProfile: (member: CommunityMember) => void;
  userChurchCode: string;
  userChurchName: string;
}

export default function CommunityScreen({
  onBack,
  onViewProfile,
  userChurchCode,
  userChurchName,
}: CommunityScreenProps) {
  const [search, setSearch] = useState("");
  const colors = getAccentColors();
  const follows = getFollows();

  const churchMembers = useMemo(
    () => DEMO_MEMBERS.filter((m) => m.churchCode === userChurchCode),
    [userChurchCode]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return DEMO_MEMBERS.filter(
      (m) =>
        m.username.includes(q) ||
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q)
    );
  }, [search]);

  const displayList = searchResults ?? churchMembers;
  const isSearching = searchResults !== null;

  const handleInvite = async () => {
    const shareData = {
      title: "Join Faith Beyond Sundays",
      text: `Join me on Faith Beyond Sundays! Use church code '${userChurchCode}' to connect with ${userChurchName}.`,
      url: "https://faithbeyondsundays.lovable.app",
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        markInviteSent();
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        markInviteSent();
        toast({ title: "Invite link copied!", description: "Share it with a friend." });
      }
    } catch (e) {
      // User cancelled share sheet — no action needed
    }
  };

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
        <h1 className="text-xl font-bold text-foreground">Community</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or @username"
          className="w-full bg-card rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
        />
      </div>

      {/* Church header */}
      {!isSearching && (
        <div className="bg-card rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: colors.accentBg }}
            >
              <Church size={22} style={{ color: colors.accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {userChurchName}
              </p>
              <p className="text-xs text-muted-foreground">
                {churchMembers.length >= 15
                  ? `${churchMembers.length} member${churchMembers.length !== 1 ? "s" : ""}`
                  : "Your church family"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invite a Friend */}
      {!isSearching && (
        <button
          onClick={handleInvite}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card tap-active hover:shadow-card-hover transition-shadow"
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "hsl(170 55% 45% / 0.12)" }}
          >
            <Share2 size={19} style={{ color: "hsl(170, 55%, 45%)" }} />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-foreground">Invite a friend</p>
            <p className="text-xs text-muted-foreground">Share your church code & earn a badge</p>
          </div>
        </button>
      )}

      {/* Section label */}
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        {isSearching
          ? `${displayList.length} result${displayList.length !== 1 ? "s" : ""}`
          : "Church Members"}
      </p>

      {/* Member list */}
      <div className="space-y-2">
        {displayList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No members found
          </p>
        )}
        {displayList.map((member) => (
          <button
            key={member.username}
            onClick={() => onViewProfile(member)}
            className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card tap-active hover:shadow-card-hover transition-shadow text-left"
          >
            {/* Avatar */}
            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-muted-foreground">
                  {member.firstName[0]}
                  {member.lastName[0]}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{member.username}
                {isSearching && (
                  <span className="ml-1.5 text-muted-foreground/70">
                    · {member.churchName}
                  </span>
                )}
              </p>
            </div>
            {/* Badge count */}
            <div className="flex items-center gap-1 shrink-0">
              <Award size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                {member.challengesCompleted}
              </span>
            </div>
            {/* Following indicator */}
            {follows.includes(member.username) && (
              <div
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                style={{ background: colors.accentBg, color: colors.accent }}
              >
                Following
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
