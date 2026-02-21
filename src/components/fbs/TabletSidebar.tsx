import { useState, useEffect } from "react";
import { Home, BookOpen, BookMarked, Users, Heart, HandCoins, User, ChevronLeft, ChevronRight } from "lucide-react";
import { FEATURE_FLAGS } from "./featureFlags";
import { getAccentColors } from "./themeColors";
import { GIVING_URL } from "./data";
import FBSLogo from "@/assets/FBS_Logo_white.png";

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

const moreItems = [
  { id: "community" as const, label: "Community", Icon: Users, featureKey: "community" },
  { id: "bible" as const, label: "Bible", Icon: BookOpen, featureKey: null },
  { id: "prayer" as const, label: "Prayer", Icon: Heart, featureKey: "prayer" },
  { id: "give" as const, label: "Give", Icon: HandCoins, featureKey: "giving" },
];

const filteredMoreItems = moreItems.filter(
  (item) => !item.featureKey || FEATURE_FLAGS[item.featureKey]
);

export default function TabletSidebar({ activeItem, onNavigate, collapsed, onToggle }: TabletSidebarProps) {
  const colors = getAccentColors();

  const handleClick = (id: SidebarNavTarget) => {
    if (id === "give") {
      window.open(GIVING_URL, "_blank");
      return;
    }
    onNavigate(id);
  };

  const renderItem = (id: SidebarNavTarget, label: string, Icon: React.ElementType) => {
    const isActive = activeItem === id;
    return (
      <button
        key={id}
        onClick={() => handleClick(id)}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 rounded-xl transition-all text-left ${
          collapsed ? "justify-center px-2 py-3" : "px-4 py-3"
        }`}
        style={{
          background: isActive ? colors.accentBg : "transparent",
        }}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.2 : 1.8}
          style={{ color: isActive ? colors.accent : "hsl(var(--muted-foreground))" }}
          className="flex-shrink-0"
        />
        {!collapsed && (
          <span
            className="text-sm font-semibold whitespace-nowrap"
            style={{ color: isActive ? colors.accent : "hsl(var(--foreground))" }}
          >
            {label}
          </span>
        )}
      </button>
    );
  };

  const sidebarWidth = collapsed ? 64 : 240;

  return (
    <aside
      className="hidden md:flex flex-col h-dvh border-r border-border bg-card fixed left-0 top-0 z-30 overflow-y-auto transition-all duration-200"
      style={{ width: sidebarWidth }}
    >
      {/* Logo + Toggle */}
      <div className={`py-6 flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <div className={`flex items-center ${collapsed ? "" : "gap-3"}`}>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.accent }}
          >
            <img src={FBSLogo} alt="FBS" className="w-6 h-6 object-contain" />
          </div>
          {!collapsed && (
            <span className="text-base font-bold text-foreground tracking-tight whitespace-nowrap">
              Faith Beyond Sundays
            </span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} className="text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Collapse toggle when collapsed */}
      {collapsed && (
        <div className="flex justify-center mb-2">
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="Expand sidebar"
          >
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Main nav */}
      <nav className={`flex-1 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>
        {mainItems.map(({ id, label, Icon }) => renderItem(id, label, Icon))}

        <div className="my-3 border-t border-border" />

        {filteredMoreItems.map(({ id, label, Icon }) => renderItem(id, label, Icon))}
      </nav>

      {/* Profile at bottom */}
      <div className={`pb-4 ${collapsed ? "px-2" : "px-3"}`}>
        <div className="border-t border-border pt-3">
          {renderItem("profile", "Profile", User)}
        </div>
      </div>
    </aside>
  );
}
