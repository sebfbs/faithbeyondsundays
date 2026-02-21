

## Add "Give" Option to More Sheet

### What It Does
Adds a "Give" row to the More sheet that opens the church's external giving link (Pushpay, Tithe.ly, etc.) in a new browser tab. Sits alongside Bible, Community, Prayer, and Profile — feels like a natural utility, not a sales pitch.

### Visual Result
- A new row in the More sheet with a heart/hand-coins icon and "Give" label
- Tapping it opens the church's giving URL in a new tab
- Same styling as all other More sheet options (icon circle + label)
- Controlled by a feature flag so churches can toggle it on/off

### Technical Details

**1. `src/components/fbs/featureFlags.ts`**
- Add `giving: true` to the feature flags

**2. `src/components/fbs/data.ts`**
- Add a `givingUrl` field to the sermon/church data (e.g. `"https://pushpay.com/example"`)

**3. `src/components/fbs/MoreSheet.tsx`**
- Add a "Give" option to the `allOptions` array with a `HandCoins` icon (from lucide-react)
- Feature-flagged under `"giving"`
- When tapped, open the giving URL via `window.open(url, '_blank')`
- Pass the giving URL as a prop to MoreSheet

**4. `src/pages/Index.tsx`** (or wherever MoreSheet is rendered)
- Pass the giving URL from church data to MoreSheet

### Not Included (Future)
- No home screen card (keeps home focused on spiritual content)
- No native Stripe integration (external link for now)
- Could add occasional home prompts during giving campaigns later
