import React, { useEffect } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ListView } from '@/components/refine-ui/views/list-view';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Product } from '@/types';
import { ProductCardGrid, ProductListView } from './components';
import {
  useProductView,
  useProductFilters,
  useProductTable,
  useProductActions,
} from './hooks';

/**
 * Component danh sách sản phẩm - Hook-based version
 * Hiển thị tất cả sản phẩm từ bảng kv_products với 2 view modes: list và card
 * Sử dụng custom hooks để tách logic và improve maintainability
 */
export const ProductList = () => {
  // Hooks
  const { viewMode, setViewMode } = useProductView();
  const { isAdmin } = useIsAdmin();
  const {
    selectedCategory,
    setSelectedCategory,
    isFavorite,
    setIsFavorite,
    filters,
  } = useProductFilters();
  const { onEdit, onShow, onDelete } = useProductActions();
  const { table, getProcessedProducts, isLoading } = useProductTable(
    isAdmin,
    filters,
    onEdit,
    onShow
  );

  // Sync filters to table khi filters thay đổi
  useEffect(() => {
    table.refineCore.setFilters(filters, 'replace');
  }, [filters]); // Chỉ depend on filters, không depend on table.refineCore

  // Get processed products data
  const filteredProducts = getProcessedProducts();

  return (
    <ListView>
      <div className="space-y-6">
        <ProductListView
          viewMode={viewMode}
          onViewModeChange={(value: string) =>
            setViewMode(value as 'list' | 'card')
          }
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isFavorite={isFavorite}
          onFavoriteChange={setIsFavorite}
          isAdmin={isAdmin}
        >
          {viewMode === 'list' ? (
            // List View - DataTable
            <Card>
              <CardHeader>
                <CardTitle>Danh sách sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {isFavorite
                      ? `Hiển thị ${filteredProducts.length} sản phẩm yêu thích`
                      : selectedCategory
                        ? `Hiển thị ${filteredProducts.length} sản phẩm trong danh mục`
                        : 'Hiển thị tất cả sản phẩm trong hệ thống'}
                  </p>
                </div>
                <DataTable table={table} />
              </CardContent>
            </Card>
          ) : (
            // Card View - ProductCardGrid
            <ProductCardGrid
              products={filteredProducts.map(product => ({
                id: String(product.id || ''),
                kiotviet_id: product.kiotviet_id || 0,
                code: product.code || '',
                name: product.name || '',
                full_name: product.full_name || '',
                base_price: product.base_price || 0,
                images: product.images || [],
                is_active: product.is_active || false,
                glt_visible: product.glt_visible || false,
                glt_labelprint_favorite:
                  product.glt_labelprint_favorite || false,
              }))}
              loading={isLoading}
              onEdit={onEdit}
              onDelete={onDelete}
              onShow={onShow}
            />
          )}
        </ProductListView>
      </div>
    </ListView>
  );
};
