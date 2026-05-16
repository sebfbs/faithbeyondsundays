import { Outlet, useNavigate } from "react-router-dom";
import { useChurchAdminAuth } from "@/hooks/useChurchAdminAuth";
import { useAuth } from "@/components/fbs/AuthProvider";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Church,
  LogOut,
  LayoutDashboard,
  Mic,
  Users,
  Settings,
  Menu,
  X,
  Users2,
  Heart,
  Bell,
  UserCog,
  Flag,
  Megaphone,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Sermons", url: "/admin/sermons", icon: Mic },
  { title: "Members", url: "/admin/members", icon: Users },
  { title: "Groups & Flags", url: "/admin/groups", icon: Users2 },
  { title: "Prayer", url: "/admin/prayer", icon: Heart },
  { title: "Moderation", url: "/admin/moderation", icon: Flag },
  { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Team", url: "/admin/team", icon: UserCog },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export default function AdminLayout() {
  const { loading, isChurchAdmin, user, churchId } = useChurchAdminAuth(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [churchName, setChurchName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { data: anthropicStatus } = useQuery({
    queryKey: ["anthropic-status"],
    queryFn: async () => {
      try {
        const res = await fetch("https://status.anthropic.com/api/v2/status.json");
        if (!res.ok) return null;
        const data = await res.json();
        return data.status as { indicator: string; description: string };
      } catch {
        return null;
      }
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: prayerCount = 0 } = useQuery({
    queryKey: ["admin-unanswered-prayers", churchId],
    enabled: !!churchId,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count } = await supabase
        .from("prayer_requests")
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId!)
        .eq("is_answered", false);
      return count ?? 0;
    },
  });

  const { data: reportCount = 0 } = useQuery({
    queryKey: ["admin-pending-reports", churchId],
    enabled: !!churchId,
    refetchInterval: 60000,
    queryFn: async () => {
      const { count } = await supabase
        .from("content_reports" as any)
        .select("*", { count: "exact", head: true })
        .eq("church_id", churchId!)
        .eq("status", "pending");
      return count ?? 0;
    },
  });

  // Check if admin has completed profile setup
  useEffect(() => {
    if (!user || !churchId) return;
    supabase
      .from("profiles")
      .select("first_name, onboarding_complete")
      .eq("user_id", user.id)
      .eq("church_id", churchId)
      .maybeSingle()
      .then(({ data }) => {
        if (data && (!data.first_name || !data.onboarding_complete)) {
          navigate("/admin/setup", { replace: true });
        } else {
          setProfileChecked(true);
        }
      });
  }, [user, churchId, navigate]);

  useEffect(() => {
    if (!churchId) return;
    supabase
      .from("churches")
      .select("name")
      .eq("id", churchId)
      .single()
      .then(({ data }) => {
        if (data) setChurchName(data.name);
      });
  }, [churchId]);

  if (loading || !profileChecked) {
    return (
      <div className="admin-root min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isChurchAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="admin-root min-h-screen flex w-full bg-background">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Church className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-foreground truncate max-w-[200px]">
            {churchName || "Church Admin"}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-foreground/20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 h-screen w-60 bg-card border-r border-border flex flex-col shrink-0
          transition-transform md:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="p-5 border-b border-border hidden md:block">
          <div className="flex items-center gap-2">
            <Church className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm text-foreground truncate">
              {churchName || "Church Admin"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{user?.email}</p>
        </div>

        {/* Mobile: add top padding for the top bar */}
        <div className="md:hidden h-14" />

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.end}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              activeClassName="bg-secondary text-foreground font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.title === "Prayer" && prayerCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center ml-auto">
                  {prayerCount > 99 ? "99+" : prayerCount}
                </span>
              )}
              {item.title === "Moderation" && reportCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center ml-auto">
                  {reportCount > 99 ? "99+" : reportCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        {anthropicStatus && anthropicStatus.indicator !== "none" && !bannerDismissed && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800 flex-1">
              <span className="font-semibold">Anthropic API is currently experiencing issues.</span>{" "}
              Sermon processing may be delayed.{" "}
              <a
                href="https://status.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-amber-900"
              >
                Check status →
              </a>
            </p>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <Outlet context={{ churchId, role: "admin" }} />
      </main>
    </div>
  );
}
