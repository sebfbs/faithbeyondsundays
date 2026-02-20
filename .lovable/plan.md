

# Highlight "More" Icon When Profile is Open

## Problem
When you tap "More" and then "Profile", the bottom nav still highlights whichever tab you were on before (e.g., Home). It should highlight the "More" icon instead, since Profile is accessed through "More".

## Fix

### Index.tsx
- When the "Profile" option is selected from the MoreSheet, set `activeTab` to `"more"` so the bottom nav highlights the correct icon.
- Update the `onProfile` callback to include `setActiveTab("more")`.

### BottomNav.tsx
- No changes needed -- it already highlights based on `activeTab`, so setting it to `"more"` will light up the More icon automatically.

## Technical Detail
In `Index.tsx`, the `onProfile` handler inside the `MoreSheet` currently does:
```tsx
onProfile={() => {
  setOverlay("profile");
  setMoreOpen(false);
}}
```
It will be updated to also call `setActiveTab("more")`:
```tsx
onProfile={() => {
  setActiveTab("more");
  setOverlay("profile");
  setMoreOpen(false);
}}
```

This is a one-line addition. The same pattern should apply if Groups or Prayer screens are added later.

