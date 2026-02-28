CREATE OR REPLACE FUNCTION set_sermon_week_range()
RETURNS trigger AS $$
DECLARE
  dow integer;
  mon date;
BEGIN
  dow := EXTRACT(DOW FROM NEW.sermon_date); -- 0=Sun, 6=Sat
  IF dow = 0 THEN
    mon := NEW.sermon_date + 1;
  ELSIF dow = 6 THEN
    mon := NEW.sermon_date + 2;
  ELSE
    mon := NEW.sermon_date - (dow - 1);
  END IF;
  NEW.week_start := mon;
  NEW.week_end := mon + 6;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing sermons with corrected logic
UPDATE sermons
SET sermon_date = sermon_date
WHERE week_start IS NOT NULL OR week_end IS NOT NULL;