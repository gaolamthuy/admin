-- Migration: chuyển favorite từ bảng riêng sang cột trực tiếp trên kv_suppliers.
-- Sync KiotViet dùng ON CONFLICT (kiotviet_id) DO UPDATE SET với danh sách cột tường minh
-- (không gồm favorite) → cột này tồn tại qua mọi lần sync.
DROP TABLE IF EXISTS glt_supplier_favorites;

ALTER TABLE kv_suppliers
  ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT false;
