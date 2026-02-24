import { useQuery } from "@tanstack/react-query";
import { Users, Award, UserPlus, BookText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_COMMUNITY_PULSE } from "./demoData";
import { getBadgeTier } from "./badgeConfig";
import { getAccentColors } from "./themeColors";
import { formatDistanceToNow } from "date-fns";

interface CommunityPulseProps {
  churchId?: string;
  userId?: string;
  isDemo?: boolean;
  locked?: boolean;
  onNavigate?: (screen: string) => void;
}

interface PulseData {
  latest_reflector: { first_name: string; avatar_url: string | null; reflected_at: string } | null;
  milestone: { first_name: string; avatar_url: string | null; milestone: number; earned_at: string } | null;
  newest_member: { first_name: string; avatar_url: string | null; joined_at: string } | null;
  active_avatars: { avatar_url: string | null; first_name: string }[];
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return "";
  }
}

const LOCKED_PULSE: PulseData = {
  latest_reflector: null,
  milestone: { first_name: "Sarah", avatar_url: null, milestone: 10, earned_at: new Date().toISOString() },
  newest_member: null,
  active_avatars: [
    { avatar_url: null, first_name: "Sarah" },
    { avatar_url: null, first_name: "James" },
    { avatar_url: null, first_name: "Emily" },
  ],
};

export default function CommunityPulse({ churchId, userId, isDemo, locked, onNavigate }: CommunityPulseProps) {
  const colors = getAccentColors();

  const { data: pulse } = useQuery<PulseData>({
    queryKey: ["community-pulse", churchId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_community_pulse", {
        p_church_id: churchId!,
        p_user_id: userId!,
      });
      if (error) throw error;
      return data as unknown as PulseData;
    },
    enabled: !isDemo && !locked && !!churchId && !!userId,
    staleTime: 1000 * 60 * 5,
  });

  const pulseData: PulseData | undefined = locked ? LOCKED_PULSE : isDemo ? DEMO_COMMUNITY_PULSE : pulse;

  if (!pulseData) return null;

  // Pick the best story to show
  const { latest_reflector, milestone, newest_member, active_avatars } = pulseData;
  const hasContent = latest_reflector || milestone || newest_member;
  if (!hasContent) return null;

  // Determine primary message
  let icon = Users;
  let message = "";

  if (milestone) {
    const tier = getBadgeTier(milestone.milestone);
    icon = Award;
    message = `${milestone.first_name} earned their ${tier?.label || milestone.milestone + " Reflections"} badge!`;
  } else if (latest_reflector) {
    icon = BookText;
    message = `${latest_reflector.first_name} just reflected ${timeAgo(latest_reflector.reflected_at)}`;
  } else if (newest_member) {
    icon = UserPlus;
    message = `${newest_member.first_name} just joined the community`;
  }

  const Icon = icon;

  return (
    <button
      onClick={() => !locked && onNavigate?.("community")}
      className={`w-full rounded-3xl p-5 shadow-card text-left transition-opacity ${locked ? "opacity-50 grayscale pointer-events-none" : "tap-active hover:opacity-90"}`}
      style={{
        background: "hsl(0 0% 100% / 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: colors.accentBg }}
        >
          <Icon size={14} style={{ color: colors.accent }} />
        </div>
        <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
          Community Pulse
        </span>
      </div>

      <p className="text-foreground font-medium text-sm leading-relaxed">{message}</p>

      {/* Active avatars */}
      {active_avatars && active_avatars.length > 0 && (
        <div className="flex items-center gap-1 mt-3">
          <div className="flex -space-x-2">
            {active_avatars.slice(0, 5).map((a, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full border-2 border-white overflow-hidden flex items-center justify-center"
                style={{ background: "hsl(var(--muted))" }}
              >
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {a.first_name?.[0] || "?"}
                  </span>
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-2">Active recently</span>
        </div>
      )}

      {locked && (
        <p className="text-xs text-muted-foreground mt-3 italic">Join a church to see your community</p>
      )}
    </button>
  );
}
