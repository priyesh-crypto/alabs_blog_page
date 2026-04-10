-- Migration 013: Upgrade site_config from flat sidebar_widgets to multi-zone dict
-- Adds a `zones` JSONB column. Migrates existing sidebar_widgets data into
-- zones.article_sidebar. The old sidebar_widgets column is kept for rollback safety.

ALTER TABLE site_config ADD COLUMN IF NOT EXISTS zones JSONB NOT NULL DEFAULT '{}';

-- Migrate existing data: move sidebar_widgets into zones.article_sidebar
UPDATE site_config
SET zones = jsonb_build_object(
  'article_sidebar', COALESCE(sidebar_widgets, '[]'::jsonb),
  'homepage',        '[]'::jsonb,
  'course_page',     '[]'::jsonb,
  'global_footer',   '[]'::jsonb
)
WHERE key = 'global';

-- If no row exists yet, insert the default
INSERT INTO site_config (key, zones, sidebar_widgets, homepage_hero)
VALUES (
  'global',
  '{
    "article_sidebar": [
      {"id":"w-ask-ai","type":"ask_ai","enabled":true,"label":"Ask the AI","config":{}},
      {"id":"w-recommended","type":"recommended_posts","enabled":true,"label":"Recommended Articles","config":{"count":3}},
      {"id":"w-author","type":"author_spotlight","enabled":true,"label":"Author Spotlight","config":{"use_article_author":true}},
      {"id":"w-salary","type":"salary_table","enabled":true,"label":"India DS Salaries","config":{"title":"India DS Salaries","rows":[{"role":"Data Scientist","range":"₹18–28 LPA","meta":"Bangalore · 3-5 yrs","badge":""},{"role":"ML Engineer","range":"₹18–28 LPA","meta":"Mumbai · 2-4 yrs","badge":""},{"role":"Data Analyst","range":"₹10–20 LPA","meta":"Delhi NCR · 0-3 yrs","badge":""}],"cta_label":"Full Salary Report + Calculator →","cta_url":"/salary-hub"}},
      {"id":"w-course","type":"course_card","enabled":true,"label":"Recommended Course","config":{"use_article_match":true,"fallback_title":"Data Science Master Program","fallback_duration":"6 months","fallback_rating":4.8,"cta_label":"Enroll Now →","cta_url":""}}
    ],
    "homepage": [],
    "course_page": [],
    "global_footer": []
  }'::jsonb,
  '[]'::jsonb,
  '{}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
