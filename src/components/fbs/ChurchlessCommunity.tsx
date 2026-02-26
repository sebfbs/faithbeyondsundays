import { useState, useMemo } from "react";
import { ArrowLeft, Search, Church, Users, Loader2, MapPin, UserPlus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAccentColors } from "./themeColors";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "@/hooks/use-toast";
import type { CommunityMember } from "./communityData";

interface ChurchlessCommunityProps {
  onBack: () => void;
  onViewProfile: (member: CommunityMember) => void;
}

export default function ChurchlessCommunity({ onBack, onViewProfile }: ChurchlessCommunityProps) {
  const [userSearch, setUserSearch] = useState("");
  const [churchSearch, setChurchSearch] = useState("");
  const [joiningChurchId, setJoiningChurchId] = useState<string | null>(null);
  const colors = getAccentColors();
  const { user: authUser } = useAuth();
  const { refetch: refetchProfile } = useProfile();

  // Search users across the platform
  const { data: userResults = [], isFetching: usersLoading } = useQuery({
    queryKey: ["user-search", userSearch],
    queryFn: async () => {
      const q = userSearch.trim().toLowerCase();
      const { data, error } = await supabase
        .from("profiles_safe")
        .select("user_id, username, first_name, last_name, avatar_url, instagram_handle, created_at, churches(name, code)")
        .neq("user_id", authUser?.id || "")
        .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(20);
      if (error) throw error;
      return (data || []).map((p) => ({
        username: p.username,
        firstName: p.first_name || "",
        lastName: p.last_name || "",
        churchName: (p.churches as any)?.name || "",
        churchCode: (p.churches as any)?.code || "",
        avatarUrl: p.avatar_url || undefined,
        memberSince: new Date(p.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        challengesCompleted: 0,
        isGroupMember: false,
        instagramHandle: p.instagram_handle || undefined,
        userId: (p as any).user_id,
      })) as CommunityMember[];
    },
    enabled: userSearch.trim().length >= 2,
  });

  // Search churches
  const { data: churchResults = [], isFetching: churchesLoading } = useQuery({
    queryKey: ["church-search-community", churchSearch],
    queryFn: async () => {
      const q = churchSearch.trim().toLowerCase();
      const { data, error } = await supabase
        .from("churches")
        .select("id, name, code, city, state")
        .or(`name.ilike.%${q}%,code.ilike.%${q}%,city.ilike.%${q}%`)
        .eq("is_active", true)
        .limit(15);
      if (error) throw error;
      return data || [];
    },
    enabled: churchSearch.trim().length >= 2,
  });

  const handleJoinChurch = async (churchId: string, churchName: string) => {
    if (!authUser) return;
    setJoiningChurchId(churchId);
    try {
      // Update profile with church_id
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ church_id: churchId })
        .eq("user_id", authUser.id);
      if (profileError) throw profileError;

      // Assign member role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: authUser.id, church_id: churchId, role: "member" })
        .select();
      // Ignore duplicate role errors
      if (roleError && !roleError.message.includes("duplicate")) throw roleError;

      await refetchProfile();
      toast({ title: `Welcome to ${churchName}!`, description: "You're now connected to your church community." });
      // Page will re-render with church data via profile refetch
    } catch (e: any) {
      toast({ title: "Couldn't join church", description: e.message, variant: "destructive" });
    } finally {
      setJoiningChurchId(null);
    }
  };

  const showUserResults = userSearch.trim().length >= 2;
  const showChurchResults = churchSearch.trim().length >= 2;

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

      {/* Find Your Community card */}
      <div className="bg-card rounded-3xl p-6 shadow-card text-center">
        <div
          className="w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center"
          style={{ background: colors.accentBg }}
        >
          <Church size={22} style={{ color: colors.accent }} />
        </div>
        <h2 className="text-base font-bold text-foreground mb-1">Find Your Community</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Search for a church to join below, or discover people on the app.
        </p>
      </div>

      {/* Church Search Section */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Find a Church
        </p>
        <div className="relative">
          <Church size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={churchSearch}
            onChange={(e) => setChurchSearch(e.target.value)}
            placeholder="Search by church name or city"
            className="w-full bg-card rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
          />
        </div>

        {churchesLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {showChurchResults && !churchesLoading && churchResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No churches found. Try a different search.
          </p>
        )}

        {showChurchResults && churchResults.length > 0 && (
          <div className="space-y-2">
            {churchResults.map((church) => (
              <div
                key={church.id}
                className="flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card"
              >
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: colors.accentBg }}
                >
                  <Church size={18} style={{ color: colors.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{church.name}</p>
                  {(church.city || church.state) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin size={10} />
                      {[church.city, church.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleJoinChurch(church.id, church.name)}
                  disabled={joiningChurchId === church.id}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold shrink-0 tap-active transition-colors"
                  style={{ background: colors.accentBg, color: colors.accent }}
                >
                  {joiningChurchId === church.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Join"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Search Section */}
      <div className="space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Discover People
        </p>
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search by name or @username"
            className="w-full bg-card rounded-2xl pl-11 pr-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-card focus:outline-none focus:ring-2 focus:ring-amber/40"
          />
        </div>

        {usersLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {showUserResults && !usersLoading && userResults.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No users found. Try a different search.
          </p>
        )}

        {showUserResults && userResults.length > 0 && (
          <div className="space-y-2">
            {userResults.map((member) => (
              <button
                key={member.username}
                onClick={() => onViewProfile(member)}
                className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-card shadow-card tap-active hover:shadow-card-hover transition-shadow text-left"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ background: "hsl(var(--muted))" }}
                >
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">
                      {member.firstName?.[0] || ""}
                      {member.lastName?.[0] || ""}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{member.username}
                    {member.churchName && (
                      <span className="ml-1.5 text-muted-foreground/70">· {member.churchName}</span>
                    )}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!showUserResults && (
          <p className="text-xs text-muted-foreground text-center py-3">
            Type at least 2 characters to search
          </p>
        )}
      </div>
    </div>
  );
}
