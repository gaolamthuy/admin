-- Migration: Baseline view v_customers_admin (version control)
-- Capture definition đang chạy trên DB vào migration để chống schema-drift
-- (view này được tạo thủ công trước khi repo bắt đầu track migrations).
--
-- CREATE OR REPLACE với definition GIỐNG HỆT định nghĩa hiện tại:
-- - No-op về logic, không đổi dữ liệu/columns
-- - Giữ nguyên grants hiện có (security_hardening đã REVOKE SELECT FROM anon)
--
-- Columns:
--   - Toàn bộ columns của kv_customers
--   - latest_invoice_datetime: ngày hóa đơn gần nhất (LATERAL join kv_invoices)
--   - recently_purchased_products: jsonb array {product_code, product_name, total_quantity}
--     tổng hợp từ 5 hóa đơn gần nhất, sort theo total_quantity DESC
--
-- Lưu ý: danh sách hóa đơn gốc (mã HĐ, ngày, tiền) chưa có — sẽ extend sau nếu cần.
CREATE OR REPLACE VIEW public.v_customers_admin AS
 SELECT c.id,
    c.kiotviet_id,
    c.code,
    c.name,
    c.retailer_id,
    c.branch_id,
    c.location_name,
    c.ward_name,
    c.modified_date,
    c.created_date,
    c.type,
    c.groups,
    c.debt,
    c.contact_number,
    c.comments,
    c.address,
    c.synced_at,
    c.glt_notes,
    c.glt_customer_group_name,
    c.glt_is_active,
    c.search_priority,
    latest.purchase_date AS latest_invoice_datetime,
    COALESCE(( WITH recent_invoices AS (
                 SELECT i.id AS invoice_id
                   FROM kv_invoices i
                  WHERE i.kiotviet_customer_id = c.kiotviet_id AND i.kiotviet_customer_id IS NOT NULL
                  ORDER BY i.purchase_date DESC
                 LIMIT 5
                ), product_summary AS (
                 SELECT id.product_code,
                    id.product_name,
                    sum(id.quantity) AS total_quantity
                   FROM kv_invoice_details id
                     JOIN recent_invoices ri ON id.invoice_id = ri.invoice_id
                  GROUP BY id.product_code, id.product_name
                )
         SELECT jsonb_agg(jsonb_build_object('product_code', ps.product_code, 'product_name', ps.product_name, 'total_quantity', ps.total_quantity) ORDER BY ps.total_quantity DESC) AS jsonb_agg
           FROM product_summary ps), '[]'::jsonb) AS recently_purchased_products
   FROM kv_customers c
     LEFT JOIN LATERAL ( SELECT i.purchase_date
           FROM kv_invoices i
          WHERE i.kiotviet_customer_id = c.kiotviet_id AND i.kiotviet_customer_id IS NOT NULL
          ORDER BY i.purchase_date DESC
         LIMIT 1) latest ON true;
