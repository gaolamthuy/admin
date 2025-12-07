/**
 * usePurchaseOrderTable Hook
 * Quản lý table configuration và data cho purchase order list
 */

import { useMemo } from 'react';
import { useTable, UseTableReturnType } from '@refinedev/react-table';
import {
  PurchaseOrder,
  PurchaseOrderFilter,
} from '../types/purchase-order-list';
import { createPurchaseOrderTableColumns } from '../components/PurchaseOrderTableColumns';

/**
 * Hook quản lý table configuration cho purchase order list
 * @param isAdmin - Whether user is admin
 * @param filters - Array of filters to apply
 * @param onEdit - Edit action handler
 * @param onShow - Show action handler
 * @returns Table instance và configuration
 */
export const usePurchaseOrderTable = (
  isAdmin: boolean,
  filters: PurchaseOrderFilter[],
  onEdit?: (id: string | number) => void,
  onShow?: (id: string | number) => void
): {
  table: UseTableReturnType<PurchaseOrder>;
  columns: unknown[];
  config: unknown;
  getProcessedPurchaseOrders: () => Partial<PurchaseOrder>[];
  isLoading: boolean;
  totalCount: number;
} => {
  /**
   * Tạo columns cho table với type safety
   */
  const columns = useMemo(() => {
    return createPurchaseOrderTableColumns(isAdmin, onEdit, onShow);
  }, [isAdmin, onEdit, onShow]);

  /**
   * Table configuration với performance optimization
   */
  const tableConfig = useMemo(
    () => ({
      columns,
      refineCoreProps: {
        syncWithLocation: true,
        meta: {
          select: '*',
          count: 'estimated', // Performance optimization theo docs
        },
        filters: {
          initial: filters,
        },
        sorters: {
          initial: [
            {
              field: 'purchase_date',
              order: 'desc' as const, // Sort theo ngày mua mới nhất trước
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
   * Get processed purchase orders data từ table
   * @returns Array of processed purchase orders
   */
  const getProcessedPurchaseOrders = () => {
    return table.reactTable.getRowModel().rows.map(row => ({
      id: row.original.id,
      code: row.original.code,
      kiotviet_id: row.original.kiotviet_id,
      supplier_name: row.original.supplier_name,
      total: row.original.total,
      total_payment: row.original.total_payment,
      status: row.original.status,
      purchase_date: row.original.purchase_date,
      created_at: row.original.created_at,
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
    getProcessedPurchaseOrders,
    isLoading,
    totalCount,
  };
};
