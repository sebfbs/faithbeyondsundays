import { useState } from "react";
import { ChevronDown, Lock, X } from "lucide-react";

export interface BadgeItem {
  label: string;
  detail: string;
  howToEarn?: string;
  color?: string;
  gradient?: string;
  animated?: boolean;
  icon: React.ReactNode;
}

interface BadgeStackGroupProps {
  label: string;
  earned: BadgeItem[];
  locked: BadgeItem[];
  isOwn: boolean;
}

const CARD_H = 72;
const PEEK = 10;
const EXPANDED_STEP = 56;

function LockedBadgeCard({ badge }: { badge: BadgeItem }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <>
      <div
        onClick={() => badge.howToEarn && setShowTooltip(true)}
        style={{
          borderRadius: 20,
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: "hsl(var(--muted))",
          cursor: badge.howToEarn ? "pointer" : undefined,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: 0.4,
          }}
        >
          {badge.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: "hsl(var(--muted-foreground))", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
            {badge.label}
          </p>
          <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, opacity: 0.7 }}>{badge.detail}</p>
        </div>
        <Lock size={17} color="hsl(var(--muted-foreground))" style={{ flexShrink: 0, opacity: 0.5 }} />
      </div>

      {showTooltip && badge.howToEarn && (
        <div
          onClick={() => setShowTooltip(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9000,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "hsl(var(--card))",
              borderRadius: 24,
              padding: "24px 20px",
              width: "100%",
              maxWidth: 320,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 16px 48px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowTooltip(false)}
                style={{
                  background: "hsl(var(--muted))",
                  border: "none",
                  borderRadius: "50%",
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={14} color="hsl(var(--muted-foreground))" />
              </button>
            </div>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "hsl(var(--muted))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.5,
              }}
            >
              {badge.icon}
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ color: "hsl(var(--foreground))", fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
                {badge.label}
              </p>
              <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 13, marginBottom: 16 }}>
                {badge.detail}
              </p>
              <div
                style={{
                  background: "hsl(var(--muted))",
                  borderRadius: 12,
                  padding: "10px 14px",
                }}
              >
                <p style={{ color: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  How to earn
                </p>
                <p style={{ color: "hsl(var(--foreground))", fontSize: 14 }}>
                  {badge.howToEarn}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BadgeCard({ badge }: { badge: BadgeItem }) {
  const bgStyle = badge.gradient
    ? {
        background: badge.gradient,
        backgroundSize: badge.animated ? "350% 350%" : "200% 200%",
        animation: badge.animated ? "aurora-shift 6s ease-in-out infinite" : undefined,
      }
    : { background: badge.color };

  return (
    <div
      style={{
        borderRadius: 20,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        ...bgStyle,
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
        {badge.icon}
      </div>
      <div>
        <p style={{ color: "white", fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>
          {badge.label}
        </p>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{badge.detail}</p>
      </div>
    </div>
  );
}

export default function BadgeStackGroup({ label, earned, locked, isOwn }: BadgeStackGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const hasEarned = earned.length > 0;
  const showLocked = isOwn && locked.length > 0;

  if (!hasEarned && !showLocked) return null;

  const peekCount = Math.min(earned.length - 1, 2);
  const collapsedH = hasEarned ? CARD_H + peekCount * PEEK : CARD_H;
  const expandedH = (earned.length - 1) * EXPANDED_STEP + CARD_H;
  const containerH = expanded ? expandedH : collapsedH;

  return (
    <div style={{ marginBottom: 24 }}>
      <p
        className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
        style={{ marginBottom: 10 }}
      >
        {label}
        {hasEarned && (
          <span className="ml-2 font-normal normal-case" style={{ color: "rgba(255,255,255,0.25)" }}>
            {earned.length} earned
          </span>
        )}
      </p>

      {hasEarned ? (
        <div
          onClick={() => setExpanded(!expanded)}
          style={{
            position: "relative",
            height: containerH,
            transition: "height 0.45s cubic-bezier(0.16,1,0.3,1)",
            cursor: "pointer",
          }}
        >
          {earned.map((badge, i) => {
            const translateY = expanded ? i * EXPANDED_STEP : Math.min(i, 2) * PEEK;
            const scale = expanded ? 1 : Math.max(0.94, 1 - i * 0.03);
            return (
              <div
                key={badge.label}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1)",
                  zIndex: earned.length - i,
                  transformOrigin: "top center",
                }}
              >
                <BadgeCard badge={badge} />
                {i === 0 && !expanded && earned.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600 }}>
                      +{earned.length - 1}
                    </span>
                    <ChevronDown size={13} color="rgba(255,255,255,0.7)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Fully locked group (own profile only, no earned badges in this group)
        <LockedBadgeCard badge={locked[0]} />
      )}

      {/* Next locked badge below earned stack */}
      {showLocked && hasEarned && (
        <div style={{ marginTop: 10 }}>
          <LockedBadgeCard badge={locked[0]} />
        </div>
      )}
    </div>
  );
}
