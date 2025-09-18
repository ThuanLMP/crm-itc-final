-- Add missing assigned_to column to appointments table
ALTER TABLE appointments ADD COLUMN assigned_to UUID REFERENCES users(id);

-- Fix contact_history table columns to match application logic
ALTER TABLE contact_history RENAME COLUMN author_id TO created_by;
ALTER TABLE contact_history RENAME COLUMN duration_minutes TO duration;
ALTER TABLE contact_history ADD COLUMN subject VARCHAR(255);
ALTER TABLE contact_history ADD COLUMN notes TEXT;
ALTER TABLE contact_history ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
