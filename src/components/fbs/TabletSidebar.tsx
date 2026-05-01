import { Home, BookOpen, BookMarked, Users, Heart, HandCoins, User, PanelLeft, PanelLeftClose, Lock } from "lucide-react";
import { useAccentColors } from "./themeColors";
import { GIVING_URL } from "./data";
import FBSLogo from "@/assets/FBS_Logo_white.png";
import type { FeatureFlags } from "@/hooks/useFeatureFlags";

export type SidebarNavTarget =
  | "home"
  | "sermon"
  | "journal"
  | "community"
  | "bible"
  | "prayer"
  | "give"
  | "profile";

interface TabletSidebarProps {
  featureFlags: FeatureFlags;
  activeItem: string;
  onNavigate: (target: SidebarNavTarget) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const mainItems = [
  { id: "home" as const, label: "Home", Icon: Home },
  { id: "sermon" as const, label: "Sermon", Icon: BookOpen },
  { id: "journal" as const, label: "Journal", Icon: BookMarked },
];

const moreItemsDef = [
  { id: "community" as const, label: "Community", Icon: Users, featureKey: "community" as keyof FeatureFlags | null },
  { id: "bible" as const, label: "Bible", Icon: BookOpen, featureKey: null },
  { id: "prayer" as const, label: "Prayer", Icon: Heart, featureKey: "prayer" as keyof FeatureFlags | null },
  { id: "give" as const, label: "Give", Icon: HandCoins, featureKey: "giving" as keyof FeatureFlags | null },
];

export default function TabletSidebar({ featureFlags, activeItem, onNavigate, collapsed, onToggle }: TabletSidebarProps) {
  const colors = useAccentColors();

  const filteredMoreItems = moreItemsDef;

  const handleClick = (id: SidebarNavTarget) => {
    if (id === "give") {
      window.open(GIVING_URL, "_blank");
      return;
    }
    onNavigate(id);
  };

  const renderItem = (id: SidebarNavTarget, label: string, Icon: React.ElementType, locked = false) => {
    const isActive = !locked && activeItem === id;
    return (
      <button
        key={id}
        onClick={() => !locked && handleClick(id)}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 rounded-lg transition-colors text-left hover:bg-muted ${
          collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
        } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
        style={{ background: isActive ? colors.accentBg : undefined }}
      >
        {locked ? (
          <Lock
            size={20}
            strokeWidth={1.8}
            className="flex-shrink-0 text-muted-foreground"
          />
        ) : (
          <Icon
            size={20}
            strokeWidth={isActive ? 2.2 : 1.8}
            style={{ color: isActive ? colors.accent : "hsl(var(--muted-foreground))" }}
            className="flex-shrink-0"
          />
        )}
        {!collapsed && (
          <div>
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: locked ? "hsl(var(--muted-foreground))" : isActive ? colors.accent : "hsl(var(--foreground))" }}
            >
              {label}
            </span>
            {locked && <p className="text-[10px] text-muted-foreground">Requires church</p>}
          </div>
        )}
      </button>
    );
  };

  const sidebarWidth = collapsed ? 64 : 180;

  return (
    <aside
      className="hidden md:flex flex-col h-dvh border-r border-border bg-card fixed left-0 top-0 z-30 overflow-y-auto transition-all duration-200"
      style={{ width: sidebarWidth }}
    >
      <div className={`py-4 flex items-center ${collapsed ? "justify-center px-2 flex-col gap-2" : "justify-between px-4"}`}>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: colors.accent }}
        >
          <img src={FBSLogo} alt="FBS" className="w-6 h-6 object-contain" />
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav className={`flex-1 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {mainItems.map(({ id, label, Icon }) => renderItem(id, label, Icon))}
        <div className="my-3 border-t border-border" />
        {filteredMoreItems.map(({ id, label, Icon, featureKey }) => renderItem(id, label, Icon, featureKey ? !featureFlags[featureKey] : false))}
      </nav>

      <div className={`pb-4 ${collapsed ? "px-2" : "px-3"}`}>
        <div className="border-t border-border pt-3">
          {renderItem("profile", "Profile", User)}
        </div>
      </div>
    </aside>
  );
}
