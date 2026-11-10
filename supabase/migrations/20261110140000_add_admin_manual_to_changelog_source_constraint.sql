-- Migration: Allow admin_manual source in glt_product_changelogs
-- Purpose: Tính năng chỉnh giá thủ công từ admin (mode manual_cost/manual_po
--   của update_product_price_from_po) ghi changelog với source = 'admin_manual'.
--   CHECK constraint cũ chỉ cho phép webhook/sync/po_update.
ALTER TABLE public.glt_product_changelogs
  DROP CONSTRAINT chk_source;

ALTER TABLE public.glt_product_changelogs
  ADD CONSTRAINT chk_source
  CHECK (source IS NULL OR source = ANY (ARRAY[
    'webhook'::text, 'sync'::text, 'po_update'::text, 'admin_manual'::text
  ]));
