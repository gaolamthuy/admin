-- Migration: thêm UPDATE policy cho kv_suppliers.
-- Trước đó chỉ có SELECT policy → UPDATE (toggle favorite) bị RLS chặn âm thầm (0 row, không lỗi).
-- Pattern giống kv_products.write_products.
CREATE POLICY "write_suppliers" ON kv_suppliers
  FOR UPDATE TO authenticated
  USING (user_has_permission(auth.uid(), 'products'::text, 'write'::text))
  WITH CHECK (user_has_permission(auth.uid(), 'products'::text, 'write'::text));
