# Task: App Short Name + Home Screen Preview Card

**Goal:** Let platform admin set a short app name per church, with a live iOS/Android preview card showing exactly how it'll look on a home screen. Also create the Church Onboarding SOP in the Brain.

---

## Files to Touch

| # | File | What changes |
|---|------|-------------|
| 1 | SQL (Supabase SQL Editor) | Add `app_short_name VARCHAR(15)` column to `churches` table |
| 2 | `src/pages/platform/PlatformChurchDetail.tsx` | Add `app_short_name` field + live iOS & Android preview card under the logo card |
| 3 | `src/pages/platform/PlatformChurches.tsx` | Add inline warning in New Church form if name > 15 chars |
| 4 | `api/manifest.ts` | Use `app_short_name` if set, else fall back to full church name |
| 5 | `FBS Brain/04 - Operations/Church Onboarding SOP.md` | New file — step-by-step onboarding checklist |

---

## Steps

### Step 1 — SQL
```sql
ALTER TABLE churches ADD COLUMN app_short_name VARCHAR(15);
```
Run in Supabase SQL Editor.

### Step 2 — `PlatformChurchDetail.tsx`
Under the Church Logo card, add:

**App Short Name field:**
- Text input, max 15 chars
- Live character counter (`9 / 15`)
- Green checkmark if ≤ 15 chars and filled
- Yellow warning if church name > 15 chars AND field is empty: *"Church name is long — set a short name so it displays correctly on home screens"*
- Saves to `churches.app_short_name` on blur

**Home screen preview card (below the field):**
- Two side-by-side tiles: iOS | Android
- Each shows: dark wallpaper bg, church logo icon, name label below
- Label uses `app_short_name` if set, else full church name — truncates with ellipsis at tile width
- iOS tile: `font-family: -apple-system`, ~11px label, ~60px icon, squircle border-radius ~22%
- Android tile: `font-family: Roboto, sans-serif`, ~12px label, ~48px icon, circular crop
- Preview updates live as you type

### Step 3 — `PlatformChurches.tsx`
In the church name input:
- If `value.length > 15`: yellow warning icon + tooltip: *"Name is long — you can set a short display name after creating the church"*
- No hard block — warning only

### Step 4 — `api/manifest.ts`
```ts
short_name: church.app_short_name || church.name
```

### Step 5 — Church Onboarding SOP
New file: `FBS Brain/04 - Operations/Church Onboarding SOP.md`

---

## Acceptance Criteria
- [ ] `app_short_name` column in `churches` table
- [ ] Platform admin can set short name on church detail page
- [ ] Preview card shows correct icon + name for iOS and Android
- [ ] Preview updates live as short name is typed
- [ ] Warning appears in new church form for long names
- [ ] `api/manifest.ts` uses short name when set
- [ ] Onboarding SOP created and complete

---

## Old Bug Backlog (pending from 2026-04-27)

### Bug 1 — Community group member list scroll cutoff
`src/components/fbs/GroupDetailSheet.tsx` line 190 — add `pb-6`

### Bug 5 — Reflection modal positioning
`src/components/fbs/HomeTab.tsx` — replace inline expansion with `position: fixed` overlay

### Bug 6 — Follow list shows "Follow" instead of "Following"
`src/components/fbs/FollowListSheet.tsx` — init all states as `true` for "following" mode

### Bug 7 — Previous Sermons/Detail loads scrolled down
`PreviousSermonsListScreen.tsx`, `PreviousSermonDetailScreen.tsx` — add `window.scrollTo(0,0)` on mount

### Bug 8 — Journal compose nav bar bumps on keyboard dismiss
`JournalTab.tsx`, `Index.tsx` — hide BottomNav when composing, delay autoFocus 150ms
