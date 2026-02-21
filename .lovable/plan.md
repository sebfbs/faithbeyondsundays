

## Semi-Transparent Home Screen Cards

Make the three main cards on the Home tab (Today's Spark, Weekly Challenge, and Guided Reflection) semi-transparent with a frosted-glass effect, so the sky gradient background subtly shows through.

### What Changes

**`src/components/fbs/HomeTab.tsx`**
- Replace the solid `bg-card` background on the three card containers with a semi-transparent white background and backdrop blur
- Apply to:
  1. Today's Spark card
  2. Weekly Challenge card
  3. Guided Reflection button
- Style: `background: hsl(0 0% 100% / 0.8)` with `backdrop-filter: blur(20px)` — matching the frosted-glass intensity used for the status bar backdrop
- The Streak banner already has a custom gradient background so it stays as-is

### Technical Detail

Each card currently uses the Tailwind class `bg-card`. This will be replaced with inline styles:
```
background: hsl(0 0% 100% / 0.8)
backdrop-filter: blur(20px)
-webkit-backdrop-filter: blur(20px)
```

The `shadow-card` class remains for depth. The result is cards that feel like frosted glass floating over the sky gradient.

