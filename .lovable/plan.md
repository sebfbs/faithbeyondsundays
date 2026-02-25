

## Add "Try Demo" Button to Welcome Screen

A minimal, single-file change to `src/components/fbs/AuthScreen.tsx`.

### What changes
- Import `useNavigate` from `react-router-dom`
- Add a small text link below the "Already have an account? Sign In" button that says **"Just exploring? Try the Demo"**
- On click, it navigates to `/home?demo=true`

### Design
The button will match the subtle style of the existing "Sign In" link -- small, understated text so it doesn't distract from the main sign-up flow. Easy to remove later by deleting a few lines.

### Technical detail

**File: `src/components/fbs/AuthScreen.tsx`**
- Add `import { useNavigate } from "react-router-dom"` 
- Add `const navigate = useNavigate()` inside the component
- After the "Already have an account? Sign In" button (line ~121), add:
```
<button
  onClick={() => navigate("/home?demo=true")}
  className="w-full text-center text-xs text-gray-500 tap-active py-2"
>
  Just exploring? <span className="underline">Try the Demo</span>
</button>
```

No other files are touched.

