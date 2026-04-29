import { useEffect, useState } from "react";
import { X, Medal } from "lucide-react";

export interface BadgeDisplay {
  label: string;
  detail: string;
  color?: string;
  gradient?: string;
}

interface AchievementBannerProps {
  badge: BadgeDisplay;
  onDismiss: () => void;
}

export default function AchievementBanner({ badge, onDismiss }: AchievementBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in on next frame
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 400);
    }, 4000);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(timer);
    };
  }, [onDismiss]);

  const backgroundStyle = badge.gradient
    ? { background: badge.gradient }
    : { background: badge.color };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: "env(safe-area-inset-top, 0px)",
        transform: visible ? "translateY(0)" : "translateY(-110%)",
        transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          margin: "12px 16px",
          borderRadius: "20px",
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          ...backgroundStyle,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Medal size={22} color="white" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 2 }}>
            Badge Earned
          </p>
          <p style={{ color: "white", fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>
            {badge.label}
          </p>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "13px" }}>
            {badge.detail}
          </p>
        </div>

        <button
          onClick={() => { setVisible(false); setTimeout(onDismiss, 400); }}
          style={{
            flexShrink: 0,
            padding: 6,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={16} color="white" />
        </button>
      </div>
    </div>
  );
}
