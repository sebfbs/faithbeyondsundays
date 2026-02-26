
## Update Invite Flow and Community Builder Badge

### 1. Update invite button and share text (CommunityScreen.tsx)

- **Share message** (line 182): Remove church code reference. Change to:
  `"Join me on Faith Beyond Sundays! Download the app and start growing in your faith."`
- **Button subtitle** (line 245): Change from `"Share your church code & earn a badge"` to `"Invite a friend & earn a badge"`

### 2. Make the "Community Builder" badge visually special

The badge currently uses a flat color (`hsl(170, 55%, 45%)`). To make it enticing and stand out like the higher-tier reflection badges, it will get:

- An **animated gradient background** (teal-to-emerald shifting gradient) instead of a flat color
- The same `animate-gradient-rotate` animation used by the top-tier reflection badges
- White icon color on the gradient background for contrast

This change applies in three places:
- **`ProfileScreen.tsx`** (line 47) -- own profile badge
- **`PublicProfileScreen.tsx`** (line 86) -- public profile badge
- The badge label stays "Community Builder" and detail stays "Invited a friend"

### Technical details

**Files changed:**

| File | Change |
|------|--------|
| `src/components/fbs/CommunityScreen.tsx` | Update share text (line 182) and button subtitle (line 245) |
| `src/components/fbs/ProfileScreen.tsx` | Replace flat color with animated gradient on Community Builder badge (line 47) |
| `src/components/fbs/PublicProfileScreen.tsx` | Same gradient treatment on Community Builder badge (line 86) |

**Badge styling change (all three locations):**
```typescript
// Before
{ icon: HeartHandshake, label: "Community Builder", detail: "Invited a friend", color: "hsl(170, 55%, 45%)" }

// After
{
  icon: HeartHandshake,
  label: "Community Builder",
  detail: "Invited a friend",
  gradient: "linear-gradient(135deg, hsl(170, 70%, 45%), hsl(145, 65%, 50%), hsl(170, 70%, 45%))",
  animated: true,
}
```

This gives the Community Builder badge the same premium animated gradient look as the top-tier reflection milestones, making it feel special and worth earning.
