import { useState, useEffect } from "react";
import { ArrowLeft, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { getAccentColors } from "./themeColors";
import {
  getFollowersList,
  getFollowingList,
  isFollowingDb,
  followUserDb,
  unfollowUserDb,
  type FollowListUser,
  DEMO_MEMBERS,
  getFollows,
  toggleFollow,
} from "./communityData";

interface FollowListSheetProps {
  userId: string;
  mode: "followers" | "following";
  onClose: () => void;
  onViewProfile?: (user: FollowListUser) => void;
  isDemo?: boolean;
}

export default function FollowListSheet({ userId, mode, onClose, onViewProfile, isDemo }: FollowListSheetProps) {
  const [users, setUsers] = useState<FollowListUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const colors = getAccentColors();

  useEffect(() => {
    if (isDemo) {
      // Demo mode: generate list from DEMO_MEMBERS
      const demoFollows = getFollows();
      const list: FollowListUser[] = DEMO_MEMBERS.slice(0, mode === "followers" ? 5 : 3).map((m) => ({
        userId: m.username, // use username as ID in demo
        username: m.username,
        firstName: m.firstName,
        lastName: m.lastName,
        avatarUrl: m.avatarUrl,
      }));
      setUsers(list);
      const states: Record<string, boolean> = {};
      list.forEach((u) => { states[u.userId] = demoFollows.includes(u.username); });
      setFollowStates(states);
      setLoading(false);
      return;
    }

    const fetchList = async () => {
      setLoading(true);
      const list = mode === "followers"
        ? await getFollowersList(userId)
        : await getFollowingList(userId);
      setUsers(list);

      // Check if current user follows each person
      const states: Record<string, boolean> = {};
      await Promise.all(
        list.map(async (u) => {
          states[u.userId] = await isFollowingDb(u.userId);
        })
      );
      setFollowStates(states);
      setLoading(false);
    };
    fetchList();
  }, [userId, mode, isDemo]);

  const handleToggle = async (targetUserId: string, username: string) => {
    const isCurrentlyFollowing = followStates[targetUserId];
    setFollowStates((prev) => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    if (isDemo) {
      toggleFollow(username);
      return;
    }

    if (isCurrentlyFollowing) {
      await unfollowUserDb(targetUserId);
    } else {
      await followUserDb(targetUserId);
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
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <h1 className="text-xl font-bold text-foreground capitalize">
          {mode} {!loading && `(${users.length})`}
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          {mode === "followers" ? "No followers yet" : "Not following anyone yet"}
        </p>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div
              key={u.userId}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card"
            >
              <button
                onClick={() => onViewProfile?.(u)}
                className="flex items-center gap-3.5 flex-1 min-w-0 text-left tap-active"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: "hsl(var(--muted))" }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {u.firstName?.[0] || ""}
                      {u.lastName?.[0] || ""}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </button>
              <button
                onClick={() => handleToggle(u.userId, u.username)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 tap-active transition-colors flex items-center gap-1"
                style={
                  followStates[u.userId]
                    ? { background: colors.accentBg, color: colors.accent }
                    : { background: colors.accent, color: colors.accentFg }
                }
              >
                {followStates[u.userId] ? <UserCheck size={12} /> : <UserPlus size={12} />}
                {followStates[u.userId] ? "Following" : "Follow"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
