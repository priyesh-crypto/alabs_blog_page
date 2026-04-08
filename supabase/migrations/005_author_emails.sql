-- Add email to authors table to map Supabase Auth users to author profiles
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- We don't make it strict NOT NULL yet since older authors may not have emails
