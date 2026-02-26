const AVATAR_PALETTE = [
  "#E97373", // Coral
  "#4DB6AC", // Teal
  "#7986CB", // Indigo
  "#FFB74D", // Amber
  "#F06292", // Rose
  "#66BB6A", // Emerald
  "#AB47BC", // Violet
  "#42A5F5", // Sky
  "#FF8A65", // Orange
  "#BA68C8", // Fuchsia
];

export function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
