

## Extend Time-Adaptive Accent Colors to All Components

Currently, only the Home tab shifts its accent color based on time of day. This plan extends that same logic to the bottom navigation bar, the Journal tab, and the More sheet -- so every gold/amber element in the app adapts together.

### What Changes

**Bottom Nav** -- The active tab icon and label currently use `text-amber`. They'll shift to the soft sky blue in the evening.

**More Sheet** -- The icon circles (Groups, Prayer, Profile) use `bg-amber-bg` and `text-amber`. They'll shift to cool blue tones in the evening.

**Journal Tab** -- Several amber elements will adapt:
- The floating "+" button (`bg-amber`)
- The "Save" button on compose/edit screens
- The "Cancel" text links
- The active filter badge
- Bookmark icons when filled
- The checkmark on the active filter option

### Technical Approach

1. **Extract `getAccentColors()` to a shared utility** -- Move the function from `HomeTab.tsx` into a new file `src/components/fbs/themeColors.ts` so all components can import it.

2. **Update `BottomNav.tsx`** -- Accept no new props; import `getAccentColors()` directly. Replace `text-amber` on the active icon and label with inline `style={{ color: colors.accent }}`.

3. **Update `MoreSheet.tsx`** -- Import `getAccentColors()`. Replace `bg-amber-bg` and `text-amber` on the icon containers with inline styles using `colors.accentBg` and `colors.accent`.

4. **Update `JournalTab.tsx`** -- Import `getAccentColors()`. Replace all `text-amber`, `bg-amber`, `fill-amber`, and `bg-amber-bg` references with inline styles from the colors object. This covers the FAB, save buttons, cancel links, filter badge, and bookmark fills.

5. **Clean up `HomeTab.tsx`** -- Import `getAccentColors` from the new shared file instead of defining it locally.

### Files Changed

| File | Change |
|---|---|
| `src/components/fbs/themeColors.ts` | New file -- exports `getAccentColors()` |
| `src/components/fbs/HomeTab.tsx` | Import from `themeColors.ts` instead of local definition |
| `src/components/fbs/BottomNav.tsx` | Use dynamic accent color for active tab |
| `src/components/fbs/MoreSheet.tsx` | Use dynamic accent color for icon circles |
| `src/components/fbs/JournalTab.tsx` | Use dynamic accent color for FAB, buttons, bookmarks, filters |

