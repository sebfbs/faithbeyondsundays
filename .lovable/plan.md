

# Fix: Content Overlapping with iPhone Status Bar

## The Problem

When running as a PWA in standalone mode with `black-translucent` status bar, your app's content renders underneath the iPhone's clock, signal bars, and Dynamic Island. This is because `black-translucent` removes the default status bar background and lets your content extend into that area -- which looks great for the gradient, but the text needs to be pushed down.

## The Fix

Add safe-area top padding to each screen so the content starts just below the status bar. This uses `env(safe-area-inset-top)` -- a built-in iOS value that automatically adjusts for different iPhone models (notch vs. Dynamic Island vs. no notch).

## Files to Update

### 1. HomeTab.tsx
- Change the greeting section's top padding from `pt-10` to include the safe area inset
- Use `style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" }}` so the greeting sits comfortably below the status bar

### 2. SermonTab.tsx
- Change the container's `pt-6` to include the safe area inset
- Use `style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}`

### 3. JournalTab.tsx
- Same treatment for both the list view (`pt-6`) and the detail view (`pt-5`)
- Use `style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}`

## Technical Details

The CSS function `env(safe-area-inset-top)` returns the height of the status bar/notch area on iOS devices. The `calc()` adds the original padding on top of that. On devices without a notch (or in a regular browser), the safe-area value defaults to `0px`, so the layout stays the same as before.

No other changes needed -- the bottom nav already handles `safe-area-inset-bottom` correctly.

