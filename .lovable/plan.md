

## Medium-Tone Fill for Pill Badges

### What Changes

The pill badges will get a warmer, more visible tinted background that sits between the original bold style and the current too-faint style. Readable but not attention-grabbing.

### New Style

| Time of Day | Background | Text |
|-------------|-----------|------|
| Morning/Afternoon | Warm peachy-amber: `hsl(38, 80%, 90%)` | Deep amber: `hsl(38, 80%, 35%)` |
| Evening | Soft steel-blue: `hsl(215, 50%, 88%)` | Deep blue: `hsl(215, 55%, 40%)` |

This gives enough contrast to be easily readable while still feeling calm and integrated with the frosted-glass cards.

### Technical Details

**File: `src/components/fbs/themeColors.ts`**

Add two new color tokens to each time-of-day branch:

- Morning/Afternoon:
  - `pillBgSoft: "hsl(38, 80%, 90%)"`
  - `pillTextSoft: "hsl(38, 80%, 35%)"`

- Evening:
  - `pillBgSoft: "hsl(215, 50%, 88%)"`
  - `pillTextSoft: "hsl(215, 55%, 40%)"`

**File: `src/components/fbs/HomeTab.tsx`**

Update both pill `<span>` elements from:
```tsx
style={{ background: colors.accentBg, color: colors.accent }}
```
to:
```tsx
style={{ background: colors.pillBgSoft, color: colors.pillTextSoft }}
```

No other files affected. Font weight stays at `font-medium`.

