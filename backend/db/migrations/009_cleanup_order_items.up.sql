-- Remove unused columns from order_items table that were added but not needed
ALTER TABLE order_items
  DROP COLUMN IF EXISTS license_key,
  DROP COLUMN IF EXISTS software_version,
  DROP COLUMN IF EXISTS license_duration,
  DROP COLUMN IF EXISTS max_users;

-- Drop the unused indexes
DROP INDEX IF EXISTS idx_order_items_license_key;