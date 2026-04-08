-- Migration 006: Add is_super_admin to authors and grant access to Priyesh

-- 1. Add the columns
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Upsert Priyesh as Super Admin
INSERT INTO authors (slug, name, email, is_super_admin, initials, color)
VALUES (
    'priyesh-admin',
    'Priyesh',
    'priyesh@scaletrix.ai',
    TRUE,
    'PR',
    '#0f2554'
)
ON CONFLICT (slug) DO UPDATE SET 
    email = EXCLUDED.email,
    is_super_admin = TRUE;
