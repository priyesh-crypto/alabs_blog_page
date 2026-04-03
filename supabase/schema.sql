-- AnalytixLabs Blog — Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/tumfgdyurswklrzsnevv/editor

-- ── Authors ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  initials    TEXT,
  color       TEXT,
  bio         TEXT,
  linkedin    TEXT,
  expertise   TEXT[]  DEFAULT '{}',
  experience  TEXT,
  image       TEXT
);

-- ── Posts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id              SERIAL PRIMARY KEY,
  title           TEXT    NOT NULL,
  slug            TEXT    UNIQUE NOT NULL,
  excerpt         TEXT    DEFAULT '',
  content         TEXT    DEFAULT '',
  category        TEXT    DEFAULT '',
  domain_tags     TEXT[]  DEFAULT '{}',
  skill_level     TEXT    DEFAULT 'Beginner',
  read_time       TEXT    DEFAULT '',
  author_id       TEXT    NOT NULL DEFAULT 'al-editorial' REFERENCES authors(slug) ON UPDATE CASCADE,
  image           TEXT    DEFAULT '',
  status          TEXT    DEFAULT 'Published',
  published_at    TEXT    DEFAULT '',
  updated_at      TEXT    DEFAULT '',
  -- Structured metadata stored as JSONB for flexibility
  seo             JSONB   DEFAULT '{}',
  course_mappings TEXT[]  DEFAULT '{}',
  course_cta      TEXT    DEFAULT '',
  newsletter      JSONB   DEFAULT '{}',
  quiz            JSONB   DEFAULT '{}',
  ai_hints        JSONB   DEFAULT '{}',
  trust           JSONB   DEFAULT '{}',
  discussion      JSONB   DEFAULT '{}',
  advanced        JSONB   DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Faster slug lookups
CREATE INDEX IF NOT EXISTS posts_slug_idx       ON posts (slug);
CREATE INDEX IF NOT EXISTS posts_status_idx     ON posts (status);
CREATE INDEX IF NOT EXISTS posts_category_idx   ON posts (category);
CREATE INDEX IF NOT EXISTS posts_domain_tags_idx ON posts USING GIN (domain_tags);

-- ── Row-Level Security ────────────────────────────────────────────
-- Public can read published posts; writes require service-role key
ALTER TABLE posts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE authors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published posts"
  ON posts FOR SELECT USING (status = 'Published');

CREATE POLICY "Public can read authors"
  ON authors FOR SELECT USING (true);

-- Service-role (used by server actions) bypasses RLS automatically
