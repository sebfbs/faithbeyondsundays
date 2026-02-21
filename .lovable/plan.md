

## Add Instagram Handle to Profiles

### What's Changing
Users can optionally add their Instagram handle to their profile, and it will show on their public profile so congregation members can connect on Instagram.

### User-Facing Changes

1. **Profile Screen** -- A new "Instagram" field in a "Social" section where you can add/edit your handle (e.g. `@yourname`). Automatically strips the `@` if typed, stores just the username.

2. **Public Profile Screen** -- If the member has an Instagram handle, a tappable Instagram badge/link appears below their name. Tapping it opens their Instagram profile in a new tab.

3. **Completely optional** -- No handle? Nothing shows. No pressure.

### Technical Details

**File: `src/components/fbs/WelcomeScreen.tsx`**
- Add `instagramHandle?: string` to the `UserData` interface

**File: `src/components/fbs/communityData.ts`**
- Add `instagramHandle?: string` to the `CommunityMember` interface
- Add sample Instagram handles to a couple of demo members (e.g. `pastor_james` and `sarah_m`)

**File: `src/components/fbs/ProfileScreen.tsx`**
- Add a new "Social" section (styled like the existing Appearance/Notification sections) with an editable Instagram handle field
- Input auto-strips `@` prefix and validates (alphanumeric, periods, underscores only -- matching Instagram's rules)
- Save updates the user object in local state

**File: `src/components/fbs/PublicProfileScreen.tsx`**
- If `member.instagramHandle` exists, show a small tappable row below the username with the Instagram icon and handle
- Tapping opens `https://instagram.com/{handle}` in a new tab via `window.open`

No new files or dependencies needed. The Instagram icon will use a simple SVG inline since Lucide doesn't include brand icons.
