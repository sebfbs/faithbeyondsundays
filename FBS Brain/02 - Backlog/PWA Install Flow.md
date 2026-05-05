# FBS PWA Install Flow — Full Game Plan

**Priority:** Low — build this after the app is functional. Comes into play when building the marketing website and landing pages.

---

## Overview

Church members scan a QR code → land on a branded landing page → tap "Download App" → get routed to a device/version-specific install wizard that walks them through adding the PWA to their home screen.

**The same landing page serves two entry points:**
```
QR code scan   ──┐
                 ├──▶  gracecommunitychurch.faithbeyondsundays.com
Website button ──┘
```

Churches can also link to their install page from their own website, newsletter, Instagram bio, or anywhere else. One URL, works everywhere. The landing page handles the rest.

---

## Church Website Button

**How it works:** Each church gets their unique install URL from their admin dashboard. They paste it into a button on their website. That's it.

**What FBS provides from the admin dashboard:**
1. **Their install link** — copyable one-click, e.g. `gracecommunitychurch.faithbeyondsundays.com`
2. **An embeddable button snippet** — pre-written HTML they paste directly into their site, already styled and linked:

```html
<a href="https://gracecommunitychurch.faithbeyondsundays.com"
   style="display:inline-block;background:#1a3a6b;color:white;
          padding:14px 28px;border-radius:8px;font-family:sans-serif;
          font-size:16px;font-weight:600;text-decoration:none;">
  Get the Grace Community App
</a>
```

Churches don't need a developer. They copy, paste, done.

**V2 add-on (not now):** Let churches download a pre-made "Get the App" badge graphic from their admin dashboard — an App Store-style image with their church logo and name that links to their install URL. They drop it into their website as an image. Higher polish, same destination.

---

## Project Structure

```
/
├── /landing              → Scrollable branded landing page
├── /install              → Detection router (no UI, just redirects)
├── /install/android      → Android install flow
├── /install/ios17        → iOS 17+ wizard
├── /install/ios15        → iOS 15–16 wizard
├── /install/ios14        → iOS 14 and below wizard
├── /install/ipad         → iPad wizard
├── /install/unsupported  → Fallback page
└── /install/done         → Success/completion screen
```

---

## Page 1: /landing

### Purpose
Branded entry point. Sells the app in a few words. One CTA.

### Requirements
- Church logo + name at top (dynamically white-labeled via URL param or subdomain)
  - Example: `faithonsunday.com/fbc-dallas` or `fbcdallas.faithonsunday.com`
- 2–3 sentences max explaining the app
- Scrollable page
- At the bottom (and/or sticky footer): **"Download App"** button
- Tapping the button routes to `/install` (detection router)

### White Labeling
Each church gets a unique QR code that encodes their identifier:
```
faithonsunday.com/install?church=fbc-dallas
```
Church name, logo, and brand color pulled from a config or database by that ID.

---

## Page 2: /install (Detection Router)

### Purpose
Invisible routing page. Detects device/OS and redirects immediately. No UI needed — just a spinner for ~500ms while detection runs.

### Detection Logic

```javascript
const ua = navigator.userAgent;
const iosMatch = ua.match(/OS (\d+)_/);
const version = iosMatch ? parseInt(iosMatch[1]) : null;
const isIPad = /iPad/.test(ua) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);

// Preserve church param through redirect
const params = new URLSearchParams(window.location.search);
const church = params.get('church') || '';
const query = church ? `?church=${church}` : '';

if (isAndroid) {
  window.location.href = `/install/android${query}`;
} else if (isIPad) {
  window.location.href = `/install/ipad${query}`;
} else if (version >= 17) {
  window.location.href = `/install/ios17${query}`;
} else if (version >= 15) {
  window.location.href = `/install/ios15${query}`;
} else if (version) {
  window.location.href = `/install/ios14${query}`;
} else {
  window.location.href = `/install/unsupported${query}`;
}
```

---

## Page 3: /install/android

### Purpose
Android installs PWA natively via Chrome. Simplest flow.

### Steps
1. Page loads
2. `beforeinstallprompt` event is captured and triggered on button tap
3. User sees native Chrome install dialog
4. On success → redirect to `/install/done`

### Code Pattern

```javascript
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

document.getElementById('install-btn').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      window.location.href = '/install/done';
    }
  }
});
```

### UI
- Simple centered screen
- Church logo
- "Tap below to install [Church Name]"
- Big install button
- If `beforeinstallprompt` never fires (already installed or unsupported): show fallback message

