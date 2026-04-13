-- Migration 014: Add linkedin profile column to authors
-- This allows authors to link their professional profile in the AuthorSpotlight component.

ALTER TABLE authors ADD COLUMN IF NOT EXISTS linkedin TEXT;

-- Update existing static fallback or seed data if needed in the SQL editor:
-- UPDATE authors SET linkedin = 'https://linkedin.com/company/analytixlabs' WHERE slug = 'al-editorial';
