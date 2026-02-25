

## Fix Animated Logo to Match the Real FBS Logo

### Problem
The current `AnimatedLogo.tsx` creates thin-stroked, filled bezier petals that look nothing like your actual logo. Your logo has four **thick, hollow teardrop loops** arranged in a clover/cross pattern with an **X-shaped crossing** at the center, and a smooth vertical gradient from cornflower blue (top) to amber/gold (bottom).

### What the real logo looks like (from your image)
- Four large, rounded teardrop loops -- top, bottom, left, right
- Each loop is a **thick band** (not a thin outline, not a filled shape) -- the inside of each loop is transparent/white
- The loops **cross over each other** at the center, forming an X where the bands overlap
- A vertical gradient flows from soft blue at the top through a warm neutral in the middle to rich amber/gold at the bottom
- The overall shape resembles a four-leaf clover made of thick rounded bands

### Solution -- Complete rewrite of `AnimatedLogo.tsx`

**Path geometry**: Each of the four loops will be drawn as a single closed bezier path forming a teardrop/balloon shape. Key differences from current code:
- Much larger loops (extending ~35 units from center in a 100x100 viewBox)
- `fill="none"` with `stroke-width` of ~10-12 to create the thick hollow band look
- Rounded teardrop shapes that pinch at the center and balloon outward
- The paths will naturally overlap at the center, creating the X-crossing effect

**Gradient**: Change to a vertical gradient (`x1="50%" y1="0%" x2="50%" y2="100%"`) with:
- Top: `#89B4D8` (soft cornflower blue)
- Middle: `#D4B896` (warm neutral transition)
- Bottom: `#F0A500` (amber gold)

**Stroke style**: `stroke-linecap="round"` and `stroke-linejoin="round"` for the smooth, soft appearance matching the logo.

**Animation**: Keep the sequential draw-on effect (stroke-dasharray/dashoffset), but remove the fill-opacity animation since the loops are hollow (`fill="none"`). Each loop draws from center outward and back: right, left, top, bottom.

### File changed
- `src/components/fbs/AnimatedLogo.tsx` -- full rewrite of SVG paths, gradient, and stroke styling. No other files need changes.
