

## iOS Native Assessment

Your app already does a lot right — the sky gradient, frosted-glass cards, safe-area handling, and tab bar are solid. But several details break the "native iOS" illusion. Here's what to change:

### 1. Font: Switch from Open Sans/DM Sans to SF Pro Display
iOS apps universally use **SF Pro** (the system font). Using `-apple-system, BlinkMacSystemFont` as primary font instead of Google Fonts immediately signals "native." This is the single biggest tell.

**Changes:** `src/index.css` (body font-family), `tailwind.config.ts` (fontFamily.sans), remove the Google Fonts `@import` lines.

### 2. Large Title Headers (iOS convention)
iOS uses a distinctive **large title** pattern: big bold text (~34px) at top that shrinks into the nav bar on scroll. Your headers ("Sermon", "Reflection Journal") are 24px and static. Making them larger and bolder matches the iOS Settings/Messages app style.

**Changes:** Increase page title `h1` sizes in `SermonTab.tsx`, `JournalTab.tsx`, and similar screens from `text-2xl` to `text-[34px] leading-tight`.

### 3. Bottom Tab Bar refinements
The iOS tab bar has specific conventions:
- **28px icons** (yours are 22px — slightly small)
- **Filled icons** for active state (yours use stroke weight change only)
- **Slightly taller** bar (~49pt content + safe area)
- **Hairline divider** (not a visible border + shadow)

**Changes:** `BottomNav.tsx` — increase icon size, use filled variants for active state, reduce height to 49px content area, use a 0.5px hairline top border instead of `border-t + shadow-nav`.

### 4. Card corner radius
iOS uses 12–16px radius consistently for grouped inset cards (like Settings). Your `--radius: 1rem` (16px) is fine but the `rounded-3xl` (24px) on many cards feels more Android/Material. Dial cards back to `rounded-2xl` (16px).

**Changes:** `SermonTab.tsx`, `HomeTab.tsx`, `JournalTab.tsx` — replace `rounded-3xl` with `rounded-2xl` on content cards.

### 5. List/Menu styling (More sheet)
The "More" sheet uses large rounded buttons with icon circles — this looks custom/Material. iOS uses a grouped inset list (like Settings.app): white background, tight rows, thin separators, no icon backgrounds.

**Changes:** `MoreSheet.tsx` — restyle options as an iOS-style grouped list: single card with dividers between items, remove circular icon backgrounds, left-align with chevron-right disclosure indicators.

### 6. Haptic-style active state
Your `.tap-active` scales to 0.97 — iOS uses a subtler highlight: a brief opacity dim (0.7) without scale transform.

**Changes:** `src/index.css` — update `.tap-active:active` to `opacity: 0.7` without `transform: scale()`.

### 7. Remove visible box shadows on cards
iOS uses very subtle shadows or none at all (relying on background contrast). Your `shadow-card` is visible. Remove or greatly reduce card shadows.

**Changes:** `src/index.css` — reduce `--shadow-card` to near-zero or remove it.

---

### Summary of files to change
| File | What |
|------|------|
| `src/index.css` | System font, tap feedback, shadow reduction |
| `tailwind.config.ts` | Font family to system stack |
| `src/components/fbs/BottomNav.tsx` | Icon size, filled active icons, hairline border, height |
| `src/components/fbs/MoreSheet.tsx` | iOS grouped-list style |
| `src/components/fbs/SermonTab.tsx` | Large title, card radius |
| `src/components/fbs/JournalTab.tsx` | Large title, card radius |
| `src/components/fbs/HomeTab.tsx` | Card radius adjustments |

No backend or database changes needed.