---

## Pages 4–7: iOS Wizard Pages (ios17, ios15, ios14, ipad)

### Core Rules for ALL iOS Wizard Pages
- `body { overflow: hidden; height: 100vh; }` — PAGE CANNOT SCROLL
- Three dots (…) always visible at bottom right of Safari
- Sticky top banner always visible (stays above share sheet when it opens)
- Step counter shown throughout (Step 1 of 3, etc.)
- Each step is a full-screen card
- Animated arrows point to EXACT location for that iOS version

---

### iOS 17+ Wizard (/install/ios17)

**UI Layout**
```
┌─────────────────────────────┐
│  [Sticky Top Banner]        │  ← Always visible, even when share sheet opens
├─────────────────────────────┤
│                             │
│   Step card content         │
│   Instruction text          │
│   Animated arrow            │
│                             │
│   [Next] button             │
├─────────────────────────────┤
│  Safari UI  [···] ← arrow   │  ← Three dots, bottom right
└─────────────────────────────┘
```

**Step 1**
- Instruction: "Tap the three dots (•••) in the bottom right corner"
- Animated bouncing arrow pointing to BOTTOM RIGHT
- Sticky top banner: "Step 1 of 3"
- User taps "Next" after doing it

**Step 2**
- Share sheet is now open (Apple UI covers most of screen)
- Sticky top banner activates with: "Now tap 'Share'"
- Show screenshot of what they'll see
- Arrow points to Share option in the menu
- User taps "Next"

**Step 3**
- Sticky top banner: "Tap 'Add to Home Screen'"
- Screenshot showing Add to Home Screen option
- User taps "Next"

**Step 4**
- Sticky top banner: "Tap 'Add' in the top right"
- Screenshot of the Add to Home Screen confirmation dialog
- User taps "Done" → redirect to `/install/done`

---

### iOS 15–16 Wizard (/install/ios15)

Same 4-step structure as iOS 17 but:
- Arrow positions adjusted for iOS 15/16 UI differences
- Screenshots updated to match iOS 15/16 appearance
- Share button is at bottom center (not three dots) — first step arrow points there instead

**Step 1 difference:** "Tap the Share button at the bottom center of your screen"
- Arrow points to BOTTOM CENTER

---

### iOS 14 and Below (/install/ios14)

Same structure but:
- Share button location may differ
- Older UI screenshots
- Consider adding note: "We recommend updating iOS for the best experience"

---

### iPad Wizard (/install/ipad)

Key differences:
- Share button is TOP RIGHT on iPad
- Three dots also TOP RIGHT
- Arrows point to TOP RIGHT
- Layout adjusts for wider screen

---

## Sticky Top Banner — Critical Implementation

This is the most important iOS UX detail. Safari's share sheet slides up from the bottom. Your top banner stays visible above it.

```css
.sticky-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: [church brand color];
  color: white;
  padding: 12px 16px;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
  /* Respect notch/Dynamic Island */
  padding-top: calc(12px + env(safe-area-inset-top));
}
```

Banner text updates at each step:
- Step 1: "Step 1 of 4 — Tap the ••• button"
- Step 2: "Step 2 of 4 — Tap Share"
- Step 3: "Step 3 of 4 — Tap Add to Home Screen"
- Step 4: "Step 4 of 4 — Tap Add"

---

## Animated Arrow Component

Each step has a CSS-animated arrow that bounces toward the exact UI element.

```css
@keyframes bounce-arrow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.arrow {
  position: fixed;
  animation: bounce-arrow 1s ease-in-out infinite;
  font-size: 48px;
  z-index: 9998;
  pointer-events: none;
}

/* Position varies per iOS version and step */
.arrow-bottom-right {
  bottom: 80px;
  right: 20px;
}

.arrow-bottom-center {
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
}

.arrow-top-right {
  top: 80px;
  right: 20px;
}
```

---

## Page 8: /install/done

### Purpose
Celebration screen. Confirms success. Sends them to open the app.

### UI
- Checkmark animation or confetti
- Church logo
- "[Church Name] is ready!"
- "Find it on your home screen"
- Optional: "Open App" deep link button

---

## Page 9: /install/unsupported

### Purpose
Graceful fallback for desktop browsers, undetected devices, etc.

### UI
- "Looks like you're on a desktop"
- "Scan this QR code on your phone to install the app"
- Show QR code
- Or: "Send yourself a link" → email/SMS input

---

## White Labeling System

