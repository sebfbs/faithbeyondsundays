
-- 1. Create group_messages table
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- 3. Helper function: check group membership (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id uuid, _group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_group_members
    WHERE user_id = _user_id AND group_id = _group_id
  );
$$;

-- 4. RLS policies for group_messages
CREATE POLICY "Group members can view messages"
  ON public.group_messages FOR SELECT
  USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Group members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Users can delete own messages"
  ON public.group_messages FOR DELETE
  USING (user_id = auth.uid());

-- 5. Create group_chat_acknowledgements table
CREATE TABLE public.group_chat_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  acknowledged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.group_chat_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own acknowledgement"
  ON public.group_chat_acknowledgements FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own acknowledgement"
  ON public.group_chat_acknowledgements FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 6. Enable realtime for group_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- 7. Index for fast message queries
CREATE INDEX idx_group_messages_group_id_created ON public.group_messages(group_id, created_at DESC);
