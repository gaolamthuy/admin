-- Migration: Add glt_is_test flag to kv_product_categories
-- Purpose: Phân biệt danh mục dữ liệu test với danh mục ngừng kinh doanh.
--   - glt_is_active: trạng thái kinh doanh thật (Quà khuyến mãi, Các loại khác...)
--   - glt_is_test:   dữ liệu thử nghiệm — admin hiển thị để test,
--     homepage/windmill views vẫn lọc theo glt_is_active nên tự động ẩn.
ALTER TABLE kv_product_categories
  ADD COLUMN glt_is_test boolean NOT NULL DEFAULT false;

UPDATE kv_product_categories SET glt_is_test = true
WHERE category_id = 463518;  -- "test"
