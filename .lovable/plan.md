

## Make the "Scan handwriting" Button Pop

The current button is too subtle -- it uses a nearly-white background with faint accent borders, making it blend into the page. Here's the plan to make it bold, vibrant, and unmissable.

### Visual Design

The button will get a **solid gradient background** using the theme's accent color (amber during the day, blue in the evening), white text, and a pronounced glow. It will feel like a glowing, magical action button rather than a ghost button.

### Changes

**File: `src/components/fbs/JournalTab.tsx`** (lines 220-263)

Replace the current ethereal button with a bolder version:

- **Background**: Solid accent-color gradient (e.g., `linear-gradient(135deg, accent, accent-lighter)`) instead of the current near-white wash
- **Text color**: White for strong contrast against the gradient
- **Glow**: Larger, more visible box-shadow using the accent color at higher opacity (e.g., `0 4px 24px accent/50`)
- **Shimmer sweep**: Always visible (not just on hover), running continuously across the gradient surface so it catches the eye
- **Sparkle decorations**: Two small `✦` characters flanking the text, with a gentle scale-pulse animation
- **Border**: Remove the faint border -- the gradient and glow provide enough definition
- **Camera icon**: Bump to size 18, white color to match text
- **Pulsing glow ring**: A soft animated ring behind the button using a pseudo-element with `animate-pulse` for a breathing radiance effect

### New CSS Animation (in `src/index.css`)

Add a `@keyframes sparkle-pulse` animation:
- Alternates between `scale(1) opacity(0.5)` and `scale(1.3) opacity(1)` over 2 seconds
- Applied to the `✦` characters so they twinkle

### Result

A vibrant, glowing pill button with a continuous shimmer and twinkling sparkles -- clearly visible and inviting to tap, while still fitting the app's spiritual/ethereal brand.
