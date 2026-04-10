-- Migration 012: site_config — singleton table for global layout settings
--
-- Stores the ordered list of right-sidebar widgets and (future) homepage hero
-- config. Only one row exists (key = 'global'). Writes require the service-role
-- key (bypasses RLS); public reads are permitted so SSR pages can fetch it.

CREATE TABLE IF NOT EXISTS site_config (
  key              TEXT PRIMARY KEY DEFAULT 'global',
  sidebar_widgets  JSONB NOT NULL DEFAULT '[]',
  homepage_hero    JSONB NOT NULL DEFAULT '{}',
  updated_at       TEXT  DEFAULT '',
  updated_by       TEXT  DEFAULT 'system'
);

-- ── Default singleton row ─────────────────────────────────────────
-- Only inserted on first run; subsequent migrations leave existing data intact.
INSERT INTO site_config (key, sidebar_widgets, homepage_hero) VALUES (
  'global',
  '[
    {
      "id": "w-ask-ai",
      "type": "ask_ai",
      "enabled": true,
      "label": "Ask the AI",
      "config": {}
    },
    {
      "id": "w-recommended",
      "type": "recommended_posts",
      "enabled": true,
      "label": "Recommended Articles",
      "config": { "count": 3 }
    },
    {
      "id": "w-author",
      "type": "author_spotlight",
      "enabled": true,
      "label": "Author Spotlight",
      "config": { "use_article_author": true }
    },
    {
      "id": "w-salary",
      "type": "salary_table",
      "enabled": true,
      "label": "India DS Salaries",
      "config": {
        "title": "India DS Salaries",
        "rows": [
          { "role": "Data Scientist", "range": "₹18–28 LPA", "meta": "Bangalore · 3-5 yrs", "badge": "" },
          { "role": "ML Engineer",    "range": "₹18–28 LPA", "meta": "Mumbai · 2-4 yrs",    "badge": "" },
          { "role": "Data Analyst",   "range": "₹10–20 LPA", "meta": "Delhi NCR · 0-3 yrs", "badge": "" },
          { "role": "AI Researcher",  "range": "₹18–28 LPA", "meta": "Pan India · 6+ yrs",  "badge": "New" }
        ],
        "cta_label": "Full Salary Report + Calculator →",
        "cta_url": "/salary-hub"
      }
    },
    {
      "id": "w-course",
      "type": "course_card",
      "enabled": true,
      "label": "Recommended Course",
      "config": {
        "use_article_match": true,
        "fallback_title": "Data Science Master Program",
        "fallback_duration": "6 months",
        "fallback_rating": 4.8,
        "cta_label": "Enroll Now →",
        "cta_url": ""
      }
    }
  ]',
  '{}'
) ON CONFLICT (key) DO NOTHING;

-- ── Row-Level Security ────────────────────────────────────────────
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Public (and SSR pages) can read the config
CREATE POLICY "Public read site_config"
  ON site_config FOR SELECT USING (true);

-- Writes happen only via the service-role key (bypasses RLS) from the studio API
-- No explicit INSERT/UPDATE policy needed — service-role bypasses all policies.
