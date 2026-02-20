

# PWA Setup for Faith Beyond Sundays

This plan will make your app installable from Safari's "Add to Home Screen" so it looks and feels like a native app on your iPhone -- with its own icon, splash screen, full-screen mode (no Safari browser bar), and proper app name.

## What you'll get

- **App icon** on your home screen with "Faith Beyond Sundays" underneath
- **Full-screen experience** -- no Safari address bar or navigation controls
- **Proper status bar** styling that blends with the app's blue header
- **Offline caching** so the app loads fast even on slow connections
- **Splash screen** while the app loads (matching your sky-blue/amber theme)

## Steps

### 1. Update index.html with mobile meta tags and app title
- Set the page title to "Faith Beyond Sundays"
- Add `apple-mobile-web-app-capable` meta tag (enables full-screen mode)
- Add `apple-mobile-web-app-status-bar-style` set to `black-translucent` so the status bar blends with the blue gradient header
- Add `apple-mobile-web-app-title` meta tag
- Add `theme-color` meta tag matching the app's sky blue
- Add a link to the web manifest file

### 2. Create a web app manifest (public/manifest.json)
- Set app name, short name, description
- Set `display: standalone` (removes browser chrome)
- Set theme and background colors to match the app's palette
- Define icon sizes (192x192 and 512x512)
- Set start URL to `/`

### 3. Install and configure vite-plugin-pwa
- Add `vite-plugin-pwa` dependency
- Configure it in `vite.config.ts` with:
  - Service worker for caching (so the app loads quickly)
  - The manifest settings
  - `navigateFallbackDenylist` for `/~oauth` route (required by the platform)

### 4. Create PWA icons in the public folder
- Generate simple themed icons at 192x192 and 512x512 sizes using an SVG-based approach (a golden cross/flame on a sky-blue background) so there's a proper app icon on the home screen

### 5. Viewport and mobile polish check
- Ensure the existing viewport meta tag includes `viewport-fit=cover` for proper safe-area handling on iPhones with notches
- The app is already mobile-first (430px max-width, safe-area padding on the nav bar), so no layout changes are needed

---

## Technical Details

**index.html additions:**
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Faith Beyond Sundays" />
<meta name="theme-color" content="#6AADD4" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
```

**vite.config.ts** will be updated to include the `VitePWA` plugin with workbox caching and the manifest configuration.

**public/manifest.json:**
```json
{
  "name": "Faith Beyond Sundays",
  "short_name": "FBS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f7f5f0",
  "theme_color": "#6AADD4",
  "icons": [...]
}
```

No changes to your existing components or layout are needed -- the app is already well-optimized for mobile with the 430px container, safe-area insets, and touch-friendly buttons.
