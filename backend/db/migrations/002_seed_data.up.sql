-- Insert Vietnam provinces
INSERT INTO provinces (name, code) VALUES
('An Giang', 'AG'), ('Bà Rịa - Vũng Tàu', 'BR-VT'), ('Bắc Giang', 'BG'), ('Bắc Kạn', 'BK'),
('Bạc Liêu', 'BL'), ('Bắc Ninh', 'BN'), ('Bến Tre', 'BT'), ('Bình Định', 'BD'),
('Bình Dương', 'BDG'), ('Bình Phước', 'BP'), ('Bình Thuận', 'BTH'), ('Cà Mau', 'CM'),
('Cao Bằng', 'CB'), ('Đắk Lắk', 'DL'), ('Đắk Nông', 'DNG'), ('Điện Biên', 'DB'),
('Đồng Nai', 'DNA'), ('Đồng Tháp', 'DT'), ('Gia Lai', 'GL'), ('Hà Giang', 'HG'),
('Hà Nam', 'HNA'), ('Hà Tĩnh', 'HT'), ('Hải Dương', 'HD'), ('Hậu Giang', 'HGG'),
('Hòa Bình', 'HB'), ('Hưng Yên', 'HY'), ('Khánh Hòa', 'KH'), ('Kiên Giang', 'KG'),
('Kon Tum', 'KT'), ('Lai Châu', 'LC'), ('Lâm Đồng', 'LDG'), ('Lạng Sơn', 'LS'),
('Lào Cai', 'LCA'), ('Long An', 'LA'), ('Nam Định', 'ND'), ('Nghệ An', 'NA'),
('Ninh Bình', 'NB'), ('Ninh Thuận', 'NT'), ('Phú Thọ', 'PT'), ('Quảng Bình', 'QB'),
('Quảng Nam', 'QN'), ('Quảng Ngãi', 'QNG'), ('Quảng Ninh', 'QNI'), ('Quảng Trị', 'QT'),
('Sóc Trăng', 'ST'), ('Sơn La', 'SL'), ('Tây Ninh', 'TN'), ('Thái Bình', 'TB'),
('Thái Nguyên', 'TNG'), ('Thanh Hóa', 'TH'), ('Thừa Thiên Huế', 'TTH'), ('Tiền Giang', 'TG'),
('Trà Vinh', 'TV'), ('Tuyên Quang', 'TQ'), ('Vĩnh Long', 'VL'), ('Vĩnh Phúc', 'VP'),
('Yên Bái', 'YB'), ('Phú Yên', 'PY'), ('Cần Thơ', 'CT'), ('Đà Nẵng', 'DN'),
('Hải Phòng', 'HP'), ('Hà Nội', 'HN'), ('TP Hồ Chí Minh', 'HCM');

-- Insert default master data
INSERT INTO customer_types (name) VALUES 
('Individual'), ('Business'), ('Enterprise'), ('Government');

INSERT INTO business_types (name) VALUES 
('Manufacturing'), ('Technology'), ('Healthcare'), ('Education'), ('Finance'), ('Retail'), ('Services');

INSERT INTO products (name) VALUES 
('CRM Software'), ('ERP System'), ('Mobile App'), ('Web Development'), ('Consulting');

INSERT INTO lead_sources (name) VALUES 
('Website'), ('Referral'), ('Cold Call'), ('Email Campaign'), ('Social Media'), ('Trade Show'), ('Advertisement');

INSERT INTO stages (name) VALUES 
('Nurturing'), ('Quoted'), ('Considering'), ('Purchased');

INSERT INTO contact_statuses (name) VALUES 
('New'), ('Contacted'), ('Qualified'), ('Proposal Sent'), ('Negotiating'), ('Closed Won'), ('Closed Lost');

INSERT INTO temperatures (name) VALUES 
('Cold'), ('Warm'), ('Hot');

INSERT INTO company_sizes (name) VALUES 
('1-10 employees'), ('11-50 employees'), ('51-200 employees'), ('201-500 employees'), ('500+ employees');

-- Insert default users with properly hashed passwords
-- admin123 -> $2a$10$ZKCBOZkqmLqPE4qjNqfTtuTl5MHpWIo7eCZOLnqWZTHgB2UzHSL.6
-- employee123 -> $2a$10$A1ZMC8zS3qLTKHT1VfJxLO5nZhLsX6Y9Dz5OgNhQEr2T8fXzB6gK2
INSERT INTO users (email, name, phone, password, role) VALUES 
('admin@crm.com', 'Quản trị viên hệ thống', '+84901234567', '$2a$10$ZKCBOZkqmLqPE4qjNqfTtuTl5MHpWIo7eCZOLnqWZTHgB2UzHSL.6', 'admin'),
('employee@crm.com', 'Nhân viên bán hàng', '+84987654321', '$2a$10$A1ZMC8zS3qLTKHT1VfJxLO5nZhLsX6Y9Dz5OgNhQEr2T8fXzB6gK2', 'employee');
