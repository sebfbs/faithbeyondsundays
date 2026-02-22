
-- profiles: make church_id nullable and change to SET NULL
ALTER TABLE public.profiles ALTER COLUMN church_id DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT profiles_church_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;

-- journal_entries: make church_id nullable and change to SET NULL
ALTER TABLE public.journal_entries ALTER COLUMN church_id DROP NOT NULL;
ALTER TABLE public.journal_entries DROP CONSTRAINT journal_entries_church_id_fkey;
ALTER TABLE public.journal_entries ADD CONSTRAINT journal_entries_church_id_fkey FOREIGN KEY (church_id) REFERENCES public.churches(id) ON DELETE SET NULL;
