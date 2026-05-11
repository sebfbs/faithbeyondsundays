# Church Onboarding Checklist

Before giving a church their QR code or member link, every item below must be checked off.
**Do not share the link with the congregation until this list is complete.**

---

## Phase 1 — Platform Setup (Sebastian)

- [ ] Church created in Platform dashboard (name, code, is_active = true)
- [ ] Church code is a valid slug (lowercase, no spaces, e.g. `overflow` or `cornerstone-church`)
- [ ] Church logo uploaded (192×192 and 512×512 sizes confirmed in Supabase Storage)
- [ ] `app_short_name` set if church name is longer than 15 characters
- [ ] Dynamic manifest tested: visit `/api/manifest?church=[code]` — confirm correct name, short name, and logo icons
- [ ] PWA icon tested on real device: visit `/?church=[code]` in Safari → Add to Home Screen → confirm home screen icon shows church logo

## Phase 2 — Church Admin Setup

- [ ] Admin account created for the pastor/staff member (email + password)
- [ ] Admin account linked to the correct church in `user_roles` with role = `owner` or `admin`
- [ ] Admin can log in to `/admin/login` and see their dashboard
- [ ] Sermon upload tested: admin uploads a test sermon and confirms transcription pipeline completes
- [ ] At least one sermon with generated daily content exists before launch

## Phase 3 — Member App Test (Internal)

- [ ] Visit `/?church=[code]` on an iPhone in Safari
- [ ] Confirm church logo and name appear on the landing page
- [ ] Follow install instructions → Add to Home Screen → open from home screen icon
- [ ] Confirm PWA opens at `/app?church=[code]` (not the landing page)
- [ ] Sign up as a test member → confirm church is auto-linked on profile creation
- [ ] Walk through all tabs: Home, Sermon, Journal, Bible, Community, Prayer
- [ ] Home tab shows the test sermon's Daily Spark content
- [ ] Visit `/?church=[code]` on an Android in Chrome — confirm instructions are correct
- [ ] Visit `/?church=[code]` in Chrome on iOS — confirm "Open in Safari" message appears

## Phase 4 — Go Live

- [ ] Onboarding call completed with pastor/staff (show them how to upload sermons, manage members, post announcements)
- [ ] Church is ready with a real sermon uploaded and content generated
- [ ] QR code generated pointing to `https://faithbeyondsundays.app/?church=[code]`
- [ ] QR code tested — scans correctly and lands on church landing page
- [ ] Pastor given the direct link as a backup: `https://faithbeyondsundays.app/?church=[code]`
- [ ] Pastor briefed: share the QR code or link with congregation — **never the generic URL**

---

## Notes

- Church codes are permanent once shared with members. Do not change a church code after go-live.
- If the church name changes, update the `name` column in the `churches` table — the code stays the same.
- If the pastor forgets their password, use Supabase auth → send password reset email (requires Resend to be configured).
