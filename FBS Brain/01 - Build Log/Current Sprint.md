# Current Sprint

## Status: Badge System Complete — Next: Streak Logic

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

1. **Streak logic** — wire up daily reflection streak increment on `profiles.streak_current`; streak badge triggers are already in place and will fire automatically once streaks update
2. **Founding Member backfill** — one-time SQL to award the badge to existing users who signed up before the trigger was added
3. **Bible: Next Chapter button** — add a Next / Previous button at the bottom of the chapter text view so users don't have to swipe back and tap the next chapter number. Standard pattern in all Bible apps.
4. **Instagram handle: enforce lowercase** — when user types their IG handle (profile settings), auto-lowercase it on input so it's never stored or displayed with uppercase letters. Affects the IG pill on the profile page.
5. **Locked badge tooltip** — when a user taps a grayed-out locked badge, show a small pop-up explaining how to earn it (e.g. "Read 10 Bible chapters to earn this"). Turns confusion into a call to action.
6. **End-to-end app walkthrough** — walk through the deployed app and document what works vs what's broken
7. **QR code → church landing page flow**

---

## Backlog (Do Not Touch Until App Is Functional)

### PWA Install Flow — Landing Page + Device Wizard
Full game plan saved at: `FBS Brain/02 - Backlog/PWA Install Flow.md`

**What it is:** QR code → branded landing page → device-specific install wizard (iOS 17, iOS 15/16, iOS 14, iPad, Android) that walks members through adding the PWA to their home screen.

**Why it matters:** This is the primary onboarding path for members. Every church gets a unique QR code. Pages are white-labeled per church. iOS wizards have a sticky top banner + animated arrows pointing to exact Safari UI elements per iOS version.

**Build order when ready:** 6 Claude Code sessions (Foundation → Android → iOS 17 → Remaining iOS → Landing page → QR + Polish). See the full file for session-by-session breakdown and all code patterns.
