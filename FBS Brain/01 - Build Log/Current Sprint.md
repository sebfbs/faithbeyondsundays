# Current Sprint

## Status: Follow System Removed, Group Chat Overhauled — Next: OnboardingScreen Cleanup + Streak Logic

## Completed This Sprint (2026-04-30)

### Follow/Following System — REMOVED
- `FollowListSheet.tsx` deleted
- Follow counts + buttons removed from ProfileScreen, PublicProfileScreen, CommunityScreen
- Follow data/types removed from communityData.ts
- **Still to do:** OnboardingScreen 3 cosmetic references (lines 1045, 1140–1144), drop `follows` table in Supabase, username uniqueness → `(church_id, username)`

### Group Chat UX Overhaul — DONE
- Full-screen chat (position: fixed, nav bar hidden in chat)
- Auto-expanding textarea like iMessage
- iMessage-style day separators (Today / Yesterday / Weekday / Short date)
- Swipe left to reveal message timestamps
- Fixed scroll/swipe conflict (native touch listeners + direction lock)
- Demo timestamps updated to span today → 7 days ago

### Tap-to-Profile in Groups — DONE
- Tap avatar or sender name in group chat → opens profile
- Tap member row in group landing page → opens profile

## Completed This Sprint (2026-04-29)

### Badge System — DONE
- Full badge system built end-to-end (DB + frontend + real-time)
- `user_badges` and `bible_reads` tables created with RLS and triggers
- `BadgeStackGroup` Apple Wallet fan-expand component
- Locked badge cards: uniform gray, lock icon right-aligned, Founding Member excluded
- `ProfileScreen` and `PublicProfileScreen` updated with new badge sections
- `BibleScreen` logs every chapter read to `bible_reads`
- Real-time banner + confetti fires on badge earn
- Fixed: `reflection_badges` missing from `supabase_realtime` publication (was breaking entire channel)

## Completed This Sprint (2026-04-28)

### Onboarding Wizard — Animated Mockup Polish — DONE
- tour4 (Bible): scroll to Romans, tap highlights, chapter grid, verse text vv1-6
- tour5 (Community): full animation sequence, Women's Group sheet fix, padding fix, 2.5s start delay

## Completed This Sprint (2026-04-27)

