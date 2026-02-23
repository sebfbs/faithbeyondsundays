

# Fix Low-Contrast Text on Welcome Screen

## Problem
On the welcome screen's bottom section, the gradient transitions to a light peach/cream color, making the white "or" text and "Already have an account? Sign In" text nearly invisible.

## Changes

**File: `src/components/fbs/AuthScreen.tsx`**

Two text elements need darker colors on the welcome screen:

1. **"or" divider** (around line 96): Change `text-white/70` to `text-gray-600` and the divider lines from `bg-white/30` to `bg-gray-400/40`
2. **"Already have an account? Sign In"** (around line 106): Change `text-white/90` to `text-gray-600` so it's readable against the light background

These changes only affect the welcome screen -- the sign-in/sign-up form screen (which has a dark background) was already fixed in the previous edit.
