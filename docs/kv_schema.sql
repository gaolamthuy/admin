-- CUSTOMER TABLE
create table public.kv_customers (
  id bigserial not null,
  kiotviet_id bigint not null,
  code text null,
  name text null,
  retailer_id bigint null,
  branch_id bigint null,
  location_name text null,
  ward_name text null,
  modified_date timestamp without time zone null,
  created_date timestamp without time zone null,
  type integer null,
  groups text null,
  debt numeric(12, 4) null,
  contact_number text null,
  comments text null,
  address text null,
  synced_at timestamp without time zone null,
  constraint kv_customers_pkey primary key (id),
  constraint kv_customers_kiotviet_id_key unique (kiotviet_id)
) TABLESPACE pg_default;

create index IF not exists idx_kv_customers_kiotviet_id on public.kv_customers using btree (kiotviet_id) TABLESPACE pg_default;


-- PRODUCT TABLE
create table public.kv_products (
  id bigserial not null,
  kiotviet_id bigint not null,
  retailer_id bigint null,
  code character varying(255) null,
  bar_code character varying(255) null,
  name character varying(255) null,
  full_name character varying(255) null,
  category_id bigint null,
  category_name character varying(255) null,
  allows_sale boolean null,
  type integer null,
  has_variants boolean null,
  base_price numeric(20, 6) null,
  weight numeric(20, 6) null,
  unit character varying(255) null,
  master_product_id bigint null,
  master_unit_id bigint null,
  conversion_value integer null,
  description text null,
  modified_date timestamp without time zone null,
  created_date timestamp without time zone null,
  is_active boolean null,
  order_template character varying(255) null,
  is_lot_serial_control boolean null,
  is_batch_expire_control boolean null,
  trade_mark_name character varying(255) null,
  trade_mark_id bigint null,
  images text[] null,
  synced_at timestamp without time zone null,
  constraint kv_products_pkey primary key (id),
  constraint kv_products_kiotviet_id_key unique (kiotviet_id)
) TABLESPACE pg_default;

create index IF not exists idx_kv_products_kiotviet_id on public.kv_products using btree (kiotviet_id) TABLESPACE pg_default;

-- PRODUCT INVENTORY TABLE
create table public.kv_product_inventories (
  id bigserial not null,
  product_id bigint not null,
  branch_id bigint null,
  branch_name text null,
  on_hand numeric(20, 6) null,
  on_sales numeric(20, 6) null,
  reserved numeric(20, 6) null,
  minimum_inventory numeric(20, 6) null,
  last_sync timestamp without time zone null,
  synced_at timestamp without time zone null,
  constraint kv_product_inventories_pkey primary key (id),
  constraint kv_product_inventories_product_id_fkey foreign KEY (product_id) references kv_products (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_kv_product_inventories_product_id on public.kv_product_inventories using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_kv_product_inventories_branch_id on public.kv_product_inventories using btree (branch_id) TABLESPACE pg_default;


-- INVOICE TABLE
create table public.kv_invoices (
  id bigserial not null,
  kiotviet_id bigint not null,
  uuid text null,
  code text null,
  purchase_date timestamp without time zone null,
  branch_id bigint null,
  branch_name text null,
  sold_by_id bigint null,
  sold_by_name text null,
  kiotviet_customer_id bigint null,
  customer_code text null,
  customer_name text null,
  order_code text null,
  total numeric(12, 4) null,
  total_payment numeric(12, 4) null,
  status integer null,
  status_value text null,
  using_cod boolean null,
  created_date timestamp without time zone null,
  synced_at timestamp without time zone null,
  constraint kv_invoices_pkey primary key (id),
  constraint kv_invoices_kiotviet_id_key unique (kiotviet_id),
  constraint kv_invoices_kiotviet_customer_id_fkey foreign KEY (kiotviet_customer_id) references kv_customers (kiotviet_id)
) TABLESPACE pg_default;

create index IF not exists idx_kv_invoices_purchase_date on public.kv_invoices using btree (purchase_date) TABLESPACE pg_default;

create index IF not exists idx_kv_invoices_kiotviet_id on public.kv_invoices using btree (kiotviet_id) TABLESPACE pg_default;

-- INVOICE DETAILS
create table public.kv_invoice_details (
  id bigserial not null,
  invoice_id bigint not null,
  kiotviet_product_id bigint null,
  product_code text null,
  product_name text null,
  category_id bigint null,
  category_name text null,
  quantity numeric(12, 4) null,
  price numeric(12, 4) null,
  discount numeric(12, 4) null,
  sub_total numeric(12, 4) null,
  note text null,
  serial_numbers text null,
  return_quantity numeric(12, 4) null,
  synced_at timestamp without time zone null,
  constraint kv_invoice_details_pkey primary key (id),
  constraint kv_invoice_details_invoice_id_fkey foreign KEY (invoice_id) references kv_invoices (id) on delete CASCADE,
  constraint kv_invoice_details_kiotviet_product_id_fkey foreign KEY (kiotviet_product_id) references kv_products (kiotviet_id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_kv_invoice_details_invoice_id on public.kv_invoice_details using btree (invoice_id) TABLESPACE pg_default;