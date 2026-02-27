

## Fix iOS Safe Area Top Color to Match Background

### The Problem

The fixed overlay that covers the iOS status bar / safe area uses `--card` color (pure white), while the page backgrounds use `--background` (warm bone tone at `hsl(40, 30%, 97%)`). This creates a visible color mismatch at the top of every screen.

### The Fix

**File: `src/pages/Index.tsx` (line 356)**

Change the safe area overlay background from `--card` to `--background`:

```
Before: background: hsl(var(--card) / 0.95 * ratio)
After:  background: hsl(var(--background) / 0.95 * ratio)
```

One exception: the Home tab uses a sky gradient background instead of `--background`. For that case, we will use a transparent-to-gradient top bar so it blends naturally. We can handle this by conditionally picking the color based on the active tab -- using the sky gradient's top color when on the Home tab, and `--background` for all other screens.

### Technical Details

- Single line change in `src/pages/Index.tsx` at line 356
- For the Home tab (which uses a dynamic sky gradient), the overlay will use the gradient's top color so it still blends seamlessly
- No changes needed to individual page components -- the fix is centralized in the one overlay element
