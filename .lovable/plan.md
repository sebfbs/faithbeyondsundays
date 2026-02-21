

## Dynamic Sky Background Based on Time of Day

The homepage already uses `getGreeting()` to determine morning/afternoon/evening. We'll create a companion function that returns a different gradient palette for each time period, giving the background a natural sky feel that shifts throughout the day.

### Three Sky Palettes

**Morning (before 12pm)** -- Soft sunrise tones: light blue sky fading into warm peach and golden amber at the bottom (the current gradient, which already feels like morning).

**Afternoon (12pm - 5pm)** -- Bright midday sky: a clear, vivid blue at the top transitioning through a lighter blue into a soft warm white/cream at the bottom.

**Evening (after 5pm)** -- Inspired by the reference image you shared: deep navy/dark blue at the top, transitioning through a medium blue into warm amber/orange tones at the horizon.

### Technical Details

- Add a `getSkyGradient()` function in `HomeTab.tsx` that checks the hour (same logic as `getGreeting()`) and returns the appropriate CSS gradient string.
- Replace the current hardcoded `background` style on the root `div` with the result of `getSkyGradient()`.
- The "This Week" section header and greeting text already use white, which will remain readable across all three palettes.
- No new dependencies or files needed -- just updating the existing gradient in `HomeTab.tsx`.

