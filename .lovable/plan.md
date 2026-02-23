
# Remove Unused Settings Icon from Profile Page

## Summary
The settings gear icon in the top-right corner of the Profile page has no functionality (no click handler) and serves no purpose since all editable settings -- avatar, social info, appearance, notifications, and sign out -- are already available directly on the profile page.

## Change
**File: `src/components/fbs/ProfileScreen.tsx`**

Remove the settings button element (lines 134-136):
```tsx
// DELETE this block:
<button className="w-9 h-9 rounded-full bg-card shadow-card flex items-center justify-center tap-active">
  <Settings size={17} className="text-muted-foreground" />
</button>
```

Also clean up the unused `Settings` import from lucide-react on line 2.

That's it -- one small cleanup, no other files affected.
