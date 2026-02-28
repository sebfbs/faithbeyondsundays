
-- Add week_start and week_end columns
ALTER TABLE public.sermons 
  ADD COLUMN IF NOT EXISTS week_start date,
  ADD COLUMN IF NOT EXISTS week_end date;

-- Create trigger function to auto-compute week range from sermon_date
-- sermon_date is treated as falling within a Mon-Sun week
-- For Sunday dates, we want the NEXT week (Mon after that Sunday)
CREATE OR REPLACE FUNCTION public.set_sermon_week_range()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
DECLARE
  dow int; -- 0=Sun, 1=Mon, ... 6=Sat
  mon date;
BEGIN
  dow := EXTRACT(DOW FROM NEW.sermon_date);
  -- If Sunday (dow=0), the sermon is for the upcoming Mon-Sun week
  IF dow = 0 THEN
    mon := NEW.sermon_date + 1; -- next Monday
  ELSE
    -- For Mon-Sat, find the Monday of the current week
    mon := NEW.sermon_date - (dow - 1);
  END IF;
  NEW.week_start := mon;
  NEW.week_end := mon + 6; -- Sunday
  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_set_sermon_week_range ON public.sermons;
CREATE TRIGGER trg_set_sermon_week_range
  BEFORE INSERT OR UPDATE OF sermon_date ON public.sermons
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sermon_week_range();

-- Backfill existing sermons
UPDATE public.sermons
SET week_start = CASE 
    WHEN EXTRACT(DOW FROM sermon_date) = 0 THEN sermon_date + 1
    ELSE sermon_date - (EXTRACT(DOW FROM sermon_date)::int - 1)
  END,
  week_end = CASE 
    WHEN EXTRACT(DOW FROM sermon_date) = 0 THEN sermon_date + 7
    ELSE sermon_date - (EXTRACT(DOW FROM sermon_date)::int - 1) + 6
  END
WHERE week_start IS NULL;
