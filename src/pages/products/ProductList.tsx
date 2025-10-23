/**
 * Product List page component
 * Trang danh sách sản phẩm với table và filters
 */
import React from "react";
import { List, useTable } from "@refinedev/antd";
import { Button, Space } from "antd";
import { AppstoreOutlined, TableOutlined } from "@ant-design/icons";
import { ProductDataView } from "../../components/products/ProductDataView";
import { ProductCategoryFilter } from "../../components/products/ProductCategoryFilter";
import { ProductFavoriteFilter } from "../../components/products/ProductFavoriteFilter";
import { formatPrice, generateImagePlaceholder } from "../../utils/format";

/**
 * Product List component
 * Hiển thị danh sách sản phẩm với table
 */
export const ProductList: React.FC = () => {
  const [viewMode, setViewMode] = React.useState<"table" | "card">("card");
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<
    string | null
  >(null);
  const [favoriteFilter, setFavoriteFilter] = React.useState<boolean | null>(
    true
  );

  const { tableProps, setFilters } = useTable({
    resource: "kv_products",
    filters: {
      initial: [
        {
          field: "is_active",
          operator: "eq",
          value: true,
        },
        {
          field: "master_unit_id",
          operator: "null",
          value: true,
        },
        {
          field: "kv_product_categories.glt_is_active",
          operator: "eq",
          value: true,
        },
      ],
    },
    sorters: {
      initial: [
        {
          field: "base_price",
          order: "asc",
        },
      ],
    },
    // ✅ ĐÚNG: Sử dụng !inner cho deep filtering
    meta: {
      select: "*, kv_product_categories!inner(category_id,glt_is_active)",
    },
  });

  // Sync filters to data source
  React.useEffect(() => {
    const filters = [
      {
        field: "is_active",
        operator: "eq" as const,
        value: true,
      },
      {
        field: "master_unit_id",
        operator: "null" as const,
        value: true,
      },
      {
        field: "kv_product_categories.glt_is_active",
        operator: "eq" as const,
        value: true,
      },
    ];

    // Add category filter if a specific category is selected
    if (selectedCategoryId) {
      filters.push({
        field: "kv_product_categories.category_id",
        operator: "eq" as const,
        value: parseInt(selectedCategoryId, 10) as any,
      });
    }

    // Add favorite filter if set
    if (favoriteFilter !== null) {
      filters.push({
        field: "glt_labelprint_favorite",
        operator: "eq" as const,
        value: favoriteFilter,
      });
    }

    setFilters(filters, "replace");
  }, [selectedCategoryId, favoriteFilter, setFilters]);

  // Placeholder ảnh vuông khi không có hoặc lỗi tải ảnh
  const IMG_PLACEHOLDER = generateImagePlaceholder(200, 200, "No image");

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.currentTarget as HTMLImageElement).src = IMG_PLACEHOLDER;
  };

  return (
    <List
      title="Danh sách sản phẩm"
      headerButtons={[
        <ProductFavoriteFilter
          key="favorite-filter"
          value={favoriteFilter === true}
          onChange={setFavoriteFilter}
        />,
        <ProductCategoryFilter
          key="category-filter"
          value={selectedCategoryId}
          onChange={setSelectedCategoryId}
          placeholder="Danh mục"
        />,
        <Space.Compact key="view-toggle">
          <Button
            type={viewMode === "card" ? "primary" : "default"}
            icon={<AppstoreOutlined />}
            onClick={() => setViewMode("card")}
          >
            Thẻ
          </Button>
          <Button
            type={viewMode === "table" ? "primary" : "default"}
            icon={<TableOutlined />}
            onClick={() => setViewMode("table")}
          >
            Bảng
          </Button>
        </Space.Compact>,

        // <Button type="primary" icon={<PlusOutlined />} href="/products/create">
        //   Thêm sản phẩm
        // </Button>,
      ]}
    >
      <ProductDataView
        viewMode={viewMode}
        tableProps={tableProps as any}
        imagePlaceholder={IMG_PLACEHOLDER}
        formatPrice={formatPrice}
        onImageError={handleImageError}
      />
    </List>
  );
};
