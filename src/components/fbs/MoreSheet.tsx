import { Users, Heart, User, BookOpen, HandCoins, X, Lock, ChevronRight } from "lucide-react";
import { getAccentColors } from "./themeColors";
import type { FeatureFlags } from "@/hooks/useFeatureFlags";

interface MoreSheetProps {
  featureFlags: FeatureFlags;
  onProfile: () => void;
  onCommunity: () => void;
  onBible: () => void;
  onPrayer: () => void;
  onClose: () => void;
  givingUrl?: string;
}

export default function MoreSheet({ featureFlags, onProfile, onCommunity, onBible, onPrayer, onClose, givingUrl }: MoreSheetProps) {
  const colors = getAccentColors();

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
    else if (key === "give" && givingUrl) window.open(givingUrl, "_blank");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/15 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-2xl px-5 pt-5 pb-28 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">More</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center tap-active">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
        {/* iOS grouped inset list */}
        <div className="bg-card rounded-2xl overflow-hidden" style={{ border: "0.5px solid hsl(var(--border))" }}>
          {options.map(({ icon: Icon, label, key, featureKey }, index) => {
            const locked = featureKey ? !featureFlags[featureKey] : false;
            return (
              <button
                key={key}
                onClick={() => !locked && handleOption(key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left tap-active transition-colors ${locked ? "opacity-50 cursor-not-allowed" : "active:bg-muted/60"} ${index > 0 ? "" : ""}`}
                style={index > 0 ? { borderTop: "0.5px solid hsl(var(--border))" } : undefined}
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