### Lovable Independence — DONE
- All frontend Lovable dependencies removed and replaced
- All 7 edge functions migrated off Lovable gateway → Anthropic API + Resend
- All 7 edge functions deployed to Supabase
- Supabase secrets set: `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `HOOK_SECRET`
- Auth email hook wired in Supabase Auth → Hooks → Send Email
- App builds clean, zero errors

### GTM Strategy — DONE (Session 2, 2026-04-29)
- Created `FBS Brain/03 - GTM Strategy/` with two documents
- Distribution Strategy: 3-phase GTM plan (founding churches → pastor flywheel → owned distribution)
- Referral Program Research: $100/mo recurring commission structure, framing, competitive gap analysis, pastor guilt-free payout design

## What's Next

1. **OnboardingScreen follow cleanup** — remove 3 cosmetic follow references still in the file (line 1045 copy, lines 1140–1144 mockup)
2. **Drop follows table** — run `drop table if exists follows cascade;` in Supabase SQL Editor
3. **Username uniqueness** — change DB constraint from `username` to `(church_id, username)`
4. **Streak logic** — wire up daily reflection streak increment on `profiles.streak_current`; streak badge triggers are already in place and will fire automatically once streaks update
5. **Founding Member backfill** — one-time SQL to award the badge to existing users who signed up before the trigger was added
6. **Bible: Next Chapter button** — add a Next / Previous button at the bottom of the chapter text view so users don't have to swipe back and tap the next chapter number. Standard pattern in all Bible apps.
7. **Instagram handle: enforce lowercase** — when user types their IG handle (profile settings), auto-lowercase it on input so it's never stored or displayed with uppercase letters. Affects the IG pill on the profile page.
8. **Locked badge tooltip** — when a user taps a grayed-out locked badge, show a small pop-up explaining how to earn it (e.g. "Read 10 Bible chapters to earn this"). Turns confusion into a call to action.
9. **End-to-end app walkthrough** — walk through the deployed app and document what works vs what's broken
10. **QR code → church landing page flow**
11. **Empty state: show church name instead of "Faith Beyond Sundays"** *(see full spec below)*
12. **Primary accent color refresh** *(see full spec below)*
13. **Pastor announcements feed — home screen** *(see full spec below)*

---

## Task Spec: Full White-Label Language Audit + Church Name Everywhere

**Decision (2026-04-30):** Every word a member reads inside the app should feel like it's coming from their church — not from Faith Beyond Sundays. FBS is the invisible engine. The church is the voice. This task is a full copy audit across the entire member-facing app.

### The principle
- ❌ "Welcome to Faith Beyond Sundays" 
- ✅ "Welcome to Overflow Church"
- ❌ "Faith Beyond Sundays helps you stay connected"
- ✅ "Stay connected with your church family"
- ❌ Any UI copy that names or implies FBS as the speaker
- ✅ Copy that sounds like the church speaking to its own congregation

### What to do
**Step 1 — Audit:** Search the entire `src/` directory for every instance of:
- `"Faith Beyond Sundays"` (hardcoded string)
- `"FBS"` (abbreviated brand name in UI copy)
- Any copy that sounds like a SaaS product talking to a user rather than a church talking to a member

Grep commands to run:
```bash
grep -r "Faith Beyond Sundays" src/
grep -r '"FBS"' src/
```

Also do a manual read-through of every member-facing screen for tone — not just brand name hits. Look for anything that sounds corporate, SaaS-y, or platform-generic.

**Step 2 — Replace:** For every hardcoded "Faith Beyond Sundays" string:
- Replace with `{churchName}` pulled dynamically from the church's record in Supabase
- The church name lives on the `churches` table, accessible via the member's `church_id` on their `profiles` row
- If church name is already in context (AuthProvider or similar), use that — no redundant fetches

**Step 3 — Tone fixes:** For copy that doesn't name FBS but still sounds wrong:
- Rewrite to sound like the church is speaking
- Examples of tone shift:
  - "Your pastor hasn't uploaded a sermon yet" → ✅ keep this one, it's already church-voiced
  - "Connect with your Faith Beyond Sundays community" → ✅ "Connect with your church family"
  - "Your FBS journey" → ✅ "Your faith journey"

### Key files to audit (start here, not exhaustive)
- `src/components/fbs/HomeTab.tsx` — confirmed has hardcoded empty state
- `src/components/fbs/OnboardingScreen.tsx` — onboarding copy is high visibility
- `src/components/fbs/AuthScreen.tsx` — login/signup copy
- `src/components/fbs/SermonTab.tsx`
- `src/components/fbs/JournalTab.tsx`
- `src/components/fbs/CommunityScreen.tsx`
- `src/components/fbs/PrayerScreen.tsx`
- Any toast messages, error states, or empty states across all screens

### Church name data flow
- `churches` table → `name` column = the church's display name
- Member's `profiles` row → `church_id` foreign key → look up church name once on app load
- Store it in a context (e.g. `AuthProvider` or a new `ChurchContext`) so every component can access it without re-fetching
- Fallback: if church name is null or fails to load, use `"your church"` as generic fallback — never "Faith Beyond Sundays"

### Acceptance criteria
- Zero instances of "Faith Beyond Sundays" visible to members anywhere in the app
- Zero instances of "FBS" in member-facing UI copy
- All empty states, welcome messages, and onboarding copy uses `{churchName}` or church-voiced generic language
- Tone throughout feels like the church talking to its congregation
- App builds clean with zero TypeScript errors after changes
- Test by logging in as a member of a test church and reading every screen top to bottom

---

## Task Spec: Remove Followers/Following System

**Decision made (2026-04-30):** FBS community is church-scoped only. Cross-church social graph (followers, following, global user search) doesn't fit the white-label model and creates a weird popularity hierarchy inside congregations. Cut it clean.

**Prayer requests:** Scope to church admin/team dashboard only — not visible to all members in the community feed.

### Architectural decision: usernames are church-scoped, not globally unique
**Decided 2026-04-30.** Usernames are unique within a church only — not across all of FBS. This means 100 churches can each have a `@sebastian` with no conflict. This permanently closes the door on cross-church user discovery and global community features. That is intentional. FBS is a white-label church tool, not a social network. Each church is a closed garden. This decision should never be reversed without a full product rethink.

**Impact on the username feature:** Keep usernames — they still serve within-church identity and @mentions. But change how they're stored: the uniqueness constraint on the `username` column in the `profiles` table needs to be scoped to `(church_id, username)` rather than just `username` alone. Update the DB constraint accordingly when tackling this task.

### What to remove from the codebase
Search the entire codebase for and remove all code related to:
- `followers` / `following` counts displayed anywhere (profile cards, public profiles, etc.)
- Follow / unfollow buttons and their handlers
- Global user search (searching for users across all churches)
- Any queries that fetch follower/following lists
- Any types, hooks, or state related to follow relationships

Key files likely affected (verify before touching):
- `src/components/fbs/ProfileScreen.tsx` — probably shows follower/following counts
- `src/components/fbs/PublicProfileScreen.tsx` — probably shows follow button + counts
- `src/components/fbs/CommunityScreen.tsx` — may have global user search
- Any custom hooks in `src/hooks/` related to follows
- `src/integrations/supabase/types.ts` — check for follow-related types

### What to remove from Supabase DB
Run these in Supabase SQL Editor (confirm each before running — check for FK dependencies first):
- Drop the `follows` table (or whatever it's named — check migrations)
- Drop any related RLS policies
- Drop any related triggers or functions
- Remove any `follower_count` / `following_count` columns from `profiles` if they exist as denormalized counts

**How to find the table name:** Search migrations in `supabase/migrations/` for `follows` or `follower`.

### What to keep
- Member directory within the church (members can see other members of their own church)
- Groups / small groups
- Church-scoped community posts

### Acceptance criteria
- No follower or following count visible anywhere in the app
- No follow/unfollow button anywhere
- No global user search across churches
- DB is clean — no orphaned tables or columns
- App builds with zero TypeScript errors after removal
- Test: open ProfileScreen and PublicProfileScreen — no follow UI present

---

## Task Spec: Primary Accent Color Refresh

**Problem (2026-04-30):** The current golden-orange accent color feels too brown, too muted, too dull. It doesn't feel exciting or alive. It reads like a harvest festival, not a springtime faith app. The color is used everywhere — toggles, icons, buttons, badges, the FAB (+) button, the spark icon, active tab states.

**Goal:** Replace it with something that feels springy, light, and energetic. More morning light, less amber honey.

**What Sebastian likes:** The blue from the evening/sunset background gradient. Worth exploring flipping the primary to blue, or finding a brighter version of the current warm family.

### Color directions to present and compare

Before writing any code, generate 3–4 color options and show Sebastian swatches with the hex values. Let him pick before touching anything.

Directions to explore:
| Direction | Description | Starting point |
|---|---|---|
| **Bright true gold** | More yellow, less orange — sunlight not honey | `#F5C518` or similar |
| **Warm coral** | Energetic, modern, sunrise feel | `#FF6B35` or similar |
| **Electric amber** | Same hue family, cranked up in vibrancy and saturation | `#F59E0B` → push to `#FBBF24` |
| **Sky/morning blue** | Flip the primary entirely — pull from the sunset gradient | `#3B82F6` or similar |

