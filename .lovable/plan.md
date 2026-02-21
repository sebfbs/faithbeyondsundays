

## Community Connection Feature

This plan adds a meaningful way for congregation members to connect with each other -- not as another social media feed, but as a directory of fellow believers they can discover, follow, and encourage.

### Core Philosophy

The social layer is about **deepening bonds within and across congregations**, not creating another content feed. There are no posts, no likes, no comments. Instead, users can:

- Discover fellow members through their church's directory
- Follow people they want to stay connected with
- View each other's faith journey (badges, church, member since)
- Share profile photos so faces match names on Sunday morning

### What Gets Built

**1. Usernames (added to onboarding + profile)**
- A new "Choose a username" step during account creation (Step 3, after church code)
- 3-20 characters, lowercase alphanumeric + underscores only
- Displayed as `@username` on profiles
- Editable from Profile screen

**2. Profile Photos**
- Tap the avatar circle on your profile to pick a photo (stored as base64 in localStorage for now, Supabase storage later)
- Photos appear on your profile, in search results, and in follower lists

**3. Church Directory / Community Screen**
- New "Community" tab accessible from the More sheet (replaces the placeholder "Groups" option)
- When a user joins with a church code, they auto-follow their church account
- The Community screen shows:
  - **Your Church** section at the top with the church name and follower count
  - **Church Members** list -- all users who signed up with the same church code
  - **Search bar** to find any user by name or @username (across all churches)
  - Each user card shows: photo, name, @username, church name, badge count

**4. Follow System**
- One-way follow model (like Instagram, not mutual friend requests)
- Keeps it simple -- no pending requests, no awkward rejections
- Tap "Follow" on any profile to add them; tap "Following" to unfollow
- Your profile shows follower/following counts

**5. Viewing Other Profiles**
- Tap any user in the directory or search results to see their public profile
- Public profile shows: photo, name, @username, church, member since date, badges earned (challenges completed count, group member, etc.)
- You can follow/unfollow from their profile
- No private data is exposed (no email, no phone, no journal entries)

### What This Does NOT Include (intentionally)

- **No direct messages** -- too much moderation overhead, and the app's purpose is reflection not chatting
- **No sharing journal entries** -- journals are private and sacred
- **No activity feed / timeline** -- this isn't social media
- **No friend requests** -- the follow model is simpler and less pressure

### Smart Use Cases for This App

| Use Case | How It Works |
|---|---|
| **New member discovery** | A new member joins with their church code, browses the directory, and puts faces to names before next Sunday |
| **Cross-church connection** | Someone visits a friend's church, searches their @username, and follows them to stay connected |
| **Badge inspiration** | Seeing a fellow member's "7 Challenges Completed" badge motivates you to keep going |
| **Small group formation** | Browse the church directory to find people to invite to a study group |
| **Accountability** | Follow a few people from your congregation so you feel part of a community doing the same challenges |

### Technical Details

**New files:**
| File | Purpose |
|---|---|
| `src/components/fbs/CommunityScreen.tsx` | Main community/directory screen with search and member list |
| `src/components/fbs/PublicProfileScreen.tsx` | View another user's public profile with badges and follow button |
| `src/components/fbs/AvatarPicker.tsx` | Small component for tapping avatar to select a photo |

**Modified files:**
| File | Change |
|---|---|
| `WelcomeScreen.tsx` | Add username field to Step 3 (Create Account) with validation |
| `WelcomeScreen.tsx` (UserData type) | Add `username` and `avatarUrl` fields |
| `ProfileScreen.tsx` | Show @username under name, add tappable avatar for photo, show follower/following counts, add edit username option |
| `MoreSheet.tsx` | Change "Groups" to "Community" with a Users icon |
| `Index.tsx` | Add "community" and "public-profile" overlay screens, wire up navigation |
| `featureFlags.ts` | Add `community` feature flag (replace or augment `groups`) |

**Data model (localStorage for now, Supabase-ready):**

```text
UserData {
  firstName, lastName, phone, email,
  churchName, churchCode,
  username,          // new
  avatarUrl,         // new (base64 or URL)
}

follows[]  -- stored as array of usernames in localStorage
```

Since there's no backend yet, the "other users" will be simulated with demo data (a list of fake church members). When Supabase is added later, this swaps to real queries against a `profiles` table and a `follows` table.

**Username validation rules:**
- 3-20 characters
- Lowercase letters, numbers, underscores only
- Must be unique (checked against demo data for now)
- Shown as `@username` throughout the app

