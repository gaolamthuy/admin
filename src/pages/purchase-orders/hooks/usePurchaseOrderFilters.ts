/**
 * usePurchaseOrderFilters Hook
 * Quản lý filters cho purchase order list với type safety
 */

import { useState, useMemo, useCallback } from 'react';
import {
  PurchaseOrderFilter,
  PurchaseOrderTableFilters,
} from '../types/purchase-order-list';

/**
 * Hook quản lý filters cho purchase order list
 * @returns Object chứa filter state và functions
 */
export const usePurchaseOrderFilters = () => {
  const [selectedStatus, setSelectedStatus] = useState<number | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<number | null>(null);

  /**
   * Tạo base filters cho table
   * Mặc định chỉ hiển thị đơn có status = 3 (hoàn thành)
   * Không lấy status = 4 (hủy) vì chỉ lấy status = 3
   * Chỉ áp dụng khi selectedStatus = null (chưa có filter status được chọn)
   * @returns Array of PurchaseOrderFilter
   */
  const baseFilters = useMemo((): PurchaseOrderFilter[] => {
    // Chỉ thêm base filter status = 3 khi selectedStatus = null
    // Nếu selectedStatus được set, sẽ dùng dynamic filter thay thế
    if (selectedStatus === null) {
      return [
        {
          field: 'status',
          operator: 'eq',
          value: 3, // Chỉ lấy status = 3 (hoàn thành), tự động loại trừ status = 4 (hủy)
        },
      ];
    }
    return [];
  }, [selectedStatus]);

  /**
   * Tạo dynamic filters dựa trên state
   * Nếu selectedStatus = null, base filter (status = 3) sẽ được dùng
   * Nếu selectedStatus được set, sẽ override base filter
   * @returns Array of PurchaseOrderFilter
   */
  const dynamicFilters = useMemo((): PurchaseOrderFilter[] => {
    const filters: PurchaseOrderFilter[] = [];

    // Add status filter if selected (override base filter)
    // Nếu selectedStatus = null, base filter (status = 3) sẽ được dùng
    if (selectedStatus !== null) {
      filters.push({
        field: 'status',
        operator: 'eq',
        value: selectedStatus,
      });
    }

    // Add supplier filter if selected
    if (selectedSupplier !== null) {
      filters.push({
        field: 'supplier_id',
        operator: 'eq',
        value: selectedSupplier,
      });
    }

    return filters;
  }, [selectedStatus, selectedSupplier]);

  /**
   * Combine base và dynamic filters
   * @returns Complete filter array
   */
  const allFilters = useMemo(
    (): PurchaseOrderFilter[] => [...baseFilters, ...dynamicFilters],
    [baseFilters, dynamicFilters]
  );

  /**
   * Reset all filters về default state
   */
  const resetFilters = useCallback(() => {
    setSelectedStatus(null);
    setSelectedSupplier(null);
  }, []);

  /**
   * Clear status filter
   */
  const clearStatusFilter = useCallback(() => {
    setSelectedStatus(null);
  }, []);

  /**
   * Clear supplier filter
   */
  const clearSupplierFilter = useCallback(() => {
    setSelectedSupplier(null);
  }, []);

  /**
   * Get current filter state
   * @returns PurchaseOrderTableFilters object
   */
  const getFilterState = useCallback(
    (): PurchaseOrderTableFilters => ({
      selectedStatus,
      selectedSupplier,
    }),
    [selectedStatus, selectedSupplier]
  );

  return {
    // State
    selectedStatus,
    selectedSupplier,

    // Setters
    setSelectedStatus,
    setSelectedSupplier,

    // Computed
    filters: allFilters,
    baseFilters,
    dynamicFilters,

    // Actions
    resetFilters,
    clearStatusFilter,
    clearSupplierFilter,
    getFilterState,
  };
};
