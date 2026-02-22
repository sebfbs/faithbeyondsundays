-- Increase max_attempts default to 5 and add a retry_after column for backoff
ALTER TABLE public.sermon_jobs ALTER COLUMN max_attempts SET DEFAULT 5;

-- Update any existing jobs that still have the old default
UPDATE public.sermon_jobs SET max_attempts = 5 WHERE max_attempts = 3;
