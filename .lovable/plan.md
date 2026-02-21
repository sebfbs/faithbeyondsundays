

## Remove Pill Background — Text-Only Labels

### What Changes

The "Today's Spark" and "Today's Reflection" labels will lose their rounded pill background entirely. They become quiet, muted uppercase text that gently labels each card without drawing attention.

### Visual Result

- No background fill or border
- Small uppercase text in a soft, muted color (blends with the card without competing for attention)
- The icon circle next to the label stays as-is for visual anchoring

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**

Update both pill `<span>` elements. Remove the `rounded-full` class and inline background style, and use a muted text color instead.

From:
```tsx
<span
  className="text-[0.7rem] font-medium px-2.5 py-0.5 rounded-full uppercase tracking-wider"
  style={{ background: colors.pillBgSoft, color: colors.pillTextSoft }}
>
```

To:
```tsx
<span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
```

This applies to both the "Today's Spark" and "Today's Reflection" labels. No other files affected.
