

# Fix Daily Spark Styling — Remove Quote Formatting

## Problem

The "Today's Spark" content is AI-generated reflection based on sermon themes, not a direct quote from anyone. But the current UI wraps it in quotation marks and italicizes it, which visually implies it's a direct quote. This is misleading and doesn't match the content's nature.

## Solution

Remove the quotation marks and italic styling from both spark display locations (churchless/independent users and churched users). Replace with clean, standard body text that feels like shared wisdom rather than a citation.

## Changes

**File: `src/components/fbs/HomeTab.tsx`**

Two locations need updating:

1. **Churchless user spark** (around line 274-276): Remove the wrapping `"..."` and the `italic` class from the paragraph styling.

2. **Churched user spark** (around line 390-392): Same change — remove `"..."` wrapping and `italic` class.

Both will go from:
```
<p className="... italic">"{sparkText}"</p>
```
To:
```
<p className="...">{sparkText}</p>
```

That's it — one file, two lines changed.
