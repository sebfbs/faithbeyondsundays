
## Update Default Avatar Colors to Brand Palette

### What Changes

**File: `src/components/fbs/avatarColors.ts`**

Replace the current 10-color palette with the 4 on-brand muted colors:

```typescript
const AVATAR_PALETTE = [
  "#C9A66B", // Soft Gold
  "#89B4D8", // Sky Blue
  "#CDA08A", // Dusty Peach
  "#9BAEC8", // Muted Lavender
];
```

The `getAvatarColor` function stays the same -- it already hashes the name and picks from the palette via modulo, so reducing to 4 entries works automatically.

No other files need to change.
