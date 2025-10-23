/**
 * Product Favorite Filter Component
 * Component lọc sản phẩm theo trạng thái yêu thích (glt_labelprint_favorite)
 */

import React from "react";
import { Select } from "antd";

const { Option } = Select;

/**
 * Props cho ProductFavoriteFilter component
 */
interface ProductFavoriteFilterProps {
  value?: boolean;
  onChange?: (isFavorite: boolean | null) => void;
  style?: React.CSSProperties;
  placeholder?: string;
}

/**
 * ProductFavoriteFilter Component
 *
 * Component filter cho trạng thái yêu thích của sản phẩm
 * Sử dụng Select với chỉ 1 option "Yêu thích"
 * - undefined/null: Không filter (hiển thị tất cả)
 * - true: Chỉ hiển thị sản phẩm yêu thích
 *
 * @param value - Trạng thái filter hiện tại
 * @param onChange - Callback khi thay đổi filter
 * @param style - Style tùy chỉnh
 * @param placeholder - Placeholder text
 * @returns JSX.Element
 */
export const ProductFavoriteFilter: React.FC<ProductFavoriteFilterProps> = ({
  value,
  onChange,
  style,
  placeholder = "Lọc SP yêu thích",
}) => {
  /**
   * Xử lý thay đổi select
   * Toggle: undefined -> true -> undefined
   */
  const handleSelectChange = (selectedValue: string | undefined) => {
    if (selectedValue === "favorite") {
      onChange?.(true);
    } else {
      onChange?.(null);
    }
  };

  return (
    <Select
      showSearch={false}
      allowClear
      value={value ? "favorite" : undefined}
      placeholder={placeholder}
      style={{ minWidth: "auto", ...style }}
      onChange={handleSelectChange}
      onClear={() => onChange?.(null)}
    >
      <Option value="favorite">
        <span style={{ fontWeight: 500 }}>Yêu thích</span>
      </Option>
    </Select>
  );
};

export default ProductFavoriteFilter;
