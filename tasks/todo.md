# UI Bug Fixes — Session 2026-04-27

## Bug 1 — Community group member list scroll cutoff
**Root cause:** The member list scroll container has no bottom padding, so the last item scrolls behind hidden space at the bottom of the drawer.
**File:** `src/components/fbs/GroupDetailSheet.tsx` (line 190)
**Fix:** Add `pb-6` to the member list `div`.
**Status:** [ ] pending

---

## Bug 5 — Reflection modal positioning
**Root cause:** The textarea's `autoFocus` triggers the iOS keyboard, which shrinks the visual viewport. `scrollIntoView({ block: 'center' })` then centers relative to a viewport that just changed, landing at a random position.
**File:** `src/components/fbs/HomeTab.tsx`
**Fix:** Replace inline expansion with a `position: fixed` overlay centered on the visible screen. Background stays blurred. Overlay is always centered regardless of scroll position or keyboard state.
**Status:** [ ] pending

---

## Bug 6 — Follow list shows "Follow" instead of "Following"
**Root cause:** In "following" mode (people you follow), `demoFollows.includes(u.username)` may return false if the demo follows list doesn't match. In production, `isFollowingDb` is called — which should work, but is redundant since if someone is in the following list, you must be following them.
**File:** `src/components/fbs/FollowListSheet.tsx`
**Fix:** For "following" mode, initialize all follow states as `true` without a lookup — they're already followed by definition. For "followers" mode, keep individual checks.
**Status:** [ ] pending

---

## Bug 7 — Previous Sermons/Detail loads scrolled down
**Root cause:** No scroll-to-top on mount. The parent SermonTab has accumulated scroll state and sub-screens inherit it.
**Files:** `src/components/fbs/PreviousSermonsListScreen.tsx`, `src/components/fbs/PreviousSermonDetailScreen.tsx`
**Fix:** Add `useEffect(() => { window.scrollTo(0, 0); }, [])` to both components.
**Status:** [ ] pending

---

## Bug 8 — Journal compose nav bar bumps up on keyboard dismiss
**Root cause:** iOS Safari resizes the visual viewport when the keyboard opens, causing `position: fixed` elements (BottomNav) to jump. `autoFocus` on the textarea opens the keyboard immediately on mount, before the view has settled.
**Files:** `src/components/fbs/JournalTab.tsx`, `src/pages/Index.tsx`
**Fix:**
1. Add `onComposingChange?: (composing: boolean) => void` prop to `JournalTab`
2. In `Index.tsx`, track `journalComposing` state; hide `BottomNav` when `journalComposing` is true
3. In `JournalTab`, remove `autoFocus` from the textarea; use a `ref` + `focus()` in a `useEffect` with a 150ms delay so the view settles before the keyboard opens
**Status:** [ ] pending
