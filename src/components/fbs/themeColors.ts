import { useTheme } from "next-themes";

export function getAccentColors(isDark = false) {
  const hour = new Date().getHours();
  if (hour >= 17 || hour < 5) {
    return {
      accent: "hsl(215, 65%, 65%)",
      accentBg: isDark ? "hsl(215, 45%, 18%)" : "hsl(215, 60%, 94%)",
      accentFg: "hsl(0, 0%, 100%)",
      pillBg: "hsl(215, 65%, 65%)",
      pillText: "hsl(0, 0%, 100%)",
      pillBgSoft: isDark ? "hsl(215, 40%, 22%)" : "hsl(215, 50%, 88%)",
      pillTextSoft: isDark ? "hsl(215, 65%, 70%)" : "hsl(215, 55%, 40%)",
      buttonBg: "hsl(215, 65%, 65%)",
      buttonShadow: "0 4px 16px -2px hsl(215 65% 65% / 0.35)",
      statusBg: isDark ? "hsl(215, 45%, 18%)" : "hsl(215, 60%, 94%)",
      statusText: isDark ? "hsl(215, 65%, 70%)" : "hsl(215, 65%, 65%)",
      streakGradient: isDark
        ? "linear-gradient(135deg, hsl(215 45% 18%) 0%, hsl(215 40% 22%) 100%)"
        : "linear-gradient(135deg, hsl(215 60% 95%) 0%, hsl(220 50% 90%) 100%)",
      streakBorder: isDark ? "1.5px solid hsl(215 45% 28%)" : "1.5px solid hsl(215 60% 85%)",
      streakIconBg: "hsl(215, 65%, 65%)",
      fillClass: "fill-[hsl(215,65%,65%)]",
    };
  }
  return {
    accent: "hsl(43, 78%, 61%)",
    accentBg: isDark ? "hsl(43, 55%, 16%)" : "hsl(43, 60%, 96%)",
    accentFg: "hsl(0, 0%, 100%)",
    pillBg: "hsl(43, 78%, 61%)",
    pillText: "hsl(0, 0%, 100%)",
    pillBgSoft: isDark ? "hsl(43, 45%, 20%)" : "hsl(43, 70%, 90%)",
    pillTextSoft: isDark ? "hsl(43, 78%, 70%)" : "hsl(43, 70%, 30%)",
    buttonBg: "hsl(43, 78%, 61%)",
    buttonShadow: "0 4px 16px -2px hsl(43 78% 61% / 0.35)",
    statusBg: isDark ? "hsl(43, 55%, 16%)" : "hsl(43, 60%, 96%)",
    statusText: isDark ? "hsl(43, 78%, 70%)" : "hsl(43, 78%, 45%)",
    streakGradient: isDark
      ? "linear-gradient(135deg, hsl(43 55% 16%) 0%, hsl(43 45% 20%) 100%)"
      : "linear-gradient(135deg, hsl(43 60% 95%) 0%, hsl(43 60% 90%) 100%)",
    streakBorder: isDark ? "1.5px solid hsl(43 55% 26%)" : "1.5px solid hsl(43 78% 82%)",
    streakIconBg: "hsl(43, 78%, 61%)",
    fillClass: "fill-[hsl(43,78%,61%)]",
  };
}

export function useAccentColors() {
  const { resolvedTheme } = useTheme();
  return getAccentColors(resolvedTheme === "dark");
}
