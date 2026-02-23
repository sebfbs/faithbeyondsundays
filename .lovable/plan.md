

## Replace "Independent" Label with Mini CTA

### What's Changing

On the Profile screen, churchless users currently see the word "Independent" under their username. We'll replace that with a tappable mini call-to-action that encourages them to connect to a church.

### Details

**File: `src/components/fbs/ProfileScreen.tsx` (line 168-170)**

Replace:
```
<p className="text-xs text-muted-foreground mt-0.5">
  {user.churchName || "Independent"}
</p>
```

With a conditional that, when the user has no church, renders a small tappable link styled with the app's primary/amber color and a church icon (from lucide-react), reading something like "Find a Church" or "Connect to a Church". Tapping it navigates to the church search/onboarding flow (same as the existing "Connect to a Church" button on the home screen). When the user does have a church, it continues showing the church name as-is.

The CTA will use `react-router-dom`'s `useNavigate` (already imported in the file) and a small `Church` icon from lucide-react for visual context. Styled as a subtle but noticeable link -- not a full button, just an inline text CTA with an icon.

