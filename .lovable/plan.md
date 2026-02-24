

## Reorder Community Screen Layout

### Current Order
1. Search bar
2. Church card (e.g. "Grace Community Church")
3. Invite a Friend button
4. "Church Members" section label
5. Member list

### New Order
1. Search bar
2. Invite a Friend button
3. "Your church" section label (new)
4. Church card
5. "Church members" section label
6. Member list

### Changes

**File: `src/components/fbs/CommunityScreen.tsx`**

Rearrange the JSX blocks so "Invite a Friend" comes right after the search bar, then add a new "Your church" section label before the church card, and keep the existing "Church members" label before the member list. All styling will match the existing uppercase tracking-widest label style already used for "Church Members."

