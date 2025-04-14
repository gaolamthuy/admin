-- SQL script to create required tables for Gao Lam Thuy POS
-- You can run these SQL commands in your Supabase SQL Editor

-- 1. Create the products table
CREATE TABLE IF NOT EXISTS public.kiotviet_products (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT UNIQUE NOT NULL,
  code VARCHAR(255),
  name VARCHAR(255),
  full_name TEXT,
  category_id BIGINT,
  category_name VARCHAR(255),
  base_price NUMERIC(20, 6),
  unit VARCHAR(255)
);

-- 2. Create the customers table
CREATE TABLE IF NOT EXISTS public.kiotviet_customers (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT UNIQUE NOT NULL,
  code TEXT,
  name TEXT,
  contact_number TEXT,
  location_name TEXT
);

-- 3. Create the branches table
CREATE TABLE IF NOT EXISTS public.kiotviet_branches (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  address TEXT
);

-- 4. Create the staff table
CREATE TABLE IF NOT EXISTS public.kiotviet_staff (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT UNIQUE NOT NULL,
  name TEXT,
  code TEXT
);

-- 5. Create the system table for settings
CREATE TABLE IF NOT EXISTS public.system (
  id BIGSERIAL PRIMARY KEY,
  title TEXT UNIQUE NOT NULL,
  value TEXT
);

-- Insert a placeholder for the KiotViet token (REPLACE with your actual token!)
INSERT INTO public.system (title, value) 
VALUES ('kiotviet', 'YOUR_KIOTVIET_TOKEN_HERE')
ON CONFLICT (title) 
DO UPDATE SET value = EXCLUDED.value;

-- Create some sample data for testing
-- Sample branch
INSERT INTO public.kiotviet_branches (kiotviet_id, name, address) 
VALUES (15132, 'Gao Lam Thuy', '234 Tô Hiệu, P.Hiệp Tân, Q.Tân Phú')
ON CONFLICT (kiotviet_id) 
DO NOTHING;

-- Sample staff
INSERT INTO public.kiotviet_staff (kiotviet_id, name, code) 
VALUES (28310, 'Admin', 'ADMIN')
ON CONFLICT (kiotviet_id) 
DO NOTHING;

-- Sample customer
INSERT INTO public.kiotviet_customers (kiotviet_id, code, name, contact_number, location_name) 
VALUES (898547, 'KH001', 'Khách Hàng Mẫu', '0123456789', 'Hồ Chí Minh')
ON CONFLICT (kiotviet_id) 
DO NOTHING;

-- Sample products
INSERT INTO public.kiotviet_products (kiotviet_id, code, name, full_name, category_id, category_name, base_price, unit) 
VALUES 
(1001, 'GD001', 'Gạo Nàng Hương', 'Gạo Nàng Hương Cao Cấp', 101, 'gạo dẻo', 20000, 'kg'),
(1002, 'GD002', 'Gạo ST25', 'Gạo ST25 Đặc Sản', 101, 'gạo dẻo', 35000, 'kg'),
(1003, 'GN001', 'Gạo Tài Nguyên', 'Gạo Tài Nguyên Miền Tây', 102, 'gạo nở', 18000, 'kg'),
(1004, 'GTH001', 'Gạo Jasmine', 'Gạo Jasmine Thái Lan', 103, 'gạo thương hiệu', 25000, 'kg'),
(1005, 'GL001', 'Gạo Lứt', 'Gạo Lứt Hữu Cơ', 104, 'lúa, gạo lứt', 28000, 'kg'),
(1006, 'T001', 'Tấm Thơm', 'Tấm Gạo Thơm', 105, 'tấm', 12000, 'kg'),
(1007, 'N001', 'Nếp Cái Hoa Vàng', 'Nếp Cái Hoa Vàng', 106, 'nếp', 30000, 'kg'),
(1008, 'K001', 'Gạo Tám Xoan', 'Gạo Tám Xoan Hải Hậu', 107, 'khác', 40000, 'kg')
ON CONFLICT (kiotviet_id) 
DO NOTHING;

-- Add necessary privileges
ALTER TABLE public.kiotviet_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiotviet_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiotviet_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiotviet_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system ENABLE ROW LEVEL SECURITY;

-- Create policies to allow access
CREATE POLICY "Allow full access to authenticated users" ON public.kiotviet_products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow full access to authenticated users" ON public.kiotviet_customers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow full access to authenticated users" ON public.kiotviet_branches
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow full access to authenticated users" ON public.kiotviet_staff
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
  
CREATE POLICY "Allow full access to authenticated users" ON public.system
  FOR ALL TO authenticated USING (true) WITH CHECK (true); 