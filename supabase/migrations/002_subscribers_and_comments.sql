-- Migration: Add subscribers and comments tables
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/tumfgdyurswklrzsnevv/editor

-- ── Subscribers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id              SERIAL PRIMARY KEY,
  email           TEXT    UNIQUE NOT NULL,
  name            TEXT    DEFAULT '',
  source          TEXT    DEFAULT 'newsletter',
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active       BOOLEAN DEFAULT TRUE
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON subscribers FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role reads subscribers"
  ON subscribers FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS subscribers_email_idx ON subscribers (email);

-- ── Comments ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id                  SERIAL PRIMARY KEY,
  post_slug           TEXT    NOT NULL,
  parent_comment_id   INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  user_name           TEXT    NOT NULL DEFAULT 'Anonymous',
  text                TEXT    NOT NULL,
  likes               INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read comments"
  ON comments FOR SELECT USING (true);

CREATE POLICY "Anyone can post comments"
  ON comments FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can like comments"
  ON comments FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON comments (post_slug);
CREATE INDEX IF NOT EXISTS comments_parent_idx    ON comments (parent_comment_id);
