/**
 * ProductListView Component
 * Main view component cho product list với support cho cả list và card view
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import { ProductListViewProps } from '../types/product-list';
import { ProductCardGrid } from './ProductCardGrid';
import { ProductCard } from '@/types';

/**
 * Component chính hiển thị product list với 2 view modes
 * @param props - ProductListViewProps
 * @returns JSX Element
 */
export const ProductListView: React.FC<ProductListViewProps> = ({
  viewMode,
  products,
  loading,
  onEdit,
  onShow,
  onDelete,
  table,
}) => {
  if (viewMode === 'list') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              Hiển thị {products.length} sản phẩm
            </p>
          </div>
          {table && <DataTable table={table} />}
        </CardContent>
      </Card>
    );
  }

  // Convert Product[] to ProductCard[] for ProductCardGrid
  const productCards: ProductCard[] = products.map(product => ({
    id: String(product.id),
    kiotviet_id: product.kiotviet_id,
    code: product.code,
    name: product.name,
    full_name: product.full_name,
    base_price: product.base_price,
    images: product.images,
    is_active: product.is_active,
    glt_visible: product.glt_visible,
    glt_labelprint_favorite: product.glt_labelprint_favorite,
  }));

  return (
    <ProductCardGrid
      products={productCards}
      loading={loading}
      onEdit={onEdit}
      onShow={onShow}
      onDelete={onDelete}
    />
  );
};
