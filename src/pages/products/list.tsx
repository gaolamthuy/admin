import React, { useEffect } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ListView } from '@/components/refine-ui/views/list-view';
import { ProductListView } from './components';
import {
  useProductView,
  useProductFilters,
  useProductTable,
  useProductActions,
} from './hooks';

/**
 * Component danh sách sản phẩm - Refactored version
 * Hiển thị tất cả sản phẩm từ bảng kv_products với 2 view modes: list và card
 * Sử dụng custom hooks để tách logic và improve maintainability
 */
export const ProductList = () => {
  // Hooks
  const { viewMode } = useProductView();
  const { isAdmin } = useIsAdmin();
  const { filters } = useProductFilters();
  const { table, getProcessedProducts, isLoading } = useProductTable(
    isAdmin,
    filters
  );
  const { onEdit, onShow, onDelete } = useProductActions();

  // Sync filters to table khi filters thay đổi
  useEffect(() => {
    table.refineCore.setFilters(filters, 'replace');
  }, [filters, table.refineCore]);

  // Get processed products data
  const filteredProducts = getProcessedProducts();

  return (
    <ListView>
      <div className="space-y-6">
        <ProductListView
          viewMode={viewMode}
          products={filteredProducts}
          loading={isLoading}
          isAdmin={isAdmin}
          onEdit={onEdit}
          onShow={onShow}
          onDelete={onDelete}
          table={table}
        />
      </div>
    </ListView>
  );
};
