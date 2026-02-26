

## Apply Colorful Initials Avatars Everywhere

Use the existing `getAvatarColor()` helper from `avatarColors.ts` across every remaining screen that shows a fallback initials avatar. This gives all users without a profile picture a consistent, colorful circle instead of plain gray.

### Files to update

| File | Where | Current | Change |
|------|-------|---------|--------|
| `CommunityPulse.tsx` | Active avatars on home screen | Gray `hsl(var(--muted))` background, gray text | Use `getAvatarColor(a.first_name)` background, white text |
| `GroupChat.tsx` | Chat message avatars | Gray `bg-muted` background, gray text | Use `getAvatarColor(name)` background, white text |
| `ChurchlessCommunity.tsx` | Member search results | Gray background, gray text | Use `getAvatarColor(member.username)` background, white text |
| `FollowListSheet.tsx` | Follower/following list | Gray background, gray text | Use `getAvatarColor(u.username)` background, white text |
| `PublicProfileScreen.tsx` | Large profile avatar | Uses `colors.accentBg` with accent-colored text | Use `getAvatarColor(member.username)` background, white text |
| `AdminMembers.tsx` | Admin dashboard member list | Gray `bg-secondary` with foreground text | Use `getAvatarColor(member.displayName)` background, white text |

### Not changing
- **ProfileScreen.tsx** (own profile) -- uses a `User` icon (not initials) for the fallback, which is a different pattern. This stays as-is since it's the user's own editable profile with the camera upload button.
- **CommunityScreen.tsx** and **GroupDetailSheet.tsx** -- already updated in the previous change.

### Technical approach
- Import `getAvatarColor` from `./avatarColors` (or relative path for admin pages)
- Replace static gray backgrounds with `getAvatarColor(name)` when no avatar image exists
- Change fallback text color from `text-muted-foreground` to `text-white` for contrast
- Each file gets ~3-5 lines changed

