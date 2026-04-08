-- AnalytixLabs Blog — Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/tumfgdyurswklrzsnevv/editor

-- ── Authors ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS authors (
  slug          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,
  is_super_admin BOOLEAN DEFAULT FALSE,
  initials      TEXT,
  color         TEXT,
  bio           TEXT,
  linkedin      TEXT,
  expertise     TEXT[]  DEFAULT '{}',
  experience    TEXT,
  image         TEXT
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
  alt_text        TEXT    DEFAULT '',
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

-- ── Subscribers ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscribers (
  id              SERIAL PRIMARY KEY,
  email           TEXT    UNIQUE NOT NULL,
  name            TEXT    DEFAULT '',
  source          TEXT    DEFAULT 'newsletter',    -- newsletter | pdf-download | inline
  subscribed_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active       BOOLEAN DEFAULT TRUE
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe (insert); only service-role can read/update
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

-- Public can read all comments
CREATE POLICY "Public can read comments"
  ON comments FOR SELECT USING (true);

-- Anyone can post a comment (insert)
CREATE POLICY "Anyone can post comments"
  ON comments FOR INSERT WITH CHECK (true);

-- Anyone can like (update likes column only — enforced at app level)
CREATE POLICY "Anyone can like comments"
  ON comments FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS comments_post_slug_idx ON comments (post_slug);
CREATE INDEX IF NOT EXISTS comments_parent_idx    ON comments (parent_comment_id);

-- ── Post Versions (revision history) ────────────────────────────
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

ALTER TABLE post_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages versions"
  ON post_versions FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS post_versions_post_id_idx ON post_versions (post_id);
CREATE INDEX IF NOT EXISTS post_versions_version_idx ON post_versions (post_id, version_number);
