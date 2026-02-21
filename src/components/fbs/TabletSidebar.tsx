import { Home, BookOpen, BookMarked, Users, Heart, HandCoins, User } from "lucide-react";
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

export default function TabletSidebar({ activeItem, onNavigate }: TabletSidebarProps) {
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
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left"
        style={{
          background: isActive ? colors.accentBg : "transparent",
        }}
      >
        <Icon
          size={20}
          strokeWidth={isActive ? 2.2 : 1.8}
          style={{ color: isActive ? colors.accent : "hsl(var(--muted-foreground))" }}
        />
        <span
          className="text-sm font-semibold"
          style={{ color: isActive ? colors.accent : "hsl(var(--foreground))" }}
        >
          {label}
        </span>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex flex-col w-[240px] min-w-[240px] h-dvh border-r border-border bg-card sticky top-0">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: colors.accent }}
        >
          <img src={FBSLogo} alt="FBS" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-base font-bold text-foreground tracking-tight">
          Faith Beyond Sundays
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-1">
        {mainItems.map(({ id, label, Icon }) => renderItem(id, label, Icon))}

        <div className="my-3 border-t border-border" />

        {filteredMoreItems.map(({ id, label, Icon }) => renderItem(id, label, Icon))}
      </nav>

      {/* Profile at bottom */}
      <div className="px-3 pb-4">
        <div className="border-t border-border pt-3">
          {renderItem("profile", "Profile", User)}
        </div>
      </div>
    </aside>
  );
}
