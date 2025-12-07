import React, { useEffect, useMemo } from 'react';
import { useInvalidate } from '@refinedev/core';
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
import { useProductPriceDifference } from './hooks/useProductPriceDifference';

/**
 * Component danh sách sản phẩm - Hook-based version
 * Hiển thị tất cả sản phẩm từ bảng kv_products với 2 view modes: list và card
 * Sử dụng custom hooks để tách logic và improve maintainability
 */
export const ProductList = () => {
  // Hooks
  const invalidate = useInvalidate();
  const { viewMode, setViewMode } = useProductView();
  const { isAdmin } = useIsAdmin();
  const {
    selectedCategory,
    setSelectedCategory,
    isFavorite,
    setIsFavorite,
    showPriceDifference,
    setShowPriceDifference,
    filters,
  } = useProductFilters();
  const { onEdit, onShow, onDelete } = useProductActions();
  const { table, getProcessedProducts, isLoading } = useProductTable(
    isAdmin,
    filters,
    onEdit,
    onShow
  );

  // Hook để query products với price difference
  const { products: priceDifferenceProducts, loading: priceDifferenceLoading } =
    useProductPriceDifference(showPriceDifference);

  // Khi bật price difference filter, tự động tắt favorite filter để tránh conflict
  useEffect(() => {
    if (showPriceDifference && isFavorite) {
      setIsFavorite(false);
    }
  }, [showPriceDifference, isFavorite, setIsFavorite]);

  // Sync filters to table khi filters thay đổi (chỉ khi không dùng price difference mode)
  useEffect(() => {
    if (!showPriceDifference) {
      table.refineCore.setFilters(filters, 'replace');
    }
  }, [filters, showPriceDifference]); // Chỉ depend on filters, không depend on table.refineCore

  // Đảm bảo khi vào trang list, dữ liệu luôn được làm mới để không bị stale UI (icon/ảnh tạm)
  useEffect(() => {
    invalidate({ resource: 'kv_products', invalidates: ['list'] });
  }, [invalidate]);

  // Get processed products data - switch giữa normal và price difference mode
  const filteredProducts = useMemo(() => {
    if (showPriceDifference) {
      console.log('[Price Difference] Raw products:', priceDifferenceProducts);
      console.log(
        '[Price Difference] Products count:',
        priceDifferenceProducts.length
      );

      if (priceDifferenceProducts.length === 0) {
        console.warn('[Price Difference] No products found!');
        return [];
      }

      // Map price difference products sang format của ProductCard
      const mapped = priceDifferenceProducts.map(p => {
        const product = {
          id: String(p.product_id), // Convert to string để match với ProductCard type
          code: p.product_code || '',
          kiotviet_id: p.kiotviet_id || 0,
          name: p.product_name || '',
          full_name: p.product_name || '',
          base_price: p.base_price || 0,
          images: p.images || [],
          is_active: true,
          glt_visible: true,
          glt_labelprint_favorite: p.glt_labelprint_favorite || false,
          category_id: null,
          // Thêm price difference data
          // Ưu tiên cost_difference, nếu không có thì dùng latest_price_difference
          priceDifference:
            p.cost_difference !== null && p.cost_difference !== undefined
              ? p.cost_difference
              : p.latest_price_difference,
          priceDifferencePercent:
            p.cost_difference_percent !== null &&
            p.cost_difference_percent !== undefined
              ? p.cost_difference_percent
              : p.latest_price_difference_percent,
          inventoryCost: p.inventory_cost,
          latestPurchaseCost: p.latest_total_cost_per_unit,
        };
        return product;
      });

      console.log('[Price Difference] Mapped products:', mapped);
      console.log('[Price Difference] Mapped count:', mapped.length);
      return mapped;
    }
    return getProcessedProducts();
  }, [showPriceDifference, priceDifferenceProducts, getProcessedProducts]);

  // Loading state - combine cả 2
  const combinedLoading =
    isLoading || (showPriceDifference && priceDifferenceLoading);

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
          showPriceDifference={showPriceDifference}
          onPriceDifferenceChange={setShowPriceDifference}
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
                    {showPriceDifference
                      ? `Hiển thị ${filteredProducts.length} sản phẩm có chênh lệch giá lớn nhất`
                      : isFavorite
                        ? `Hiển thị ${filteredProducts.length} sản phẩm yêu thích`
                        : selectedCategory
                          ? `Hiển thị ${filteredProducts.length} sản phẩm trong danh mục`
                          : 'Hiển thị tất cả sản phẩm trong hệ thống'}
                  </p>
                </div>
                {showPriceDifference ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Chế độ xem "Giá chênh lệch" chỉ hỗ trợ view Card. Vui lòng
                    chuyển sang view Card để xem.
                  </div>
                ) : (
                  <DataTable table={table} />
                )}
              </CardContent>
            </Card>
          ) : (
            // Card View - ProductCardGrid
            <ProductCardGrid
              products={(() => {
                console.log(
                  'Rendering ProductCardGrid with products:',
                  filteredProducts.length
                );
                return filteredProducts.map(product => {
                  // Nếu có price difference data, cần query thêm thông tin product đầy đủ
                  const baseProduct = {
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
                  };

                  // Thêm price difference data nếu có
                  if ('priceDifference' in product) {
                    return {
                      ...baseProduct,
                      priceDifference:
                        'priceDifference' in product
                          ? (product.priceDifference as
                              | number
                              | null
                              | undefined)
                          : undefined,
                      priceDifferencePercent:
                        'priceDifferencePercent' in product
                          ? (product.priceDifferencePercent as
                              | number
                              | null
                              | undefined)
                          : undefined,
                      inventoryCost:
                        'inventoryCost' in product
                          ? (product.inventoryCost as number | null | undefined)
                          : undefined,
                      latestPurchaseCost:
                        'latestPurchaseCost' in product
                          ? (product.latestPurchaseCost as
                              | number
                              | null
                              | undefined)
                          : undefined,
                    };
                  }

                  return baseProduct;
                });
              })()}
              loading={combinedLoading}
              onEdit={onEdit}
              onDelete={onDelete}
              onShow={onShow}
              isAdmin={isAdmin}
            />
          )}
        </ProductListView>
      </div>
    </ListView>
  );
};
