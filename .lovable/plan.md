

## Fix: Sticky Status Bar Backdrop

### The Problem
When you scroll down, your app content slides up behind the iPhone's clock, battery, and signal icons in the status bar area, making everything overlap and become unreadable.

### The Solution
Add a fixed, frosted-glass bar at the very top of the screen that covers the iPhone status bar zone. As you scroll, content will disappear behind this semi-transparent bar instead of mixing with the system icons. This is the same approach Apple's own apps use.

---

### What Changes

**`src/pages/Index.tsx`**
- Add a fixed overlay `div` at the top of the app container that covers the safe area inset
- It will use a backdrop blur effect (frosted glass) with the app's background color at ~80% opacity
- Sits at `z-index: 40` so it's above scrollable content but below modals
- Height is exactly `env(safe-area-inset-top)` so it only appears on devices with a notch/Dynamic Island

This is a single small element added once in the main layout — it automatically protects every screen (Home, Bible, Sermon, Journal, all overlays) without needing to change each individual screen.

### Technical Details

The backdrop element:
```
position: fixed
top: 0
left/right: 0
height: env(safe-area-inset-top, 0px)
backdrop-filter: blur(20px)
background: hsl(var(--background) / 0.8)
z-index: 40
```

This ensures:
- On iPhones with a notch: a frosted bar covers the status bar area
- On devices without a notch: the element has zero height and is invisible
- Works across all screens automatically

