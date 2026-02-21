

## Add Confetti Animation on Challenge Completion

When a user taps "Mark as Complete" on the weekly challenge, a burst of confetti will rain down from the top of the screen, then fade away after a couple of seconds.

### Approach

We'll use the lightweight `canvas-confetti` library -- it's tiny (~6KB), has zero dependencies, and fires confetti from an off-screen canvas that cleans itself up automatically. No extra components or state management needed.

### Steps

1. **Install `canvas-confetti`** -- add the npm package to the project.

2. **Update `HomeTab.tsx`** -- when the user clicks "Mark as Complete" and the challenge stage transitions to `"completed"`, fire a confetti burst from the top-center of the screen. The confetti will fall naturally with gravity and disappear on its own after ~2-3 seconds. No cleanup code is needed since `canvas-confetti` handles that internally.

### Technical Details

- Import `confetti` from `canvas-confetti`
- In the "Mark as Complete" button's `onClick`, call `confetti()` with settings like `origin: { x: 0.5, y: 0 }` (top-center), `particleCount: 120`, `spread: 80`, `startVelocity: 45`, and `gravity: 0.8` so it rains downward naturally
- The confetti canvas is created and destroyed automatically -- no DOM cleanup required
- This adds no visible UI elements; it's purely a momentary visual effect

