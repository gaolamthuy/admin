-- Migration: đổi nguồn ảnh trong v_supplier_po_templates sang kv_products.images (kv_images)
-- Ảnh nhập hàng dùng ảnh KiotViet CDN (đồng bộ sẵn vào kv_products) thay vì
-- glt_product_images (Supabase storage theo role) — đúng nguồn khách quen xem.

-- Kiểu cột images đổi (jsonb → text[]) nên phải DROP VIEW, không dùng CREATE OR REPLACE
DROP VIEW IF EXISTS v_supplier_po_templates;

CREATE VIEW v_supplier_po_templates AS
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
)
SELECT
  t.supplier_kiotviet_id,
  t.product_id,
  t.sort_order,
  t.created_at,
  p.code AS product_code,
  p.full_name AS product_name,
  p.order_template,
  p.images AS images, -- kv_images: mảng URL ảnh KiotViet CDN
  cu.child_units,
  p.unit AS master_unit
FROM glt_supplier_po_templates t
JOIN kv_products p ON p.kiotviet_id = t.product_id AND p.master_unit_id IS NULL
LEFT JOIN child_units_cte cu ON cu.master_unit_id = t.product_id;
