-- Migration 007: Restore super admin for Priyesh
-- Run in Supabase Dashboard → SQL Editor

INSERT INTO authors (slug, name, email, is_super_admin, initials, color)
VALUES (
  'priyesh-admin',
  'Priyesh',
  'priyesh@scaletrix.ai',
  TRUE,
  'PR',
  '#0f2554'
)
ON CONFLICT (email) DO UPDATE SET
  is_super_admin = TRUE,
  name            = EXCLUDED.name,
  initials        = EXCLUDED.initials,
  color           = EXCLUDED.color;

-- Verify
SELECT slug, name, email, is_super_admin FROM authors WHERE email = 'priyesh@scaletrix.ai';
