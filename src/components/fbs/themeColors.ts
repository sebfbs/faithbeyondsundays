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
    accent: "hsl(38, 100%, 47%)",
    accentBg: isDark ? "hsl(38, 65%, 16%)" : "hsl(38, 80%, 96%)",
    accentFg: "hsl(0, 0%, 100%)",
    pillBg: "hsl(38, 100%, 47%)",
    pillText: "hsl(0, 0%, 100%)",
    pillBgSoft: isDark ? "hsl(38, 55%, 20%)" : "hsl(38, 80%, 90%)",
    pillTextSoft: isDark ? "hsl(38, 100%, 65%)" : "hsl(38, 80%, 35%)",
    buttonBg: "hsl(38, 100%, 47%)",
    buttonShadow: "0 4px 16px -2px hsl(38 100% 47% / 0.35)",
    statusBg: isDark ? "hsl(38, 65%, 16%)" : "hsl(38, 80%, 96%)",
    statusText: isDark ? "hsl(38, 100%, 60%)" : "hsl(38, 100%, 47%)",
    streakGradient: isDark
      ? "linear-gradient(135deg, hsl(38 65% 16%) 0%, hsl(38 55% 20%) 100%)"
      : "linear-gradient(135deg, hsl(38 100% 95%) 0%, hsl(38 80% 90%) 100%)",
    streakBorder: isDark ? "1.5px solid hsl(38 65% 26%)" : "1.5px solid hsl(38 100% 85%)",
    streakIconBg: "hsl(38, 100%, 47%)",
    fillClass: "fill-[hsl(38,100%,47%)]",
  };
}

export function useAccentColors() {
  const { resolvedTheme } = useTheme();
  return getAccentColors(resolvedTheme === "dark");
}
