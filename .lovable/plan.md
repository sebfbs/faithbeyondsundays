

## Scan Handwritten Journal Entry Feature

### What You'll Get

A camera icon button centered below the "Write your thoughts..." text box in the journal compose screen. When tapped, it shows a guidance overlay with scanning tips, then opens your phone's camera. After capturing the photo, the app checks image quality (brightness/contrast) and warns you if it might not scan well. Finally, AI transcribes the handwriting into text you can edit and save.

### User Flow

1. Tap **+** to open the compose screen
2. Below the text area, tap the camera button labeled "Scan handwriting"
3. A guidance overlay appears with tips in this order:
   - Hold phone directly above
   - Center the text in the frame
   - Use even lighting
   - Avoid shadows
   - Then a prominent "Open Camera" button
4. Phone camera opens (native)
5. After taking/selecting a photo, a client-side quality check runs:
   - Too dark, too bright, or low contrast triggers a warning with "Retake" / "Use Anyway" options
6. Image is sent to AI for transcription (or simulated in demo mode)
7. Transcribed text populates the text area for review and editing

---

### Technical Details

**New file: `supabase/functions/transcribe-journal/index.ts`**
- Accepts `{ image: string }` (base64 image data)
- Calls the Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) with model `google/gemini-2.5-flash`
- System prompt: "You are a handwriting transcription assistant. Transcribe the handwritten text in the provided image exactly as written. Return only the transcribed text, preserving paragraph breaks. Do not add commentary."
- Returns `{ text: string }`
- CORS headers and error handling for 429/402

**File: `src/components/fbs/JournalTab.tsx`**
- Add imports: `Camera`, `Loader2` from lucide-react; `useRef` to hooks
- Add state: `scanning` (boolean), `showScanTips` (boolean), `scanWarning` (string | null), `pendingImage` (string | null)
- Add a hidden `<input type="file" accept="image/*" capture="environment" ref={fileInputRef}>`
- Below the textarea (after line 104), add centered scan button with Camera icon + "Scan handwriting" label
- **Guidance overlay**: When scan button tapped, show a modal with the 4 tips in the specified order, plus an "Open Camera" button that triggers the file input
- **Quality check function**: Load image into offscreen canvas, sample pixels, compute average brightness and standard deviation. Thresholds: brightness < 60 = too dark, > 240 = too bright, stddev < 30 = low contrast
- **Warning UI**: If quality check fails, show the warning message with "Retake" and "Use Anyway" buttons
- **Transcription call**: Convert image to base64, call the edge function (or simulate in demo mode), append result to `newBody`
- Show spinner + "Scanning..." state on the button while processing

**File: `src/pages/Index.tsx`**
- No changes needed for the scan feature itself -- the existing `onAddEntry` prop handles saving the final entry. Demo mode simulation will be handled inside JournalTab by checking the `isDemo` context.

**File: `src/components/fbs/JournalTab.tsx` (props update)**
- Add optional `isDemo?: boolean` prop so JournalTab can simulate transcription in demo mode
- Pass `isDemo` from Index.tsx when rendering JournalTab

**Demo mode behavior**:
- When `isDemo` is true, skip the edge function call and return simulated text: "Today I'm grateful for the small moments of peace I found during my morning walk. The sunrise reminded me that each day is a fresh start and that God's mercies are new every morning."
