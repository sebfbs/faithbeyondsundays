

## Add Checkmark to Selected Church Card

A small `Check` icon will be added to the right side of the selected church card to clearly indicate the selection.

### Change

**File: `src/components/fbs/OnboardingScreen.tsx`** (lines 373-386)

Update the church button to show a small checkmark circle on the right when selected:

- Add `flex items-center` to the button so the checkmark aligns to the right
- Wrap the existing text content in a `div` with `flex-1`
- Add a `CheckCircle` icon (already imported) on the right, only visible when selected
- Keep the existing `ring-2 ring-amber` styling

The button interior will go from just text to: `[text content] [checkmark if selected]` in a flex row.

