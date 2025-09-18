-- Migration 007: Additional fixes for contact_history table
-- Note: Migration 004 already renamed author_id to created_by and duration_minutes to duration

-- Ensure all columns exist (some may already exist from migration 004)
ALTER TABLE contact_history ADD COLUMN IF NOT EXISTS subject VARCHAR(255);
ALTER TABLE contact_history ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE contact_history ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Update existing records to have proper values
UPDATE contact_history 
SET 
  notes = COALESCE(notes, outcome, ''),
  updated_at = COALESCE(updated_at, created_at, now())
WHERE notes IS NULL OR updated_at IS NULL;

-- Add useful indexes
CREATE INDEX IF NOT EXISTS idx_contact_history_subject ON contact_history(subject);
CREATE INDEX IF NOT EXISTS idx_contact_history_updated_at ON contact_history(updated_at);
CREATE INDEX IF NOT EXISTS idx_contact_history_type ON contact_history(type);
CREATE INDEX IF NOT EXISTS idx_contact_history_created_by ON contact_history(created_by);