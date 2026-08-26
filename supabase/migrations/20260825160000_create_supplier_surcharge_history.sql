-- Migration: lịch sử chi phí nhập hàng theo từng đơn (append-only log)
-- Mỗi lần tạo đơn nhập thành công, frontend insert 1 row cho mỗi loại chi phí > 0
-- (kèm po_code + note). Bảng glt_supplier_cost_defaults giữ vai trò "lần gần nhất"
-- làm prefill — bảng này là audit trail để tra cứu & click-to-fill.

CREATE TABLE IF NOT EXISTS glt_supplier_surcharge_history (
  id                   BIGSERIAL PRIMARY KEY,
  supplier_kiotviet_id BIGINT NOT NULL,
  cost_type_code       TEXT NOT NULL,
  value                NUMERIC NOT NULL DEFAULT 0,
  note                 TEXT,
  po_code              TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by           TEXT
);

COMMENT ON TABLE glt_supplier_surcharge_history IS
  'Lịch sử chi phí nhập hàng theo đơn — append-only, insert khi tạo PO thành công';

CREATE INDEX IF NOT EXISTS idx_supplier_surcharge_history_supplier
  ON glt_supplier_surcharge_history (supplier_kiotviet_id, created_at DESC);

-- RLS: đọc cho mọi authenticated; chỉ INSERT (append-only — không có policy UPDATE/DELETE)
ALTER TABLE glt_supplier_surcharge_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE glt_supplier_surcharge_history FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_supplier_surcharge_history" ON glt_supplier_surcharge_history;
CREATE POLICY "read_supplier_surcharge_history" ON glt_supplier_surcharge_history
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "insert_supplier_surcharge_history" ON glt_supplier_surcharge_history;
CREATE POLICY "insert_supplier_surcharge_history" ON glt_supplier_surcharge_history
  FOR INSERT TO authenticated
  WITH CHECK (true);
