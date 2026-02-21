

## Add FBS Username Pill to Public Profile

### What's Changing
The plain `@username` text below the member's name will be wrapped in a styled pill (matching the Instagram pill style), with the FBS logo on the left. Both pills will sit side by side or stacked, giving a clean, consistent look.

### Visual Result
Instead of:
- Plain text: `@pastor_james`
- Instagram pill: `[IG icon] @pastor_james`

It becomes:
- FBS pill: `[FBS logo] @pastor_james`
- Instagram pill: `[IG icon] @pastor_james`

Both pills use the same `bg-muted/50` rounded-full style for visual consistency.

### Technical Details

**File: `src/components/fbs/PublicProfileScreen.tsx`**

1. Import the FBS logo: `import fbsLogo from "@/assets/FBS_Logo_white.png"`
2. Replace the plain `<p className="text-sm text-muted-foreground">@{member.username}</p>` with a pill-styled container matching the Instagram pill:
   - Rounded-full, `bg-muted/50` background
   - FBS logo (14x14, rendered on a small dark circle so the white logo is visible) on the left
   - `@{member.username}` text on the right
3. If both FBS username and Instagram handle exist, wrap them in a flex row with a small gap so they sit side by side (or wrap on narrow screens using `flex-wrap`)

No new files or dependencies needed.
