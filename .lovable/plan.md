

## Community Groups with Group Chat

### Overview
Connect the admin-created groups (like "Men's Group", "Married Couples") to the member-facing Community page. Members can browse groups, join/leave them, see other members, and chat within groups. Group chat will NOT send push notifications -- only in-app unread indicators.

### What Members Will See

**On the Community page** (between the Church card and Church Members list):
- A "Groups" section showing cards for each active group
- Each card shows: group name, description snippet, member count, and a "Join" or "Joined" badge
- Tapping a group opens a Group Detail screen

**Group Detail screen:**
- Group name, description, member count
- Join/Leave button
- Member list (avatars + names)
- Group Chat tab -- a simple message feed within the group
- Community guidelines reminder popup shown once when a user first sends a message

**Group Chat behavior:**
- No push notifications by default -- just an unread dot/badge on the group card
- Simple message feed: text messages with sender name, avatar, timestamp
- A gentle community guidelines reminder the first time a user sends a message in any group chat
- Messages are only visible to group members

### Database Changes

**1. New table: `group_messages`**
- `id` (uuid, PK)
- `group_id` (uuid, FK to community_groups)
- `user_id` (uuid, not null)
- `content` (text, not null)
- `created_at` (timestamptz, default now())

**2. RLS policies on `group_messages`:**
- SELECT: User must be a member of the group (`EXISTS` check on `community_group_members`)
- INSERT: User must be a member of the group AND `user_id = auth.uid()`
- DELETE: `user_id = auth.uid()` (users can delete their own messages)

**3. Enable realtime** on `group_messages` so chat updates live

**4. New table: `group_chat_acknowledgements`** (tracks if user has seen the guidelines popup)
- `id` (uuid, PK)
- `user_id` (uuid, not null)
- `acknowledged_at` (timestamptz, default now())
- Unique on `user_id`
- RLS: users can read/insert their own row

### Frontend Changes

**1. Update `CommunityScreen.tsx`**
- Add query for `community_groups` (filtered to user's church, `is_active = true`)
- Add query for `community_group_members` to get user's memberships and member counts
- Render a "Groups" section with horizontal scrollable group cards between Church card and Church Members
- Each card shows name, member count, and Joined/Join indicator

**2. New component: `GroupDetailSheet.tsx`**
- Bottom drawer that opens when tapping a group
- Two sections: "Members" tab and "Chat" tab
- Members tab: list of group members with avatars, names
- Chat tab: scrollable message feed with text input at bottom
- Join/Leave button in the header
- If user is not a member, show a "Join to chat" prompt instead of the chat input

**3. New component: `GroupChat.tsx`**
- Message feed using realtime subscription on `group_messages`
- Text input with send button
- Messages show sender avatar, name, timestamp
- Auto-scroll to bottom on new messages
- On first message attempt, check `group_chat_acknowledgements` -- if no row exists, show a friendly guidelines dialog before sending

**4. New component: `CommunityGuidelinesDialog.tsx`**
- Friendly popup: "Welcome to group chat! This is a place to connect, encourage, and support each other. Please keep conversations uplifting and respectful."
- Single "I Agree" button that inserts into `group_chat_acknowledgements` and then sends the message

### Admin Side
- No changes needed to `AdminGroups.tsx` -- it already creates/manages groups
- Admins will see member counts update as people join

### No Push Notifications
- Group chat messages will NOT trigger any push notifications
- Unread state will be tracked client-side only (simple: compare last message timestamp vs last time user opened that group chat, stored in localStorage)

