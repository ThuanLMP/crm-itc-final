-- Migration 012: Update contact_history type constraint to support more values
-- Drop old constraint and add new one with more flexible options

ALTER TABLE contact_history DROP CONSTRAINT IF EXISTS contact_history_type_check;

ALTER TABLE contact_history ADD CONSTRAINT contact_history_type_check 
CHECK (LOWER(type) IN ('call', 'email', 'meeting', 'zalo', 'facebook', 'website', 'other'));