-- Normalize existing usernames to lowercase
UPDATE profiles SET username = lower(username) WHERE username IS DISTINCT FROM lower(username);

-- Add CHECK constraint to enforce lowercase usernames
ALTER TABLE profiles ADD CONSTRAINT username_lowercase CHECK (username = lower(username));