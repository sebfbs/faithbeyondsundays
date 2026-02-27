const AVATAR_PALETTE = [
  "#E8B84B", // Warm Gold
  "#5BA8E0", // Bright Sky Blue
  "#E8926A", // Warm Peach
  "#7B9FD4", // Periwinkle
];

export function getAvatarColor(name: string): string {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
