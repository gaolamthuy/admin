/**
 * useProductTable Hook
 * Quản lý table configuration và data cho product list
 */

import { useMemo } from 'react';
import { useTable, UseTableReturnType } from '@refinedev/react-table';
import { Product } from '@/types';
import { ProductFilter } from '../types/product-list';
import { createProductTableColumns } from '../components/ProductTableColumns';

/**
 * Hook quản lý table configuration cho product list
 * @param isAdmin - Whether user is admin
 * @param filters - Array of filters to apply
 * @returns Table instance và configuration
 */
export const useProductTable = (
  isAdmin: boolean,
  filters: ProductFilter[]
): {
  table: UseTableReturnType<Product>;
  columns: unknown[];
  config: unknown;
  getProcessedProducts: () => unknown[];
  isLoading: boolean;
  totalCount: number;
} => {
  /**
   * Tạo columns cho table với type safety
   */
  const columns = useMemo(() => {
    return createProductTableColumns(isAdmin);
  }, [isAdmin]);

  /**
   * Table configuration với performance optimization
   */
  const tableConfig = useMemo(
    () => ({
      columns,
      refineCoreProps: {
        syncWithLocation: true,
        meta: {
          select: '*, kv_product_categories!inner(category_id,glt_is_active)',
          count: 'estimated', // Performance optimization theo docs
        },
        filters: {
          initial: filters,
        },
        sorters: {
          initial: [
            {
              field: 'base_price',
              order: 'asc' as const,
            },
          ],
        },
      },
    }),
    [columns, filters]
  );

  /**
   * Create table instance
   */
  const table = useTable(tableConfig);

  /**
   * Get processed products data từ table
   * @returns Array of processed products
   */
  const getProcessedProducts = () => {
    return table.reactTable.getRowModel().rows.map(row => ({
      id: String(row.original.id),
      code: row.original.code,
      kiotviet_id: row.original.kiotviet_id,
      name: row.original.name,
      full_name: row.original.full_name,
      base_price: row.original.base_price,
      images: row.original.images,
      is_active: row.original.is_active,
      glt_visible: row.original.glt_visible,
      category_id: row.original.category_id,
    }));
  };

  /**
   * Get loading state
   * @returns Boolean indicating if table is loading
   */
  const isLoading = table.refineCore.tableQuery.isLoading;

  /**
   * Get total count
   * @returns Number of total records
   */
  const totalCount = table.refineCore.tableQuery.data?.total || 0;

  return {
    table,
    columns,
    config: tableConfig,
    getProcessedProducts,
    isLoading,
    totalCount,
  };
};
