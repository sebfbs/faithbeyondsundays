

# Styled Church Code Input

## What This Does
Makes the church code input field feel more like entering a special access code by forcing uppercase text and using a monospace (code-style) font.

## Changes

### Modified: `src/components/fbs/WelcomeScreen.tsx`
- Add `uppercase` and `font-mono tracking-widest` classes to the church code input field
- This will automatically display typed text in uppercase with a cool code-style monospace font and wider letter spacing
- The actual value processing (lowercasing for lookup) stays unchanged since `lookupChurch` already normalizes to lowercase

