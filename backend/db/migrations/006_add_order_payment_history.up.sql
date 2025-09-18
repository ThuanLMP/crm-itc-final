-- Fix contact_history table to match TypeScript interface
ALTER TABLE contact_history 
ADD COLUMN IF NOT EXISTS subject VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update contact_history to use consistent field names
UPDATE contact_history SET notes = outcome WHERE notes IS NULL AND outcome IS NOT NULL;

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_number VARCHAR(100) UNIQUE NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  order_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_date TIMESTAMPTZ,
  delivery_address TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL, -- Store product name at time of order
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes TEXT
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_number VARCHAR(100) UNIQUE NOT NULL,
  amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'VND',
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other')),
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
  reference_number VARCHAR(255),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_order_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- Generate order numbers function
CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('order_sequence')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Generate payment numbers function
CREATE OR REPLACE FUNCTION generate_payment_number() RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
BEGIN
    new_number := 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('payment_sequence')::TEXT, 4, '0');
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Sequences for order and payment numbers
CREATE SEQUENCE IF NOT EXISTS order_sequence START 1;
CREATE SEQUENCE IF NOT EXISTS payment_sequence START 1;