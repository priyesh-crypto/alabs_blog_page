-- Migration 009: Create public uploads storage bucket
-- Run in Supabase Dashboard → SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'uploads',
  'uploads',
  true,
  104857600,  -- 100 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'image/svg+xml', 'image/heic', 'image/heif',
    'video/mp4', 'video/webm', 'video/ogg'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read on all objects in this bucket
CREATE POLICY "Public read uploads"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'uploads');

-- Allow authenticated uploads (service role bypasses this anyway)
CREATE POLICY "Authenticated upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'uploads');
