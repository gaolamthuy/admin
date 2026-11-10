-- Migration: Allow test categories in v_products_admin
-- Purpose: View đang lọc cat.glt_is_active = true → sản phẩm thuộc danh mục
--   test (glt_is_active = false, glt_is_test = true) bị loại khỏi admin list
--   ở tầng SQL dù filter dropdown đã hiển thị danh mục test.
-- Fix: cho phép cả danh mục test. Homepage (v_products_homepage) và Windmill
--   (v_products_windmill) giữ nguyên lọc glt_is_active → sản phẩm test vẫn ẩn
--   ở các frontend khác.
DO $$
DECLARE
  vdef text;
BEGIN
  SELECT pg_get_viewdef('public.v_products_admin'::regclass, true) INTO vdef;
  IF vdef LIKE '%cat.glt_is_test%' THEN
    RAISE NOTICE 'View already allows test categories — skip';
    RETURN;
  END IF;
  vdef := replace(
    vdef,
    'cat.glt_is_active = true',
    '(cat.glt_is_active = true OR COALESCE(cat.glt_is_test, false) = true)'
  );
  vdef := 'CREATE OR REPLACE VIEW public.v_products_admin AS ' || vdef;
  EXECUTE vdef;
  RAISE NOTICE 'v_products_admin updated';
END $$;
