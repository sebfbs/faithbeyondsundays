

## Update Tour Card 1: Copy + Animated Logo

### 1. Update the copy (tour1)

Replace the current description:
> "Your pastor poured everything into that message. Now you can revisit it anytime -- watch the sermon, unpack the key takeaways, and let it shape your whole week, not just your Sunday."

With something like:
> "Revisit Sunday's message anytime -- watch the sermon, unpack the key takeaways, and let it shape your whole week, not just your Sunday."

This removes the pastor-centric opening while keeping the rest of the copy intact.

### 2. Animated logo draw-on effect

Replace the current Play icon inside the amber gradient box with a custom SVG animation of the Faith Beyond Sundays logo (the four-petal/figure-eight cross shape). The animation will use the SVG `stroke-dasharray` and `stroke-dashoffset` technique to simulate a "drawing" effect:

- The logo will be represented as an SVG path tracing four loops (right, left, top, bottom) from the center point
- Using CSS `@keyframes`, the stroke will animate from fully hidden (`dashoffset` equal to path length) to fully visible (`dashoffset: 0`), creating the illusion of someone drawing the figure-eight cross
- The animation will run once on mount, taking approximately 2-3 seconds total
- After the stroke animation completes, a subtle fill fade-in will apply the gradient colors (blue-to-amber, matching the logo)
- The icon container will keep its current rounded-3xl shape and shadow but the gradient background will be removed (replaced with a subtle neutral background or transparent) so the animated logo stands on its own

### Technical approach

**New component**: `src/components/fbs/AnimatedLogo.tsx`
- A self-contained SVG component with the four-petal path
- CSS keyframes defined inline or via Tailwind for the draw-on animation
- Props for `size` and optional `className`

**Modified file**: `src/components/fbs/OnboardingScreen.tsx`
- Import `AnimatedLogo`
- Tour1 card: replace `icon={<Play ... />}` with `icon={<AnimatedLogo />}` and update `iconGradient` to a neutral/transparent background
- Update description text
- Modify the TourCard icon container for tour1 to not clip or constrain the animated logo (remove the fixed box if needed, or keep it but ensure the SVG is visible)

