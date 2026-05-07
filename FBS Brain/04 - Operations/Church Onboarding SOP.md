# Church Onboarding SOP

Every time a new church is onboarded onto Faith Beyond Sundays, follow this checklist in order. Don't skip steps or skip ahead — each section gates the next.

---

## Phase 1 — Platform Setup (Sebastian does this)

### 1.1 Create the church in the Platform Dashboard
- [ ] Go to `/platform/churches` → **New Church**
- [ ] Enter church name, city, state
- [ ] Upload church logo (PNG, JPG, or SVG — square recommended)
- [ ] Enter admin email → **Create Church**
- [ ] If name is >15 characters: note the warning — you'll set the short name in step 1.3

### 1.2 Verify the church record
- [ ] Church appears in the churches table with correct name and location
- [ ] Logo thumbnail shows in the table row
- [ ] Status shows **Active**

### 1.3 Test and set the App Short Name
- [ ] Click into the church → open the church detail page
- [ ] Find the **App Name & Home Screen** card — it has a 3-step flow:
  - **Step 1:** Copy the church name → open Safari on your iPhone → any website → Share → Add to Home Screen → paste the name when prompted → check if it fits under the icon without being cut off → come back
  - **Step 2:** Choose "Full name fits" or "Need to shorten"
  - **Step 3 (if shortening):** Type the abbreviated name (max 15 chars), click away to save — watch for the green ✓
  - Good short name examples: "Cornerstone Community Church" → "Cornerstone" or "CCC". "Christ Presbyterian Church" → "Christ Pres" or "CPC"

### 1.4 Assign and invite the church admin
- [ ] On the church detail page → **Church Admin** card → **Assign Admin** (if not done during creation)
- [ ] Click **Resend Invite** to send the admin invite email
- [ ] Confirm the admin received the email (ask them)

---

## Phase 2 — Church Admin Setup (Pastor/staff does this)

Walk the admin through these steps or send them as instructions.

### 2.1 Admin account setup
- [ ] Admin clicks the invite link → sets up their password
- [ ] Admin logs into `/admin`
- [ ] Admin completes church profile: website, giving URL, Instagram handle (Settings tab)

### 2.2 First sermon upload test
- [ ] Admin uploads a real or test sermon (audio or video) from the Sermons tab
- [ ] Watch the sermon pipeline run: upload → transcribe → generate content
- [ ] Confirm all 7 days of content appear (Daily Sparks, reflections, scripture)
- [ ] If pipeline fails: check Known Issues, check Edge Function logs in Supabase

---

## Phase 3 — Internal PWA Test (Church team member does this)

**Do not skip this step.** This is the quality gate before the church goes public.

### 3.1 Install the PWA internally
- [ ] Send the church's PWA URL to one person on the church team: `https://faithbeyondsundays.com/?church=[church-code]`
- [ ] They open it on their phone (iOS: Safari, Android: Chrome)
- [ ] They follow the "Add to Home Screen" prompt

### 3.2 Verify the home screen icon
- [ ] Check the app icon — does it show the church logo?
- [ ] Check the app name under the icon — is it correct and untruncated?
- [ ] If icon is wrong or name is wrong: go back to Platform Dashboard → church detail → fix logo or short name → they reinstall

### 3.3 Walk through every screen
The tester should open the app and check each tab:
- [ ] **Home tab** — Does it show the church name? Does the Daily Spark load?
- [ ] **Sermon tab** — Does this week's sermon and content appear?
- [ ] **Journal tab** — Can they write a reflection?
- [ ] **Bible tab** — Does the Bible reader open? Can they select a book/chapter?
- [ ] **Community tab** — Does the community feed load? (May be empty — that's expected)
- [ ] **Prayer tab** — Can they submit a prayer request?

### 3.4 Sign-up flow (if testing with a fresh account)
- [ ] Open `https://faithbeyondsundays.com/?church=[church-code]` in a private/incognito window
- [ ] Sign up with a test email
- [ ] Confirm they're linked to the correct church (name shows in the app, not a generic screen)
- [ ] Delete the test account after (via Supabase if needed)

### 3.5 Sign off
- [ ] Church team member confirms: icon ✓, name ✓, all tabs load ✓
- [ ] Sebastian reviews Platform Dashboard — church shows correct member count after test signup

---

## Phase 4 — Go Live

### 4.1 Generate and distribute QR code
- [ ] Generate the church's QR code pointing to `https://faithbeyondsundays.com/?church=[church-code]`
  - Use any QR code generator (e.g. qr.io, or built into a future FBS feature)
- [ ] Send the QR code to the church admin as a PNG file
- [ ] Confirm they know where to display it: bulletin, screen, lobby signage

### 4.2 Confirm first real sermon is live
- [ ] Admin has uploaded the first real Sunday sermon
- [ ] Content pipeline completed (all 7 days visible)
- [ ] Members who install the app will see real content immediately

### 4.3 Done
- [ ] Church is live ✓
- [ ] Add the church to your personal notes with: church name, code, admin email, go-live date

---

## Quick Reference

| Field | Where to find it |
|-------|-----------------|
| Church code | `churches` table → `code` column |
| PWA URL | `https://faithbeyondsundays.com/?church=[code]` |
| Admin login | `https://faithbeyondsundays.com/admin` |
| Platform dashboard | `https://faithbeyondsundays.com/platform` |
| Supabase logs | Supabase Dashboard → Edge Functions → Logs |

---

## Common Issues

**Logo not showing as PWA icon:**
The app may need to be reinstalled after a logo upload. Tell the tester to delete the home screen icon and re-add it.

**Pipeline stuck / content not generating:**
Check Supabase → Edge Functions → `process-sermon` logs. Common cause: audio file too large, or Anthropic API key expired.

**Admin can't log in:**
Email hook may be down — check Known Issues. Workaround: reset password directly via Supabase Auth dashboard.

**Wrong church shows in app:**
`localStorage` may have a stale `fbs_church_code`. Tell the user to clear site data in their browser settings, then revisit the QR code URL.
