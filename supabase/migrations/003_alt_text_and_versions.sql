-- Migration 003: Alt text for SEO + Version History
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/tumfgdyurswklrzsnevv/editor

-- ── Add alt_text to posts ─────────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS alt_text TEXT DEFAULT '';

-- ── Post Versions (revision history) ──────────────────────────────
CREATE TABLE IF NOT EXISTS post_versions (
  id              SERIAL PRIMARY KEY,
  post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  title           TEXT    NOT NULL DEFAULT '',
  content         TEXT    DEFAULT '',
  excerpt         TEXT    DEFAULT '',
  category        TEXT    DEFAULT '',
  domain_tags     TEXT[]  DEFAULT '{}',
  skill_level     TEXT    DEFAULT 'Beginner',
  image           TEXT    DEFAULT '',
  alt_text        TEXT    DEFAULT '',
  seo             JSONB   DEFAULT '{}',
  course_mappings TEXT[]  DEFAULT '{}',
  course_cta      TEXT    DEFAULT '',
  newsletter      JSONB   DEFAULT '{}',
  quiz            JSONB   DEFAULT '{}',
  ai_hints        JSONB   DEFAULT '{}',
  trust           JSONB   DEFAULT '{}',
  discussion      JSONB   DEFAULT '{}',
  advanced        JSONB   DEFAULT '{}',
  updated_by      TEXT    DEFAULT 'al-editorial',
  version_number  INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS post_versions_post_id_idx ON post_versions (post_id);
CREATE INDEX IF NOT EXISTS post_versions_version_idx ON post_versions (post_id, version_number);

-- RLS (service-role bypass; no public read needed)
ALTER TABLE post_versions ENABLE ROW LEVEL SECURITY;

-- Allow service role to do everything (it bypasses RLS automatically)
-- Studio reads via server actions only
CREATE POLICY "Service role manages versions"
  ON post_versions FOR ALL USING (true);
