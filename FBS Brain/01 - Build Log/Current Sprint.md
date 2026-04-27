# Current Sprint

## Status: Ready to Build

## Last Session (2026-04-27)
- Documentation only — no code written
- Saved PWA Install Flow full game plan to `FBS Brain/02 - Backlog/PWA Install Flow.md`
- Added Backlog section to Current Sprint

## What's Next
1. Audit Lovable-specific dependencies — especially `@lovable.dev/cloud-auth-js`
2. Walk through the app end-to-end and document what works vs what's broken
3. Decide on churchless users flow (keep or cut for V1)
4. Build QR code → church landing page flow

## Blocking
- faithbeyondsundays.app domain still propagating (check next session)

---

## Backlog (Do Not Touch Until App Is Functional)

### PWA Install Flow — Landing Page + Device Wizard
Full game plan saved at: `FBS Brain/02 - Backlog/PWA Install Flow.md`

**What it is:** QR code → branded landing page → device-specific install wizard (iOS 17, iOS 15/16, iOS 14, iPad, Android) that walks members through adding the PWA to their home screen.

**Why it matters:** This is the primary onboarding path for members. Every church gets a unique QR code. Pages are white-labeled per church. iOS wizards have a sticky top banner + animated arrows pointing to exact Safari UI elements per iOS version.

**Build order when ready:** 6 Claude Code sessions (Foundation → Android → iOS 17 → Remaining iOS → Landing page → QR + Polish). See the full file for session-by-session breakdown and all code patterns.
