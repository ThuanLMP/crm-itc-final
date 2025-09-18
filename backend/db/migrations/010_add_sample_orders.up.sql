-- Insert sample customers for testing orders
INSERT INTO customers (
  id,
  name,
  email,
  phone,
  company_name,
  address,
  city,
  notes,
  customer_type_id,
  business_type_id,
  company_size_id,
  province_id,
  lead_source_id,
  stage_id,
  contact_status_id,
  temperature_id,
  assigned_salesperson_id,
  created_by,
  updated_by
)
SELECT 
  gen_random_uuid(),
  'Công ty TNHH ABC Tech',
  'contact@abctech.vn',
  '+84901111111',
  'ABC Technology Solutions',
  '123 Đường Nguyễn Huệ',
  'TP. Hồ Chí Minh',
  'Khách hàng mẫu cho testing orders',
  ct.id,
  bt.id,
  cs.id,
  p.id,
  ls.id,
  s.id,
  css.id,
  t.id,
  u.id,
  u.id,
  u.id
FROM customer_types ct, business_types bt, company_sizes cs, provinces p, 
     lead_sources ls, stages s, contact_statuses css, temperatures t, users u
WHERE ct.name = 'Business'
  AND bt.name = 'Technology'
  AND cs.name = '11-50 employees'
  AND p.name = 'TP Hồ Chí Minh'
  AND ls.name = 'Website'
  AND s.name = 'Purchased'
  AND css.name = 'Closed Won'
  AND t.name = 'Hot'
  AND u.role = 'admin'
LIMIT 1;

INSERT INTO customers (
  id,
  name,
  email,
  phone,
  company_name,
  address,
  city,
  notes,
  customer_type_id,
  business_type_id,
  company_size_id,
  province_id,
  lead_source_id,
  stage_id,
  contact_status_id,
  temperature_id,
  assigned_salesperson_id,
  created_by,
  updated_by
)
SELECT 
  gen_random_uuid(),
  'Trường Đại học XYZ',
  'it@university-xyz.edu.vn',
  '+84902222222',
  'Đại học XYZ',
  '456 Đường Lê Lợi',
  'Hà Nội',
  'Khách hàng giáo dục mẫu',
  ct.id,
  bt.id,
  cs.id,
  p.id,
  ls.id,
  s.id,
  css.id,
  t.id,
  u.id,
  u.id,
  u.id
FROM customer_types ct, business_types bt, company_sizes cs, provinces p, 
     lead_sources ls, stages s, contact_statuses css, temperatures t, users u
WHERE ct.name = 'Enterprise'
  AND bt.name = 'Education'
  AND cs.name = '201-500 employees'
  AND p.name = 'Hà Nội'
  AND ls.name = 'Referral'
  AND s.name = 'Purchased'
  AND css.name = 'Closed Won'
  AND t.name = 'Warm'
  AND u.role = 'admin'
LIMIT 1;

-- Insert sample orders for testing
-- Note: Make sure customers and products exist before running this

-- Sample order 1
INSERT INTO orders (
  id,
  customer_id, 
  order_number, 
  total_amount, 
  currency, 
  status, 
  order_date,
  activation_date,
  license_type,
  notes,
  created_by,
  updated_by
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'ORD-SAMPLE-001',
  5000000.00,
  'VND',
  'active',
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '5 days',
  'subscription',
  'Đơn hàng mẫu cho testing',
  u.id,
  u.id
FROM customers c, users u 
WHERE c.company_name = 'ABC Technology Solutions'
AND u.role = 'admin'
LIMIT 1;

-- Sample order 2  
INSERT INTO orders (
  id,
  customer_id,
  order_number,
  total_amount,
  currency,
  status,
  order_date,
  activation_date,
  expiry_date,
  license_type,
  notes,
  created_by,
  updated_by
)
SELECT 
  gen_random_uuid(),
  c.id,
  'ORD-SAMPLE-002', 
  12000000.00,
  'VND',
  'completed',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '28 days',
  NOW() + INTERVAL '335 days',
  'perpetual',
  'Đơn hàng license vĩnh viễn',
  u.id,
  u.id
FROM customers c, users u
WHERE c.company_name = 'Đại học XYZ'
AND u.role = 'admin'
LIMIT 1;

-- Insert sample order items
-- For order 1
INSERT INTO order_items (
  id,
  order_id,
  product_id,
  product_name,
  quantity,
  unit_price,
  total_price,
  notes
)
SELECT 
  gen_random_uuid(),
  o.id,
  p.id,
  p.name,
  2,
  2500000.00,
  5000000.00,
  'License cho 2 users'
FROM orders o, products p
WHERE o.order_number = 'ORD-SAMPLE-001'
AND p.active = true
LIMIT 1;

-- For order 2  
INSERT INTO order_items (
  id,
  order_id,
  product_id,
  product_name,
  quantity,
  unit_price,
  total_price,
  notes
)
SELECT 
  gen_random_uuid(),
  o.id,
  p.id,
  p.name,
  1,
  12000000.00,
  12000000.00,
  'License doanh nghiệp'
FROM orders o, products p
WHERE o.order_number = 'ORD-SAMPLE-002'
AND p.active = true
AND p.id != (SELECT product_id FROM order_items oi JOIN orders ord ON oi.order_id = ord.id WHERE ord.order_number = 'ORD-SAMPLE-001' LIMIT 1)
LIMIT 1;