### How to implement once color is chosen

This is a one-file change. The accent color is defined in `tailwind.config.ts` as a custom color token. Find it, update the hex value, and the whole app updates everywhere at once.

Steps:
1. Open `tailwind.config.ts` — find the primary/accent color definition (likely named `primary`, `accent`, or `gold`)
2. Update the hex value to the chosen color
3. If there are multiple shades (100, 200, 500, etc.), update the full scale
4. Check `src/index.css` for any hardcoded CSS variables that reference the old color
5. Run a grep for the old hex value across `src/` to catch any hardcoded instances: `grep -r "#OLD_HEX" src/`
6. Build and visually verify across: Home tab, Profile, Badges, Bible screen, toggle switches, FAB button, bottom nav active state

### Acceptance criteria
- Old color gone everywhere — no hardcoded hex values remaining
- New color passes a basic contrast check against white backgrounds (WCAG AA minimum)
- App builds clean
- Sebastian visually approves on the deployed app before closing the task

---

## Task Spec: Pastor Announcements Feed — Home Screen

**Decision (2026-04-30):** Add a pastor broadcast feed to the home screen. Pastor posts from the admin dashboard. Members see it in a scrollable feed below the daily spark card. One direction only — pastor to congregation. No member-to-member posting.

**V1 scope: announcements only** — text + optional link. No photos, videos, polls, or feedback yet. Those are V2.

