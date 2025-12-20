import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useInvalidate } from '@refinedev/core';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { ListView } from '@/components/refine-ui/views/list-view';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PurchaseOrderListView } from './components';
import {
  usePurchaseOrderView,
  usePurchaseOrderFilters,
  usePurchaseOrderTable,
  usePurchaseOrderActions,
} from './hooks';
import { ensureSessionActive } from '@/lib/supabase-session';
import { supabaseClient } from '@/utility';

/**
 * Component danh sách đơn mua hàng - Hook-based version
 * Hiển thị tất cả đơn mua hàng từ bảng kv_purchase_orders với 2 view modes: list và card
 * Sử dụng custom hooks để tách logic và improve maintainability
 */
export const PurchaseOrderList = () => {
  // Hooks
  const invalidate = useInvalidate();
  const { viewMode, setViewMode } = usePurchaseOrderView();
  const { isAdmin } = useIsAdmin();
  const {
    selectedStatus,
    setSelectedStatus,
    selectedSupplier,
    setSelectedSupplier,
    filters,
  } = usePurchaseOrderFilters();
  const { onEdit, onShow } = usePurchaseOrderActions();
  const { table, getProcessedPurchaseOrders } = usePurchaseOrderTable(
    isAdmin,
    filters,
    onEdit,
    onShow
  );

  // Sync filters to table khi filters thay đổi
  useEffect(() => {
    table.refineCore.setFilters(filters, 'replace');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]); // Chỉ depend on filters, không depend on table.refineCore

  // Refetch khi window focus - đơn giản hóa và dùng window focus event
  useEffect(() => {
    const handleFocus = async () => {
      console.log(
        '[PURCHASE ORDERS PAGE] Window focused, restoring session and refetching...'
      );

      try {
        await ensureSessionActive(supabaseClient);
        invalidate({
          resource: 'kv_purchase_orders',
          invalidates: ['list'],
        });
        console.log('[PURCHASE ORDERS PAGE] Invalidated and will refetch');
      } catch (error) {
        console.error(
          '[PURCHASE ORDERS PAGE] Error during focus refetch:',
          error
        );
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [invalidate]);

  // Get processed purchase orders data (reserved for future use)
  getProcessedPurchaseOrders(); // Call để đảm bảo data được processed

  return (
    <ListView>
      <div className="space-y-6">
        <PurchaseOrderListView
          viewMode={viewMode}
          onViewModeChange={(value: string) =>
            setViewMode(value as 'list' | 'card')
          }
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedSupplier={selectedSupplier}
          onSupplierChange={setSelectedSupplier}
          isAdmin={isAdmin}
        >
          {viewMode === 'list' ? (
            // List View - DataTable
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle>Danh sách đơn mua hàng</CardTitle>
                <Button asChild>
                  <Link to="/purchase-orders/create">Tạo đơn mua hàng</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedStatus !== null
                      ? `Hiển thị đơn mua hàng với trạng thái ${selectedStatus}`
                      : selectedSupplier !== null
                        ? `Hiển thị đơn mua hàng từ nhà cung cấp ${selectedSupplier} (status = 3)`
                        : 'Hiển thị đơn mua hàng với trạng thái hoàn thành (status = 3)'}
                  </p>
                </div>
                <DataTable table={table} />
              </CardContent>
            </Card>
          ) : (
            // Card View - Có thể thêm PurchaseOrderCardGrid sau
            <Card>
              <CardHeader>
                <CardTitle>Card View</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Card view sẽ được implement sau
                </p>
              </CardContent>
            </Card>
          )}
        </PurchaseOrderListView>
      </div>
    </ListView>
  );
};
