-- Add position column to authors table
ALTER TABLE authors ADD COLUMN IF NOT EXISTS position TEXT;
