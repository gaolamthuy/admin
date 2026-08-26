-- Migration: đổi semantics glt_supplier_cost_defaults thành "last used"
-- Giá trị chi phí nhập hàng TỰ CẬP NHẬT mỗi khi tạo đơn nhập thành công (frontend upsert).
-- Không còn khái niệm "lưu mặc định thủ công" → ghi phải mở cho mọi authenticated
-- (nhân viên tạo đơn cũng cần capture được), note vẫn là ghi chú tùy chọn của admin.

COMMENT ON COLUMN glt_supplier_cost_defaults.default_value IS
  'Chi phí nhập lần gần nhất của supplier (auto-capture khi tạo PO)';
COMMENT ON COLUMN glt_supplier_cost_defaults.note IS
  'Ghi chú tùy chọn cho lần thay đổi gần nhất (vd: tăng giá xăng)';

-- Mở ghi cho authenticated (thay policy admin-only của migration trước)
DROP POLICY IF EXISTS "admin_insert_supplier_cost_defaults" ON glt_supplier_cost_defaults;
DROP POLICY IF EXISTS "admin_update_supplier_cost_defaults" ON glt_supplier_cost_defaults;

DROP POLICY IF EXISTS "write_supplier_cost_defaults" ON glt_supplier_cost_defaults;
CREATE POLICY "write_supplier_cost_defaults" ON glt_supplier_cost_defaults
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "update_supplier_cost_defaults" ON glt_supplier_cost_defaults;
CREATE POLICY "update_supplier_cost_defaults" ON glt_supplier_cost_defaults
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
