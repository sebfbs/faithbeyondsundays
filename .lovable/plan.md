

## Soften the "Today's Spark" and "Today's Reflection" Pill Badges

### What Changes

The bold, fully-colored pill badges on the Home tab cards will be replaced with a softer, muted style that feels calm and blends naturally with the frosted-glass cards.

### Current vs New Style

| Property | Current (Loud) | New (Soothing) |
|----------|---------------|----------------|
| Background | Full accent color (amber/blue) | Soft tinted background (`colors.accentBg`) |
| Text color | White | Muted accent (`colors.accent` at reduced opacity) |
| Font weight | `font-semibold` | `font-medium` |
| Overall feel | Badge demanding attention | Subtle label that guides the eye |

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**

Update both pill `<span>` elements (Today's Spark and Today's Reflection) from:

```tsx
style={{ background: colors.pillBg, color: colors.pillText }}
```

to:

```tsx
style={{ background: colors.accentBg, color: colors.accent }}
```

And change `font-semibold` to `font-medium` in their className.

Two small inline style changes, no other files affected.

