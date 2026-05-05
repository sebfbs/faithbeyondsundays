import { Users, Heart, User, BookOpen, HandCoins, Lock, ChevronRight } from "lucide-react";
import { useAccentColors } from "./themeColors";
import type { FeatureFlags } from "@/hooks/useFeatureFlags";

interface MoreSheetProps {
  featureFlags: FeatureFlags;
  onProfile: () => void;
  onCommunity: () => void;
  onBible: () => void;
  onPrayer: () => void;
  onClose: () => void;
  givingUrl?: string;
  onGive?: () => void;
}

export default function MoreSheet({ featureFlags, onProfile, onCommunity, onBible, onPrayer, onClose, givingUrl, onGive }: MoreSheetProps) {
  const colors = useAccentColors();

  const allOptions = [
    { icon: Users, label: "Community", key: "community", featureKey: "community" as keyof FeatureFlags | null },
    { icon: BookOpen, label: "Bible", key: "bible", featureKey: null },
    { icon: Heart, label: "Prayer", key: "prayer", featureKey: "prayer" as keyof FeatureFlags | null },
    { icon: HandCoins, label: "Give", key: "give", featureKey: "giving" as keyof FeatureFlags | null },
    { icon: User, label: "Profile", key: "profile", featureKey: null },
  ];

  const options = allOptions;

  const handleOption = (key: string) => {
    if (key === "profile") onProfile();
    else if (key === "community") onCommunity();
    else if (key === "bible") onBible();
    else if (key === "prayer") onPrayer();
    else if (key === "give") { if (onGive) onGive(); else if (givingUrl) window.open(givingUrl, "_blank"); }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[55] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/15 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-3 pb-28 animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="w-9 h-[5px] rounded-full bg-muted-foreground/30" />
        </div>
        {options.map(({ icon: Icon, label, key, featureKey }, index) => {
          const locked = featureKey ? !featureFlags[featureKey] : false;
          return (
            <button
              key={key}
              onClick={() => !locked && handleOption(key)}
              className={`w-full flex items-center gap-3 px-1 py-3.5 text-left tap-active transition-colors ${locked ? "opacity-50 cursor-not-allowed" : "active:bg-muted/60"}`}
            >
              {locked ? (
                <Lock size={18} className="text-muted-foreground flex-shrink-0" />
              ) : (
                <Icon size={18} style={{ color: colors.accent }} className="flex-shrink-0" />
              )}
              <span className={`text-[15px] flex-1 ${locked ? "text-muted-foreground" : "text-foreground"}`}>{label}</span>
              {locked ? (
                <span className="text-xs text-muted-foreground">Requires church</span>
              ) : (
                <ChevronRight size={16} className="text-muted-foreground/50 flex-shrink-0" />
              )}
              {index < options.length - 1 && (
                <div className="absolute left-[calc(18px+28px)] right-0 bottom-0 h-px bg-border/60" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
