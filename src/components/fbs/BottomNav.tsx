import { Home, BookOpen, BookMarked, MoreHorizontal } from "lucide-react";
import { getAccentColors } from "./themeColors";

export type TabId = "home" | "sermon" | "journal" | "more";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: "home" as TabId, label: "Home", Icon: Home },
  { id: "sermon" as TabId, label: "Sermon", Icon: BookOpen },
  { id: "journal" as TabId, label: "Journal", Icon: BookMarked },
  { id: "more" as TabId, label: "More", Icon: MoreHorizontal },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const colors = getAccentColors();
  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card/95 backdrop-blur-md border-t border-border shadow-nav z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-[68px]">
        {tabs.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 tap-active transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={isActive ? undefined : "text-muted-foreground"}
                style={isActive ? { color: colors.accent } : undefined}
              />
              <span
                className={`text-[10.5px] font-medium tracking-wide transition-colors ${
                  isActive ? "" : "text-muted-foreground"
                }`}
                style={isActive ? { color: colors.accent } : undefined}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
