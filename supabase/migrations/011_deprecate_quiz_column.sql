-- Migration 011: Deprecate legacy sidebar quiz column
--
-- Context: Quiz/knowledge-check creation has been moved to inline Tiptap widget
-- nodes stored in the post `content` column. The top-level `quiz` JSONB column
-- previously held sidebar-configured questions and is no longer written to by
-- the application.
--
-- Strategy: We rename the column rather than DROP it immediately so that any
-- existing quiz data is preserved and recoverable. A future migration can drop
-- the column once the team confirms no data recovery is needed.
--
-- If you prefer a hard drop instead, replace the ALTER TABLE ... RENAME lines
-- with: ALTER TABLE posts DROP COLUMN IF EXISTS quiz;
--       ALTER TABLE post_versions DROP COLUMN IF EXISTS quiz;

ALTER TABLE posts
  RENAME COLUMN quiz TO quiz_legacy;

ALTER TABLE post_versions
  RENAME COLUMN quiz TO quiz_legacy;

-- Add a comment so the column purpose is clear in any DB inspection tool.
COMMENT ON COLUMN posts.quiz_legacy IS
  'DEPRECATED — legacy sidebar Knowledge Check data. Quiz widgets now live inline in the content column as Tiptap nodes. This column is no longer written to. Safe to drop after confirming no data recovery is needed.';

COMMENT ON COLUMN post_versions.quiz_legacy IS
  'DEPRECATED — legacy sidebar Knowledge Check snapshot. See posts.quiz_legacy for context.';
