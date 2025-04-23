-- CUSTOMER TABLE
DROP TABLE IF EXISTS public.kv_customers CASCADE;
CREATE TABLE public.kv_customers (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT NOT NULL UNIQUE,
  code TEXT,
  name TEXT,
  retailer_id BIGINT,
  branch_id BIGINT,
  location_name TEXT,
  ward_name TEXT,
  modified_date TIMESTAMP,
  created_date TIMESTAMP,
  type INTEGER,
  groups TEXT,
  debt NUMERIC(12,4),
  contact_number TEXT,
  comments TEXT,
  address TEXT,
  synced_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kv_customers_kiotviet_id ON public.kv_customers (kiotviet_id);

-- PRODUCT TABLE
DROP TABLE IF EXISTS public.kv_products CASCADE;
CREATE TABLE public.kv_products (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT NOT NULL UNIQUE,
  retailer_id BIGINT,
  code VARCHAR(255),
  bar_code VARCHAR(255),
  name VARCHAR(255),
  full_name VARCHAR(255),
  category_id BIGINT,
  category_name VARCHAR(255),
  allows_sale BOOLEAN,
  type INTEGER,
  has_variants BOOLEAN,
  base_price NUMERIC(20,6),
  weight NUMERIC(20,6),
  unit VARCHAR(255),
  master_product_id BIGINT,
  master_unit_id BIGINT,
  conversion_value INTEGER,
  description TEXT,
  modified_date TIMESTAMP,
  created_date TIMESTAMP,
  is_active BOOLEAN,
  order_template VARCHAR(255),
  is_lot_serial_control BOOLEAN,
  is_batch_expire_control BOOLEAN,
  trade_mark_name VARCHAR(255),
  trade_mark_id BIGINT,
  images TEXT[],
  synced_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kv_products_kiotviet_id ON public.kv_products (kiotviet_id);

-- INVOICE TABLE
DROP TABLE IF EXISTS public.kv_invoices CASCADE;
CREATE TABLE public.kv_invoices (
  id BIGSERIAL PRIMARY KEY,
  kiotviet_id BIGINT NOT NULL UNIQUE,
  uuid TEXT,
  code TEXT,
  purchase_date TIMESTAMP,
  branch_id BIGINT,
  branch_name TEXT,
  sold_by_id BIGINT,
  sold_by_name TEXT,
  kiotviet_customer_id BIGINT,
  customer_id BIGINT REFERENCES kv_customers(id),
  customer_code TEXT,
  customer_name TEXT,
  order_code TEXT,
  total NUMERIC(12,4),
  total_payment NUMERIC(12,4),
  status INTEGER,
  status_value TEXT,
  using_cod BOOLEAN,
  created_date TIMESTAMP,
  synced_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kv_invoices_purchase_date ON public.kv_invoices (purchase_date);
CREATE INDEX IF NOT EXISTS idx_kv_invoices_kiotviet_id ON public.kv_invoices (kiotviet_id);

-- INVOICE DETAILS
DROP TABLE IF EXISTS public.kv_invoice_details CASCADE;
CREATE TABLE public.kv_invoice_details (
  id BIGSERIAL PRIMARY KEY,
  invoice_id BIGINT NOT NULL REFERENCES kv_invoices(id) ON DELETE CASCADE,
  kiotviet_product_id BIGINT,
  product_id BIGINT REFERENCES kv_products(id),
  product_code TEXT,
  product_name TEXT,
  category_id BIGINT,
  category_name TEXT,
  quantity NUMERIC(12,4),
  price NUMERIC(12,4),
  discount NUMERIC(12,4),
  sub_total NUMERIC(12,4),
  note TEXT,
  serial_numbers TEXT,
  return_quantity NUMERIC(12,4),
  synced_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kv_invoice_details_invoice_id ON public.kv_invoice_details (invoice_id);

DROP TABLE IF EXISTS public.kv_product_inventories CASCADE;
CREATE TABLE public.kv_product_inventories (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES kv_products(id) ON DELETE CASCADE,
  branch_id BIGINT,
  branch_name TEXT,
  on_hand NUMERIC(20, 6),         -- Tồn kho thực tế
  on_sales NUMERIC(20, 6),        -- Tồn kho có thể bán
  reserved NUMERIC(20, 6),        -- Hàng đã giữ cho đơn hàng
  minimum_inventory NUMERIC(20, 6), -- Ngưỡng tối thiểu
  last_sync TIMESTAMP,            -- Thời điểm đồng bộ inventory
  synced_at TIMESTAMP             -- Giống các bảng khác, lần đồng bộ toàn bảng
);
CREATE INDEX IF NOT EXISTS idx_kv_product_inventories_product_id ON public.kv_product_inventories (product_id);
CREATE INDEX IF NOT EXISTS idx_kv_product_inventories_branch_id ON public.kv_product_inventories (branch_id);
