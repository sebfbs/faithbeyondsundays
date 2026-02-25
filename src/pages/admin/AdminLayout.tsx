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
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Sermons", url: "/admin/sermons", icon: Mic },
  { title: "Members", url: "/admin/members", icon: Users },
  { title: "Groups & Flags", url: "/admin/groups", icon: Users2 },
  { title: "Prayer", url: "/admin/prayer", icon: Heart },
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
        <Outlet context={{ churchId, role: "admin" }} />
      </main>
    </div>
  );
}
