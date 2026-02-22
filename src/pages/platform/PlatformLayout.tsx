import { Outlet, useNavigate } from "react-router-dom";
import { usePlatformAuth } from "@/hooks/usePlatformAuth";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/components/fbs/AuthProvider";
import { LayoutDashboard, Church, LogOut, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Dashboard", url: "/platform/dashboard", icon: LayoutDashboard },
  { title: "Churches", url: "/platform/churches", icon: Church },
];

export default function PlatformLayout() {
  const { loading, isPlatformAdmin, user } = usePlatformAuth(true);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950" style={{ maxWidth: "100%" }}>
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isPlatformAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/platform");
  };

  return (
    <div className="min-h-screen flex w-full bg-slate-950" style={{ maxWidth: "100%" }}>
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm text-slate-100">FBS Platform</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
              activeClassName="bg-slate-800 text-slate-100 font-medium"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
