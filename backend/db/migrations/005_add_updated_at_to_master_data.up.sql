-- Add updated_at column to all master data tables
ALTER TABLE customer_types ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE business_types ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE products ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE lead_sources ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE stages ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE contact_statuses ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE temperatures ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE company_sizes ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