**Why this matters for V1:** The home screen is dead when no sermon has been uploaded. Announcements give it life from day one — even a brand new church can immediately communicate with their congregation through the app.

### Member experience (home screen)
- Below the daily spark card (or the empty state card if no sermon), a feed of announcements appears
- Each announcement card shows:
  - Announcement text
  - Optional link (tappable, opens in browser)
  - Posted date (e.g. "2 days ago")
  - Church name or pastor name as the author
- Most recent announcement at the top
- If no announcements exist yet, section is hidden — don't show an empty feed

### Pastor experience (admin dashboard)
- New "Announcements" section in the admin dashboard
- Simple form: text area + optional URL field + "Post" button
- List of existing announcements with ability to delete
- No editing after post — delete and repost if needed (keeps it simple)

### Database
New table: `announcements`
```sql
create table announcements (
  id uuid primary key default gen_random_uuid(),
  church_id uuid references churches(id) on delete cascade not null,
  created_by uuid references profiles(id) on delete set null,
  body text not null,
  link_url text,
  created_at timestamptz default now() not null
);
```
- RLS: members of the church can read their church's announcements. Only admins can insert/delete.
- No `updated_at` — no editing, keep it simple.

### Key files to touch
- `src/pages/admin/` — add Announcements section (new component or tab)
- `src/components/fbs/HomeTab.tsx` — add announcement feed below the spark card
- Supabase SQL Editor — run the migration to create the table + RLS policies

### Acceptance criteria
- Pastor can post an announcement from the admin dashboard
- Announcement appears on the member home screen within seconds (or on next refresh)
- Optional link is tappable and opens correctly
- Deleting from admin removes it from the member feed
- If no announcements exist, the feed section is hidden — home screen looks clean
- App builds with zero TypeScript errors

---

## Backlog (Do Not Touch Until App Is Functional)

### Kids Mode — Virtual Pet + Games

**What it is:** A kids-mode experience within FBS where children earn rewards (feed/grow a virtual pet, unlock mini games) by completing daily devotionals, memory verses, and scripture activities tied to the week's sermon.

**Why it matters:** Makes the app sticky for families, not just individual adults. Most church apps completely ignore kids. This becomes a family engagement layer.

**Key decision when ready:** Single app with a "kids mode" toggle on the family account (unified account, simpler) vs. a fully separate kids PWA (cleaner UX, easier to lock down for young kids). Lean toward kids mode toggle first, evaluate a standalone app if demand justifies it.

**Build when:** V1 is fully launched and churching with real users. This is a V2+ feature.

---

### Pastor Feed — Full Content Types (V2)

**What it is:** Expand the V1 announcements feed into a full pastor broadcast channel. Pastor posts rich content from the admin dashboard. Members see it in the home screen feed.

**V2 content types to add:**
- **Photos** — pastor uploads an image with optional caption
- **Videos** — upload a video file or paste a YouTube/Vimeo link
- **Polls** — pastor creates a question with 2–4 answer options, members tap to vote, pastor sees results in admin dashboard
- **Feedback requests** — pastor asks an open-ended question, members respond with text, responses collected privately in admin dashboard

**Why V2 and not V1:** Each content type is its own feature (storage for photos/video, vote tracking for polls, response collection for feedback). V1 announcements prove the pattern works. Build the rest once V1 is live with real churches.

**Build when:** V1 announcements feed is live and at least a handful of churches are using it actively.

---

### PWA Install Flow — Landing Page + Device Wizard
Full game plan saved at: `FBS Brain/02 - Backlog/PWA Install Flow.md`

**What it is:** QR code → branded landing page → device-specific install wizard (iOS 17, iOS 15/16, iOS 14, iPad, Android) that walks members through adding the PWA to their home screen.

**Why it matters:** This is the primary onboarding path for members. Every church gets a unique QR code. Pages are white-labeled per church. iOS wizards have a sticky top banner + animated arrows pointing to exact Safari UI elements per iOS version.

**Build order when ready:** 6 Claude Code sessions (Foundation → Android → iOS 17 → Remaining iOS → Landing page → QR + Polish). See the full file for session-by-session breakdown and all code patterns.
