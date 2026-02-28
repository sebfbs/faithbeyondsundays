## Remove YouTube Upload Flow + Add Audio-Only Player Support

### Status: ✅ Complete

All changes implemented:

1. **Database**: Added `media_type` text column to `sermons` table
2. **Admin Upload Form**: Removed YouTube toggle, URL input, and YouTube submit branch. File-upload only now.
3. **Thumbnail Step**: Auto-skips for audio files. Removed YouTube thumbnail logic and `isYoutube` prop.
4. **SermonVideoPlayer**: Added audio detection and styled audio player (gradient card + native `<audio>` controls)
5. **Upload Sermon Edge Function**: Accepts and stores `media_type` parameter
6. **Process Sermon Edge Function**: Removed ~300 lines of YouTube code (Innertube, Cobalt, transcript fetching helpers)
