/**
 * Product Category Filter Component
 * Component lọc sản phẩm theo category (chỉ hiển thị categories có glt_is_active = true)
 */

import React from "react";
import { Select } from "antd";
import { supabase } from "../../lib/supabase";
import type {
  ProductCategoryFilterProps,
  CategoryOption,
} from "../../types/product";

/**
 * ProductCategoryFilter
 *
 * @param value - id category được chọn
 * @param onChange - callback khi thay đổi category
 * @param style - style tuỳ chỉnh
 * @param allowClear - cho phép xoá lựa chọn
 * @param placeholder - placeholder cho select
 * @returns JSX.Element
 */
export const ProductCategoryFilter: React.FC<ProductCategoryFilterProps> = ({
  value,
  onChange,
  style,
  allowClear = true,
  placeholder = "Danh mục",
}) => {
  const [options, setOptions] = React.useState<CategoryOption[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);

  const fetchCategories = React.useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("kv_product_categories")
        .select("category_id,category_name,glt_is_active")
        .eq("glt_is_active", true)
        .order("rank", { ascending: true });

      if (error) throw error;
      const typed: Array<{
        category_id: number;
        category_name?: string | null;
      }> = (data || []) as Array<{
        category_id: number;
        category_name?: string | null;
      }>;
      setOptions(
        typed.map((c) => ({
          id: c.category_id.toString(),
          name: c.category_name,
        }))
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to load categories", e);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return (
    <Select
      showSearch
      allowClear={allowClear}
      value={value ?? undefined}
      loading={loading}
      placeholder={placeholder}
      optionFilterProp="label"
      style={{ minWidth: "auto", ...style }}
      options={options.map((o) => ({ value: o.id, label: o.name || o.id }))}
      onChange={(val) => onChange?.(val ?? null)}
    />
  );
};

export default ProductCategoryFilter;
