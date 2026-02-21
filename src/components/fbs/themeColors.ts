export function getAccentColors() {
  const hour = new Date().getHours();
  if (hour >= 17) {
    // Evening: soft sky blue / lavender
    return {
      accent: "hsl(215, 65%, 65%)",
      accentBg: "hsl(215, 60%, 94%)",
      accentFg: "hsl(0, 0%, 100%)",
      pillBg: "hsl(215, 65%, 65%)",
      pillText: "hsl(0, 0%, 100%)",
      buttonBg: "hsl(215, 65%, 65%)",
      buttonShadow: "0 4px 16px -2px hsl(215 65% 65% / 0.35)",
      statusBg: "hsl(215, 60%, 94%)",
      statusText: "hsl(215, 65%, 65%)",
      streakGradient: "linear-gradient(135deg, hsl(215 60% 95%) 0%, hsl(220 50% 90%) 100%)",
      streakBorder: "1.5px solid hsl(215 60% 85%)",
      streakIconBg: "hsl(215, 65%, 65%)",
      fillClass: "fill-[hsl(215,65%,65%)]",
    };
  }
  // Morning / Afternoon: golden amber (current)
  return {
    accent: "hsl(38, 100%, 47%)",
    accentBg: "hsl(38, 80%, 96%)",
    accentFg: "hsl(0, 0%, 100%)",
    pillBg: "hsl(38, 100%, 47%)",
    pillText: "hsl(0, 0%, 100%)",
    buttonBg: "hsl(38, 100%, 47%)",
    buttonShadow: "0 4px 16px -2px hsl(38 100% 47% / 0.35)",
    statusBg: "hsl(38, 80%, 96%)",
    statusText: "hsl(38, 100%, 47%)",
    streakGradient: "linear-gradient(135deg, hsl(38 100% 95%) 0%, hsl(38 80% 90%) 100%)",
    streakBorder: "1.5px solid hsl(38 100% 85%)",
    streakIconBg: "hsl(38, 100%, 47%)",
    fillClass: "fill-[hsl(38,100%,47%)]",
  };
}
