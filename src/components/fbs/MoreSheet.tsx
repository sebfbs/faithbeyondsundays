import { Users, Heart, User, BookOpen, HandCoins, X } from "lucide-react";
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

  const options = allOptions.filter(
    (opt) => !opt.featureKey || featureFlags[opt.featureKey]
  );

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
      <div className="relative w-full max-w-[430px] bg-card rounded-t-3xl px-5 pt-5 pb-28 animate-slide-up shadow-nav">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground">More</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center tap-active">
            <X size={14} className="text-muted-foreground" />
          </button>
        </div>
        <div className="space-y-2">
          {options.map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => handleOption(key)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-muted/50 tap-active hover:bg-muted transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: colors.accentBg }}>
                <Icon size={18} style={{ color: colors.accent }} />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
