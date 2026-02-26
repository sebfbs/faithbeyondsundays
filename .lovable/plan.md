

## Add Random Colors to Default Profile Avatars

### What changes
When a community member doesn't have a profile picture, their initials avatar will get a unique background color instead of the plain gray. The color will be deterministic based on their username, so the same person always gets the same color.

### Approach

**Create a small helper function** that takes a string (username) and returns a color from a curated palette of ~10 pleasant colors. It uses a simple hash of the string to pick consistently.

**Update the member list avatars** in `CommunityScreen.tsx` to use this color function instead of `hsl(var(--muted))` for members without a profile picture. The text color will be white for good contrast.

### Technical details

| File | Change |
|------|--------|
| `src/components/fbs/CommunityScreen.tsx` | Add an `avatarColor` helper with a palette array; use it for the fallback avatar `background` and set text to white |

**Color palette** (soft, friendly tones):
- Coral, Teal, Indigo, Amber, Rose, Emerald, Violet, Sky, Orange, Fuchsia

**Hash function**: Sum the char codes of the username, mod by palette length -- simple, stable, no dependencies.

The same approach can later be reused in GroupDetailSheet member list and other places showing initials avatars.
