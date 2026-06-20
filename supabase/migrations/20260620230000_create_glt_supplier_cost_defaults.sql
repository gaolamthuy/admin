-- Migration: per-supplier default surcharge values (Chi phí nhập hàng)
-- Liên kết với KiotViet "Chi phí nhập khác" (mã CHK*) → route vào ex_return_third_party.

-- 1. Catalog loại chi phí nhập hàng
CREATE TABLE IF NOT EXISTS glt_cost_types (
  code                TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  is_supplier_expense BOOLEAN NOT NULL DEFAULT false,
  sort_order          INT NOT NULL DEFAULT 0,
  synced_at           TIMESTAMPTZ
);

INSERT INTO glt_cost_types (code, name, is_supplier_expense, sort_order) VALUES
  ('CHK000002', 'Cước xe',   false, 1),
  ('CHK000001', 'Xuống gạo', false, 2)
ON CONFLICT (code) DO UPDATE SET
  name                = EXCLUDED.name,
  is_supplier_expense = EXCLUDED.is_supplier_expense,
  sort_order          = EXCLUDED.sort_order;

-- 2. Default surcharge value per supplier
CREATE TABLE IF NOT EXISTS glt_supplier_cost_defaults (
  id                   BIGSERIAL PRIMARY KEY,
  supplier_kiotviet_id BIGINT NOT NULL,
  cost_type_code       TEXT NOT NULL REFERENCES glt_cost_types(code),
  default_value        NUMERIC NOT NULL DEFAULT 0,
  is_active            BOOLEAN NOT NULL DEFAULT true,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by           TEXT,
  UNIQUE (supplier_kiotviet_id, cost_type_code)
);

CREATE INDEX IF NOT EXISTS idx_supplier_cost_defaults_supplier
  ON glt_supplier_cost_defaults (supplier_kiotviet_id);

-- 3. View join defaults + cost types
CREATE OR REPLACE VIEW v_supplier_cost_defaults AS
SELECT
  d.id,
  d.supplier_kiotviet_id,
  d.cost_type_code,
  ct.name               AS cost_type_name,
  ct.is_supplier_expense,
  ct.sort_order,
  d.default_value,
  d.is_active,
  d.updated_at
FROM glt_supplier_cost_defaults d
JOIN glt_cost_types ct ON ct.code = d.cost_type_code;
