

## Pastor Highlight (Admin-Assigned Role)

Add a pastor highlight to the community directory and profiles. The role is **not** part of the member onboarding flow — it's assigned on the admin/backend side. For now, it's simply a property on demo member data. When Supabase is added later, an admin dashboard would set this field.

---

### What Changes

**1. Data Model (`communityData.ts`)**
- Add `role?: "pastor"` to the `CommunityMember` interface
- Assign `role: "pastor"` to `pastor_james` in demo data
- Regular users never see or set this field — it comes from the data layer only

**2. Community Screen (`CommunityScreen.tsx`)**
- Sort the pastor to the very top of the church member list
- Add a small gold pill next to their @username that says "Pastor"
- Give their avatar a subtle 2px gold ring

**3. Public Profile (`PublicProfileScreen.tsx`)**
- If the viewed user has `role: "pastor"`, show:
  - A "Pastor" badge in the badges grid (gold ShieldCheck icon, church name as detail)
  - A subtitle under the @username: "Pastor at {churchName}"
  - Gold ring on their profile avatar

**4. Own Profile (`ProfileScreen.tsx`)**
- If the logged-in user has `role: "pastor"` (from their stored data), show the Pastor badge in their own badge grid

**5. UserData type (`WelcomeScreen.tsx`)**
- Add `role?: "pastor"` to the `UserData` interface so the type system supports it throughout the app
- The WelcomeScreen onboarding flow itself is **not modified** — no role picker, no extra step, nothing changes for the user signing up

---

### What Does NOT Change

- **WelcomeScreen onboarding flow** — completely untouched, no role selection step
- The role field is never set by the user during sign-up; it's undefined by default
- Later, an admin panel or Supabase row-level assignment would control who gets the pastor role

---

### Files Changed

| File | Change |
|---|---|
| `communityData.ts` | Add `role?: "pastor"` to interface; set on `pastor_james` |
| `CommunityScreen.tsx` | Sort pastor to top; gold pill label; gold avatar ring |
| `PublicProfileScreen.tsx` | Pastor badge, gold avatar ring, role subtitle |
| `ProfileScreen.tsx` | Show Pastor badge if current user has the role |
| `WelcomeScreen.tsx` | Add `role?: "pastor"` to `UserData` type only (no UI changes) |

---

### Visual Details

**In the member list:**
- Pastor's avatar: 2px gold ring
- Small rounded pill next to @username: "Pastor" in gold text on light gold background
- Always sorted first in the list

**On the pastor's profile:**
- Badge: gold ShieldCheck icon, "Pastor" label, church name as detail
- Subtitle under @username: "Pastor at Cornerstone Community Church"
- Gold ring on avatar

