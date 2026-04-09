-- ── Courses table ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  label       text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  image       text NOT NULL DEFAULT '',
  url         text NOT NULL DEFAULT '#',
  duration    text NOT NULL DEFAULT '',
  rating      numeric(3,1) DEFAULT 4.5,
  domain_tags text[] DEFAULT '{}',
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_courses_updated_at();

-- RLS: anyone can read active courses; only service role can write
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses_public_read"
  ON courses FOR SELECT
  USING (is_active = true);

-- ── Site Config table (key-value store for admin-managed globals) ──
CREATE TABLE IF NOT EXISTS site_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_config_public_read"
  ON site_config FOR SELECT
  USING (true);

-- Seed default topics
INSERT INTO site_config (key, value)
VALUES (
  'topics',
  '["Machine Learning","Data Science","Engineering","Career Growth","Deep Learning","Analytics","AI Engineering","Business Analyst"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Seed default courses from static data.js
INSERT INTO courses (title, label, description, image, url, duration, rating, domain_tags, sort_order)
VALUES
  (
    'Data Science Specialization',
    'Specialization',
    'Master Python, SQL, and predictive modeling with real-world industry capstones.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCh8ivFg8VBjm2zpSqFnI-3MkdXemZRSmKL2fjdyxcBS8zcU2-UO7L4MgVMkbcKU7QeMp3AqnZyLnQMcFIVIDy-nOePtrXzxxBb-dIcantQaJlGrtdaim5JYD9yWkTTplcGh1YMilpDaNpYC3dURy4WxcN0XHtCOyLrIOITJbAnk1suzP0SV1aXc6H3_N4wxno_E7HfrPo399y67upgN34RsH2sZgD2ZRpy-IB5AiUXzj8CXMgxrqdKopbcQjvx_VNVXcXoInX2wlSG',
    '#',
    '6 months',
    4.8,
    ARRAY['Statistics','Python','Machine Learning'],
    0
  ),
  (
    'Machine Learning Mastery',
    'Advanced',
    'Deep dive into neural networks, reinforcement learning, and advanced algorithms.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCwHYUYKnycf2FxVMoMCwQ1UgZgFyXDw8j_lUAbdLeOtbVyqvKgCAj_9A4FbNSI_SCYRy9wt--t0aRl_dUOO9YxKorbLZ4y6AxJFXAkA3CcgxkLwIOAXVLnNgvbeI7RaERrw0KGpDug9OZVgDwzno0OEQ6TrcqtPAgu_sHsjWmEwHiCaJtigft21XzPpMDMA8xuf2W5vW-g-36ROGFSPY7HTTEaRHDv93wFbGeaUkAS_p5GOysPBVryKY1hp_pFwOBRVP2Fwbe3Y41X',
    '#',
    '4 months',
    4.7,
    ARRAY['Deep Learning','Generative AI','PyTorch'],
    1
  ),
  (
    'AI Engineering',
    'Engineering',
    'Build and deploy large-scale AI applications using modern RAG and LLM stacks.',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCRG-_Ndw0YrduOsgmsEJX_Jm6TR75Ghzm5RN42hzi5WzxAtIWIMEmQWKMhxdA2yLswwhqDOOt5qWJvLsRRcZ1KFCxAWb7559VQIkaC5hFUjsKiQ_lq33vk-a-nRYYkIoXe30BuU8B6HIhXbsgE7eUNcrpzEvnl4QHQNSUYsY-tn5MvhnDXDVwQKmYyw_YWkOVOO5RSEpGsI0zdiNdkAOlNxZERYHt34IrTHdrZc7QKenh9t4Yxcx3Kvkxbht8V-qBJqfwXHIYWftur',
    '#',
    '5 months',
    4.9,
    ARRAY['MLOps','Data Engineering','Generative AI'],
    2
  )
ON CONFLICT DO NOTHING;
