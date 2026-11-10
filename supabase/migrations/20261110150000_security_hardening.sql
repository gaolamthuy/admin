-- Migration: Security hardening (theo Supabase advisors)
-- 1. Bật RLS cho 4 bảng public thiếu RLS:
--    - zalo_oa_conversations, zca_send_log, glt_product_images_backup_20260608:
--      chỉ service_role (windmill/backend) đọc — không tạo policy
--    - glt_cost_types: admin app đọc bằng authenticated
-- 2. Fix search_path cố định cho các hàm public (loại hàm thuộc extension)
-- 3. Chặn anon gọi các hàm SECURITY DEFINER (RBAC) + chặn anon đọc view admin
DO $$
DECLARE
  r record;
  already boolean;
BEGIN
  -- 2. search_path
  FOR r IN
    SELECT p.oid, n.nspname AS sch, p.proname AS fname,
           pg_get_function_identity_arguments(p.oid) AS args,
           p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        JOIN pg_extension e ON e.oid = d.refobjid
        WHERE d.objid = p.oid AND d.deptype = 'e'
      )
  LOOP
    already := EXISTS (
      SELECT 1 FROM unnest(COALESCE(r.proconfig, '{}')) cfg
      WHERE cfg LIKE 'search_path%'
    );
    IF NOT already THEN
      BEGIN
        EXECUTE format(
          'ALTER FUNCTION %I.%I(%s) SET search_path = public, extensions;',
          r.sch, r.fname, r.args
        );
      EXCEPTION WHEN insufficient_privilege THEN
        RAISE NOTICE 'Skip (not owner): %.%', r.sch, r.fname;
      END;
    END IF;
  END LOOP;

  -- 3a. Chặn anon gọi hàm SECURITY DEFINER
  FOR r IN
    SELECT p.proname AS fname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname IN (
        'can_manage_users', 'customer_phone_from_jwt', 'get_products_list',
        'get_user_permissions', 'get_user_roles', 'is_admin',
        'user_has_permission', 'user_has_role'
      )
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;', r.sch, r.fname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated;', r.sch, r.fname, r.args);
  END LOOP;

  -- 3b. Chặn anon đọc view admin (SECURITY DEFINER bypass RLS)
  FOR r IN
    SELECT table_name FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name IN (
        'v_products_admin', 'v_customers_admin', 'v_suppliers_admin',
        'v_products_windmill', 'v_supplier_cost_defaults', 'v_supplier_po_templates'
      )
  LOOP
    EXECUTE format('REVOKE SELECT, TRUNCATE ON public.%I FROM anon;', r.table_name);
  END LOOP;
END $$;

ALTER TABLE public.zalo_oa_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zca_send_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glt_product_images_backup_20260608 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glt_cost_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_cost_types"
  ON public.glt_cost_types
  FOR SELECT TO authenticated
  USING (true);
