import { Users, Heart, User, X } from "lucide-react";

interface MoreSheetProps {
  onProfile: () => void;
  onClose: () => void;
}

const options = [
  { icon: Users, label: "Groups", key: "groups" },
  { icon: Heart, label: "Prayer", key: "prayer" },
  { icon: User, label: "Profile", key: "profile" },
];

export default function MoreSheet({ onProfile, onClose }: MoreSheetProps) {
  const handleOption = (key: string) => {
    if (key === "profile") {
      onProfile();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/15 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className="relative w-full max-w-[430px] bg-card rounded-t-3xl px-5 pt-5 pb-28 animate-slide-up shadow-nav"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-foreground">More</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center tap-active"
          >
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
              <div className="w-10 h-10 rounded-2xl bg-amber-bg flex items-center justify-center">
                <Icon size={18} className="text-amber" />
              </div>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
