CREATE OR REPLACE FUNCTION set_sermon_week_range()
RETURNS trigger AS $$
DECLARE
  dow integer;
  mon date;
BEGIN
  dow := EXTRACT(DOW FROM NEW.sermon_date);
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
$$ LANGUAGE plpgsql
SET search_path = '';