**⚠️ Do NOT use a hardcoded config file.** Church config lives in Supabase — `churches` table.

Every page pulls church config by reading `?church=overflow` from the URL param, then fetching that church's record from Supabase:

```javascript
const params = new URLSearchParams(window.location.search);
const churchCode = params.get('church');

// Fetch from Supabase (public read — no auth needed for name/logo)
const { data } = await supabase
  .from('churches')
  .select('name, logo_url, primary_color')
  .eq('code', churchCode)
  .single();

// data.name, data.logo_url, data.primary_color
```

The `churches` table has:
- `code` — the URL slug (e.g. `overflow`) — used as the `?church=` param
- `name` — display name (e.g. "Overflow Church")
- `logo_url` — full public URL to their logo in Supabase Storage
- `logo_192_url` / `logo_512_url` — resized versions for PWA manifest icons

**Always pass `?church=` through every redirect in the install flow.** If the param gets dropped, white labeling breaks and the member may not be linked to the right church on sign-up.

QR codes encode the full URL with the church param baked in: `app.faithbeyondsundays.com/?church=overflow`

---

## Tech Stack Recommendation

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js | Easy routing, SSR for fast load |
| Styling | Tailwind CSS | Fast iteration on wizard UI |
| Animations | CSS keyframes | No JS dependency, smooth |
| Hosting | Vercel | Fast global CDN, perfect for PWA |
| Config | JSON file or Supabase | Church white label data |

---

## Build Order for Claude Code Sessions

### Session 1 — Foundation
1. Set up Next.js project
2. Build church config system
3. Build `/install` detection router
4. Build `/install/done` page

### Session 2 — Android Flow
1. Build `/install/android` page
2. Implement `beforeinstallprompt` logic
3. Test on Android Chrome

### Session 3 — iOS17 Wizard
1. Build locked (no-scroll) wizard layout
2. Build sticky top banner component
3. Build animated arrow component
4. Build all 4 steps for iOS 17
5. Test on iOS 17 device

### Session 4 — Remaining iOS Versions
1. Clone iOS 17 wizard
2. Adjust arrow positions for iOS 15/16
3. Adjust arrow positions for iOS 14
4. Build iPad variant
5. Build `/install/unsupported` page

### Session 5 — Landing Page + White Labeling
1. Build `/landing` page
2. Wire up church config to all pages
3. Test full flow end to end

### Session 6 — QR Codes + Polish
1. Generate QR codes per church (encode full URL with church param)
2. Final visual polish on wizard steps
3. Real device testing across iOS versions
4. PWA manifest + service worker setup

---

## PWA Manifest (Dynamic — Not Static)

**The manifest is NOT a static file.** It is served by a Vercel serverless function at `/api/manifest`.

`index.html` points to it dynamically:
```html
<!-- index.html — set by inline script before page renders -->
<script>
  const code = new URLSearchParams(location.search).get('church')
    || localStorage.getItem('fbs_church_code');
  const href = code ? `/api/manifest?church=${code}` : '/manifest.json';
  document.write('<link rel="manifest" href="' + href + '">');
</script>
```

The Vercel function (`/api/manifest.ts`) reads `?church=overflow`, fetches that church's record from Supabase, and returns:
```json
{
  "name": "Overflow Church",
  "short_name": "Overflow",
  "start_url": "/?church=overflow",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a3a6b",
  "icons": [
    { "src": "https://[supabase]/logos/overflow/logo_192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "https://[supabase]/logos/overflow/logo_512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

The static `/manifest.json` in `public/` is a fallback only — used when no church param is present (e.g. direct traffic with no QR code).

---

## Key Rules to Tell Claude Code (When Building)

1. **Never add scroll to install wizard pages** — `overflow: hidden` is non-negotiable
2. **Sticky banner must use `env(safe-area-inset-top)`** to respect Dynamic Island/notch
3. **Arrow positions are hardcoded per iOS version** — do not try to calculate dynamically
4. **Always pass `?church=` param through every redirect**
5. **Test on real devices** — iOS simulator does not accurately show Safari UI positions
6. **One task at a time** — build and test each page before moving to the next

---

## Real Device Testing Checklist

- [ ] iOS 17 iPhone (latest)
- [ ] iOS 16 iPhone
- [ ] iOS 15 iPhone
- [ ] iPad (any iOS)
- [ ] Android Chrome
- [ ] Android Firefox (fallback)
- [ ] Desktop Chrome (unsupported flow)
- [ ] Desktop Safari (unsupported flow)
