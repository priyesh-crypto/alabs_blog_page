-- Migration 008: Add missing DB constraints for data integrity
-- Run in Supabase Dashboard → SQL Editor

-- 1. Enforce valid post status values (guard against re-running)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'posts_status_check' AND conrelid = 'posts'::regclass
  ) THEN
    ALTER TABLE posts
      ADD CONSTRAINT posts_status_check
      CHECK (status IN ('Published', 'Draft', 'Scheduled'));
  END IF;
END $$;

-- 2. Case-insensitive unique index on authors.email
CREATE UNIQUE INDEX IF NOT EXISTS authors_email_lower_idx
  ON authors (LOWER(email));

-- 3. Index on posts.author_id for faster author→posts lookups
CREATE INDEX IF NOT EXISTS posts_author_id_idx
  ON posts (author_id);

-- 4. Index on posts.created_at for time-based sorting
CREATE INDEX IF NOT EXISTS posts_created_at_idx
  ON posts (created_at DESC);
