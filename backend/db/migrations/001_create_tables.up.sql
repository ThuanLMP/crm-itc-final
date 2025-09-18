-- Users and Roles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL DEFAULT 'password123', -- Default password, should be changed
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Master Data Tables
CREATE TABLE customer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contact_statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE temperatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE company_sizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vietnam Provinces
CREATE TABLE provinces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL UNIQUE
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  company_name VARCHAR(255),
  customer_type_id UUID REFERENCES customer_types(id),
  business_type_id UUID REFERENCES business_types(id),
  company_size_id UUID REFERENCES company_sizes(id),
  province_id UUID REFERENCES provinces(id),
  city VARCHAR(255),
  lead_source_id UUID REFERENCES lead_sources(id),
  assigned_salesperson_id UUID REFERENCES users(id),
  stage_id UUID REFERENCES stages(id),
  temperature_id UUID REFERENCES temperatures(id),
  contact_status_id UUID REFERENCES contact_statuses(id),
  customer_feedback TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Customer Products (many-to-many)
CREATE TABLE customer_products (
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  PRIMARY KEY (customer_id, product_id)
);

-- Contact History
CREATE TABLE contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'zalo', 'other')),
  author_id UUID REFERENCES users(id),
  duration_minutes INTEGER,
  outcome TEXT,
  next_step TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled')),
  reminder_minutes INTEGER[] DEFAULT '{10, 60}',
  repeat_rule VARCHAR(50),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(255) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(255),
  old_value TEXT,
  new_value TEXT,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_customers_assigned_salesperson ON customers(assigned_salesperson_id);
CREATE INDEX idx_customers_stage ON customers(stage_id);
CREATE INDEX idx_customers_temperature ON customers(temperature_id);
CREATE INDEX idx_customers_created_at ON customers(created_at);
CREATE INDEX idx_customers_updated_at ON customers(updated_at);
CREATE INDEX idx_customers_deleted_at ON customers(deleted_at);
CREATE INDEX idx_contact_history_customer ON contact_history(customer_id);
CREATE INDEX idx_contact_history_created_at ON contact_history(created_at);
CREATE INDEX idx_appointments_customer ON appointments(customer_id);
CREATE INDEX idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
