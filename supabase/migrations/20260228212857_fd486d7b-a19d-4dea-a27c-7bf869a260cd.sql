-- Clean up bad data for the sermon that had no transcript
-- Delete the placeholder transcript so it gets re-fetched
DELETE FROM public.sermon_transcripts 
WHERE sermon_id = 'c93da321-8ea0-4aa2-b580-43a155973d37';

-- Delete the bad AI content (empty scriptures, 1-chapter result)
DELETE FROM public.sermon_content 
WHERE sermon_id = 'c93da321-8ea0-4aa2-b580-43a155973d37';

-- Reset sermon status to pending
UPDATE public.sermons 
SET status = 'pending' 
WHERE id = 'c93da321-8ea0-4aa2-b580-43a155973d37';

-- Re-queue the job
UPDATE public.sermon_jobs 
SET status = 'queued', 
    attempts = 0, 
    error_message = NULL, 
    error_details = NULL, 
    started_at = NULL, 
    completed_at = NULL, 
    failed_at = NULL, 
    locked_until = NULL, 
    worker_id = NULL
WHERE sermon_id = 'c93da321-8ea0-4aa2-b580-43a155973d37';