-- Migration: Per-supplier PO product templates (danh sách SP nhập hàng chuẩn cho từng NCC)
-- Thay thế cơ chế cũ: template derived tự động từ PO gần nhất
-- (po_template_products JSONB trên v_suppliers_admin + kv_supplier_product_templates).
-- Dữ liệu seed lần đầu được frontend lấy từ nguồn cũ (auto-seed khi NCC chưa có rows).

-- 1. Bảng chính — 1 dòng = 1 SP trong template của 1 NCC
CREATE TABLE IF NOT EXISTS glt_supplier_po_templates (
  supplier_kiotviet_id BIGINT NOT NULL,
  product_id           BIGINT NOT NULL, -- kv_products.kiotviet_id (master product)
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (supplier_kiotviet_id, product_id)
);

COMMENT ON TABLE glt_supplier_po_templates IS
  'Danh sách sản phẩm nhập hàng chuẩn (template) cho từng nhà cung cấp — admin quản lý qua UI';

CREATE INDEX IF NOT EXISTS idx_supplier_po_templates_supplier
  ON glt_supplier_po_templates (supplier_kiotviet_id, sort_order);

-- 2. View enrich: join kv_products để trả đúng shape TemplateProduct cho frontend
-- (product_name, product_code, order_template, master_unit, images, child_units)
CREATE OR REPLACE VIEW v_supplier_po_templates AS
WITH child_units_cte AS (
  SELECT c.master_unit_id,
    jsonb_agg(jsonb_build_object(
      'kiotviet_id', c.kiotviet_id,
      'code', c.code,
      'name', c.full_name,
      'full_name', c.full_name,
      'unit', c.unit,
      'base_price', c.base_price,
      'conversion_value', c.conversion_value,
      'base_price_per_masterunit',
        CASE
          WHEN c.conversion_value > 0 THEN round(c.base_price / c.conversion_value::numeric, 0)
          ELSE NULL
        END
    ) ORDER BY c.kiotviet_id) AS child_units
  FROM kv_products c
  WHERE c.master_unit_id IS NOT NULL
  GROUP BY c.master_unit_id
),
template_images AS (
  -- Ảnh đại diện theo role (lấy 1 ảnh đầu mỗi role, cùng pattern bucket product-images)
  SELECT product_id,
    jsonb_agg(url ORDER BY id) AS images
  FROM (
    SELECT DISTINCT ON (glt_product_images.product_id, glt_product_images.role, glt_product_images.is_thumbnail)
      glt_product_images.product_id,
      glt_product_images.id,
      'https://wvckxasjbydyvqgwgdhg.supabase.co/storage/v1/object/public/product-images/'
        || glt_product_images.path AS url
    FROM glt_product_images
    WHERE glt_product_images.is_thumbnail = false
    ORDER BY glt_product_images.product_id, glt_product_images.role, glt_product_images.is_thumbnail, glt_product_images.id
  ) picked
  GROUP BY product_id
)
SELECT
  t.supplier_kiotviet_id,
  t.product_id,
  t.sort_order,
  t.created_at,
  p.code AS product_code,
  p.full_name AS product_name,
  p.order_template,
  ti.images,
  cu.child_units,
  p.unit AS master_unit
FROM glt_supplier_po_templates t
JOIN kv_products p ON p.kiotviet_id = t.product_id AND p.master_unit_id IS NULL
LEFT JOIN child_units_cte cu ON cu.master_unit_id = t.product_id
LEFT JOIN template_images ti ON ti.product_id = t.product_id;

-- 3. RLS
ALTER TABLE glt_supplier_po_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE glt_supplier_po_templates FORCE ROW LEVEL SECURITY;

-- Ai đăng nhập cũng đọc được template (cần để tạo đơn)
DROP POLICY IF EXISTS "read_supplier_po_templates" ON glt_supplier_po_templates;
CREATE POLICY "read_supplier_po_templates" ON glt_supplier_po_templates
  FOR SELECT TO authenticated
  USING (true);

-- Chỉ admin được thêm / xóa template
DROP POLICY IF EXISTS "admin_insert_supplier_po_templates" ON glt_supplier_po_templates;
CREATE POLICY "admin_insert_supplier_po_templates" ON glt_supplier_po_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM glt_users gu
      WHERE gu.user_id::text = auth.uid()::text
        AND lower(gu.role) = 'admin'
    )
  );

DROP POLICY IF EXISTS "admin_delete_supplier_po_templates" ON glt_supplier_po_templates;
CREATE POLICY "admin_delete_supplier_po_templates" ON glt_supplier_po_templates
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM glt_users gu
      WHERE gu.user_id::text = auth.uid()::text
        AND lower(gu.role) = 'admin'
    )
  );
