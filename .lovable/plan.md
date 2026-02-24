

## Match Top Status Bar to Bottom Nav Bar Style

### Problem
The top status bar backdrop has a different color/opacity than the bottom navigation bar, making it look inconsistent and "weird."

### What Changes
**One file: `src/pages/Index.tsx` (lines 331-337)**

Update the status bar backdrop styling to match the bottom nav exactly:
- Change background from `hsl(var(--background) / 0.8)` to `hsl(var(--card) / 0.95)` (matches `bg-card/95`)
- Change blur from `blur(20px)` to `blur(12px)` (matches `backdrop-blur-md`)

That's it -- a simple CSS property swap to make top and bottom bars visually consistent, just like Instagram does.

