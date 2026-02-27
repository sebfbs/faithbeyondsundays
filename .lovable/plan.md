

## Fix: iOS Keyboard Dismiss Gap on Journal Compose Screen

### Problem
When composing a personal journal entry on iOS PWA, tapping "Done" on the keyboard dismisses it but leaves a visible gap below the bottom navigation bar. The current fix (`window.scrollTo(0, 0)` with a 100ms delay) isn't sufficient for iOS's keyboard dismiss animation timing.

### Solution
Strengthen the keyboard dismiss handling in the Journal compose view with two changes:

**File: `src/components/fbs/JournalTab.tsx`**

1. **Improve `handleInputBlur`** -- fire `window.scrollTo(0, 0)` at multiple intervals (0ms, 100ms, 300ms) to catch the iOS keyboard dismiss animation at different stages. Also reset `document.documentElement.scrollTop` and `document.body.scrollTop` directly as a fallback.

2. **Improve the `visualViewport` resize listener** (lines 185-194) -- instead of only calling `window.scrollTo(0, 0)`, also force `document.body.style.height = '100%'` temporarily and reset it, which forces iOS Safari to recalculate layout and close the gap. Add a small delayed secondary scroll reset (300ms) to handle the tail end of the keyboard animation.

### Technical Detail

```typescript
const handleInputBlur = () => {
  // iOS needs multiple attempts as keyboard dismiss animates
  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 100);
  setTimeout(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, 300);
};
```

For the `visualViewport` resize listener:
```typescript
const onResize = () => {
  window.scrollTo(0, 0);
  setTimeout(() => window.scrollTo(0, 0), 150);
};
```

No other files need to change.

