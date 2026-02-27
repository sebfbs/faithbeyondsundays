const AVATAR_PALETTE = [
  "#C9A66B", // Soft Gold
  "#89B4D8", // Sky Blue
  "#CDA08A", // Dusty Peach
  "#9BAEC8", // Muted Lavender
];

export function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
