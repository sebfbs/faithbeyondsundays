

## Focus Mode for Reflection Writing

When a user taps "Reflect" and the textarea opens, all other cards on the home page will smoothly blur out and fade, creating a calm, distraction-free writing experience. When they save or close, everything smoothly returns to normal.

### How It Works

- When `reflectionOpen` becomes `true`, every card except the Reflection card gets a CSS blur + reduced opacity with a smooth transition
- The reflection card itself stays crisp and slightly elevates (subtle scale or shadow bump) to feel "pulled forward"
- A semi-transparent overlay sits behind the reflection card but above everything else, reinforcing the focus
- Tapping outside the reflection area (on the blurred backdrop) could optionally close the reflection, but we'll keep it simple and just use the existing save flow

### Visual Effect

- Other cards: `filter: blur(6px); opacity: 0.3;` with a `transition: all 0.4s ease`
- Reflection card: `transform: scale(1.01); z-index: 10;` with a subtle glow
- Smooth 400ms transition in and out

### Technical Details

**File: `src/components/fbs/HomeTab.tsx`**

1. Wrap each card section (Spark, Reflection, Community Pulse, Quick Links) with a div that applies conditional blur/opacity styles based on the `reflectionOpen` state
2. Use inline styles with transition for the blur effect:
   - Non-reflection cards get `style={{ filter: reflectionOpen ? 'blur(6px)' : 'none', opacity: reflectionOpen ? 0.3 : 1, transition: 'filter 0.4s ease, opacity 0.4s ease', pointerEvents: reflectionOpen ? 'none' : 'auto' }}`
   - The reflection card gets `style={{ position: 'relative', zIndex: reflectionOpen ? 10 : 'auto', transition: 'transform 0.3s ease' }}`
3. This applies to both the churched and churchless reflection flows (lines ~291-345 for churchless, ~400-458 for churched)
4. No new components or files needed -- just conditional style props on existing card wrappers

