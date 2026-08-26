-- Migration: thêm note cho supplier cost defaults + khóa ghi chỉ admin + trigger updated_at
--
-- 1. Cột note: ghi chú vì sao chi phí nhập thay đổi (vd "tăng giá xăng")
-- 2. RLS: đọc cho mọi authenticated, ghi (insert/update) chỉ admin
--    (trước đó RLS tắt hoàn toàn — ai cũng ghi được)
-- 3. Trigger updated_at: trước giờ updated_at chỉ có default INSERT,
--    UPDATE không refresh — thêm trigger dùng hàm có sẵn update_updated_at_column.

ALTER TABLE glt_supplier_cost_defaults
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Trigger refresh updated_at trên UPDATE (hàm có sẵn theo pattern Supabase)
DROP TRIGGER IF EXISTS set_glt_supplier_cost_defaults_updated_at ON glt_supplier_cost_defaults;
CREATE TRIGGER set_glt_supplier_cost_defaults_updated_at
  BEFORE UPDATE ON glt_supplier_cost_defaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE glt_supplier_cost_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE glt_supplier_cost_defaults FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_supplier_cost_defaults" ON glt_supplier_cost_defaults;
CREATE POLICY "read_supplier_cost_defaults" ON glt_supplier_cost_defaults
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admin_insert_supplier_cost_defaults" ON glt_supplier_cost_defaults;
CREATE POLICY "admin_insert_supplier_cost_defaults" ON glt_supplier_cost_defaults
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM glt_users gu
      WHERE gu.user_id::text = auth.uid()::text
        AND lower(gu.role) = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_update_supplier_cost_defaults" ON glt_supplier_cost_defaults;
CREATE POLICY "admin_update_supplier_cost_defaults" ON glt_supplier_cost_defaults
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM glt_users gu
      WHERE gu.user_id::text = auth.uid()::text
        AND lower(gu.role) = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM glt_users gu
      WHERE gu.user_id::text = auth.uid()::text
        AND lower(gu.role) = 'admin'
    )
  );

-- View: thêm cột note (append cuối — CREATE OR REPLACE cho phép)
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
  d.updated_at,
  d.note
FROM glt_supplier_cost_defaults d
JOIN glt_cost_types ct ON ct.code = d.cost_type_code;
