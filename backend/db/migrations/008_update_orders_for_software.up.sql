-- Update orders table for software sales
ALTER TABLE orders 
  DROP COLUMN IF EXISTS delivery_date,
  DROP COLUMN IF EXISTS delivery_address,
  ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS license_type VARCHAR(50) CHECK (license_type IN ('trial', 'subscription', 'perpetual', 'enterprise'));

-- Update status values for software sales
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'processing', 'active', 'completed', 'cancelled', 'refunded'));

-- Update order_items table for software sales
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS license_key VARCHAR(255),
  ADD COLUMN IF NOT EXISTS software_version VARCHAR(50),
  ADD COLUMN IF NOT EXISTS license_duration INTEGER, -- in months
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_orders_activation_date ON orders(activation_date);
CREATE INDEX IF NOT EXISTS idx_orders_expiry_date ON orders(expiry_date);
CREATE INDEX IF NOT EXISTS idx_orders_license_type ON orders(license_type);
CREATE INDEX IF NOT EXISTS idx_order_items_license_key ON order_items(license_key);