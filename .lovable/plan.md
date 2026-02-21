

## Social Proof + Invite & Badge

Two changes: (1) hide raw member counts when the church has fewer than 15 members, showing a warm message instead, and (2) add an "Invite a Friend" button with a shareable link and a "Community Builder" badge for users who send invites.

---

### 1. Member Count Threshold (15)

**`CommunityScreen.tsx`** -- Church header card:
- If `churchMembers.length >= 15`: show "{count} members" as it does now
- If `churchMembers.length < 15`: show "Your church family" instead of a number -- feels warm and intimate, not empty

The section label ("Church Members") stays the same regardless.

---

### 2. Invite a Friend Button

**`CommunityScreen.tsx`** -- Add an "Invite a Friend" card below the church header:
- A styled button with a Share/Send icon and text like "Invite a friend to join"
- Tapping it uses the Web Share API (`navigator.share`) if available, otherwise copies a link to clipboard
- The share message will be something like: "Join me on Faith Beyond Sundays! Download the app and use church code [CODE] to connect with our community."
- After the first successful invite/share, save a flag in localStorage (`fbs_has_invited`)

---

### 3. Community Builder Badge

**`PublicProfileScreen.tsx`** and **`ProfileScreen.tsx`**:
- Add a new badge: "Community Builder" with a heart-handshake icon (using `HeartHandshake` from lucide)
- Badge appears when the user has sent at least one invite (checked via `localStorage` flag `fbs_has_invited`)
- Color: a friendly teal/green (`hsl(170, 55%, 45%)`)

**`communityData.ts`**:
- Add helper functions: `markInviteSent()` and `hasInvited()` that read/write the `fbs_has_invited` localStorage key
- Add `hasInvited` field to demo members so some of them show the badge too

---

### Files Changed

| File | Change |
|---|---|
| `CommunityScreen.tsx` | Threshold logic on member count; add Invite card with Web Share API |
| `PublicProfileScreen.tsx` | Add Community Builder badge to badge grid |
| `ProfileScreen.tsx` | Show Community Builder badge on own profile if earned |
| `communityData.ts` | Add `markInviteSent()`, `hasInvited()` helpers; add `hasInvited` to demo data |

---

### Technical Notes

**Invite share content:**
```text
Subject: "Join Faith Beyond Sundays"
Text: "Join me on Faith Beyond Sundays! Use church code '{churchCode}' to connect with {churchName}."
URL: "https://faithbeyondsundays.lovable.app"
```

**Web Share API fallback:** If `navigator.share` is not supported (desktop browsers), fall back to copying the invite text to clipboard and showing a toast "Invite link copied!"

**localStorage keys:**
- `fbs_has_invited` -- boolean flag, set to `"true"` after first share

