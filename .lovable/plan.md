

## Fix: Platform Login White Page + Demo Badge Showing Everywhere

### Issue 1: White Page on Platform Login

**Root cause**: The Platform Login page is lazy-loaded with `Suspense fallback={null}`. While the component loads, the user sees the `#root` element's background, which is the member app's warm white color (`--background: 40 30% 97%`). If the lazy chunk takes any time to download (or if there's a loading delay from the auth check), the user stares at a blank white screen.

Additionally, if the user is already logged in (e.g., as a church admin), the `useEffect` in `PlatformLogin` calls `checkAccess()`, which queries `platform_admins`. If they're not a platform admin, it sets `accessDenied=true` -- but during the async database query, the page shows nothing meaningful.

**Fix**: Replace `Suspense fallback={null}` with a proper dark loading state for the platform login route. This matches the page's `bg-slate-950` design so there's no jarring white flash.

**File: `src/App.tsx`**
- Change the platform login Suspense fallback from `null` to a dark-background loading spinner that matches the platform's slate-950 design.

---

### Issue 2: Demo Badge Showing on Every Page

**Root cause**: When a user visits the demo (`/demo` or `?demo=true`), the DemoModeProvider saves `fbs_demo_mode=true` to localStorage. From that point forward, the demo badge appears on every single page -- including the platform admin dashboard, the church admin panel, and the login screens -- because the DemoModeBadge component never checks what route the user is on.

**Fix**: Update DemoModeBadge to hide itself on `/platform` and `/admin` routes. These are internal management tools that should never show the demo badge.

**File: `src/components/fbs/DemoModeBadge.tsx`**
- Add a `useLocation()` check: if the current path starts with `/platform` or `/admin`, return `null` (don't render the badge).

---

### Summary

| File | Change |
|------|--------|
| `src/App.tsx` | Add dark loading fallback for platform login Suspense |
| `src/components/fbs/DemoModeBadge.tsx` | Hide badge on `/platform` and `/admin` routes |

No new files or dependencies. Two small, targeted changes.

