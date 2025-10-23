/**
 * Product Data View Component
 * Component quản lý hiển thị dữ liệu sản phẩm (card hoặc table)
 *
 * @author GLT Admin Team
 * @version 1.0.0
 * @since 2024-12-19
 */

import React from "react";
import { TextField, NumberField, TagField, DateField } from "@refinedev/antd";
import { Table, Row, Col, Space, Button, Pagination, Spin } from "antd";
import { ProductCard } from "./ProductCard";
import { useIsAdmin } from "../../hooks/usePermissions";
import type { ProductDataViewProps, TableColumn } from "../../types/product";

// ===== INTERFACE DEFINITIONS =====

// ===== TABLE COLUMNS CONFIGURATION =====

/**
 * Cấu hình các cột cho Table view
 * Định nghĩa các cột hiển thị trong bảng sản phẩm
 */
const getTableColumns = (isAdmin: boolean): TableColumn[] => [
  {
    title: "ID KiotViet",
    dataIndex: "kiotviet_id",
    key: "kiotviet_id",
    render: (value: any) => <TextField value={value} />,
  },
  {
    title: "Mã sản phẩm",
    dataIndex: "code",
    key: "code",
    render: (value: any) => <TextField value={value} />,
  },
  {
    title: "Tên sản phẩm",
    dataIndex: "full_name",
    key: "full_name",
    render: (value: any) => <TextField value={value} />,
  },
  {
    title: "Giá bán",
    dataIndex: "base_price",
    key: "base_price",
    render: (value: any) => (
      <NumberField
        value={value}
        options={{
          style: "currency",
          currency: "VND",
        }}
      />
    ),
  },
  {
    title: "Hiển thị",
    dataIndex: "glt_visible",
    key: "glt_visible",
    render: (value: any) => (
      <TagField
        value={value ? "Có" : "Không"}
        color={value ? "green" : "red"}
      />
    ),
  },
  {
    title: "Ngày tạo",
    dataIndex: "glt_created_at",
    key: "glt_created_at",
    render: (value: any) => <DateField value={value} />,
  },
  // Chỉ hiển thị cột Thao tác cho admin
  ...(isAdmin
    ? [
        {
          title: "Thao tác",
          dataIndex: "actions",
          key: "actions",
          render: (_: any, record: any) => (
            <Space>
              <Button
                type="link"
                size="small"
                href={`/products/show/${record.id}`}
              >
                Xem
              </Button>
              <Button
                type="link"
                size="small"
                href={`/products/edit/${record.id}`}
              >
                Sửa
              </Button>
            </Space>
          ),
        },
      ]
    : []),
];

// ===== MAIN COMPONENT =====

/**
 * ProductDataView Component
 *
 * Component chính để hiển thị danh sách sản phẩm với 2 chế độ:
 * 1. Table view: Hiển thị dạng bảng với các cột thông tin chi tiết
 * 2. Card view: Hiển thị dạng grid card với ảnh và thông tin cơ bản
 *
 * @param {ProductDataViewProps} props - Props của component
 * @returns {JSX.Element} Product data view JSX
 */
export const ProductDataView: React.FC<ProductDataViewProps> = ({
  viewMode,
  tableProps,
  imagePlaceholder,
  formatPrice,
  onImageError,
}) => {
  // Check admin role
  const { hasRole: isAdmin } = useIsAdmin();

  // ===== TABLE VIEW RENDER =====

  if (viewMode === "table") {
    return (
      <Table
        {...tableProps}
        rowKey="id"
        columns={getTableColumns(isAdmin)}
        // Cấu hình responsive cho table
        scroll={{ x: 800 }}
        // Pagination config
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} của ${total} sản phẩm`,
        }}
      />
    );
  }

  // ===== CARD VIEW RENDER =====

  return (
    <div>
      {/* Loading spinner */}
      {tableProps.loading && (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
        </div>
      )}

      {/* Cards grid */}
      <Row gutter={[16, 16]}>
        {tableProps.dataSource?.map((product: any) => (
          <Col
            key={product.id}
            xs={24} // Mobile: 1 card per row
            sm={12} // Small: 2 cards per row
            lg={8} // Large: 3 cards per row
            xl={6} // Extra large: 4 cards per row
          >
            <ProductCard
              product={product}
              loading={!!tableProps.loading}
              onImageError={onImageError}
              imagePlaceholder={imagePlaceholder}
              formatPrice={formatPrice}
            />
          </Col>
        ))}
      </Row>

      {/* Pagination for card view */}
      {tableProps.pagination && (
        <div style={{ marginTop: "24px", textAlign: "center" }}>
          <Pagination
            current={tableProps.pagination.current}
            pageSize={tableProps.pagination.pageSize}
            total={tableProps.pagination.total}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`
            }
            onChange={(page, pageSize) => {
              if (tableProps.pagination?.onChange) {
                tableProps.pagination.onChange(page, pageSize);
              }
            }}
            onShowSizeChange={(_current, size) => {
              if (tableProps.pagination?.onChange) {
                tableProps.pagination.onChange(1, size);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

// ===== EXPORTS =====

export default ProductDataView;
