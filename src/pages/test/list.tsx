/**
 * Test Page - Simple List để test bug sau khi đổi tab
 * Dùng useList đơn giản để xem có bị bug tương tự không
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { useInvalidate } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { ensureSessionActive } from '@/lib/supabase-session';
import { supabaseClient } from '@/utility';
import { ListView } from '@/components/refine-ui/views/list-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';

/**
 * Customer data type cho test page
 */
interface CustomerData {
  id: string | number;
  kiotviet_id?: number;
  code?: string;
  name?: string;
  contact_number?: string;
  address?: string;
}

/**
 * Test Page Component
 * Test xem có bị bug "không refetch sau khi đổi tab" không
 * Dùng useTable giống Products để test
 */
export const TestList = () => {
  const invalidate = useInvalidate();

  // Tạo columns đơn giản
  const columns = useMemo<ColumnDef<CustomerData>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
      },
      {
        accessorKey: 'code',
        header: 'Code',
      },
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'contact_number',
        header: 'Phone',
      },
    ],
    []
  );

  // Dùng useTable giống Products
  // Thêm queryOptions để force refetch khi window focus và disable stale time
  const table = useTable({
    columns,
    refineCoreProps: {
      resource: 'kv_customers',
      syncWithLocation: true,
      meta: {
        select: 'id, kiotviet_id, code, name, contact_number, address',
        count: 'estimated',
      },
      queryOptions: {
        // Force refetch khi window focus lại
        refetchOnWindowFocus: true,
        // Disable stale time để luôn fetch fresh data
        staleTime: 0,
        // Cache time ngắn để tránh stale data
        gcTime: 0,
      },
    },
  });

  const {
    refineCore: { tableQuery },
  } = table;

  const data = tableQuery.data;
  const isLoading = tableQuery.isLoading;
  const isError = tableQuery.isError;
  const error = tableQuery.error;

  // Refetch khi tab trở thành visible - đơn giản hóa và dùng window focus event
  useEffect(() => {
    const handleFocus = async () => {
      console.log(
        '[TEST PAGE] Window focused, restoring session and refetching...'
      );

      try {
        // Đảm bảo Supabase session được restore
        await ensureSessionActive(supabaseClient);

        // Invalidate để force refetch với đúng pagination từ URL
        // React Query sẽ tự động refetch với queryOptions.refetchOnWindowFocus: true
        invalidate({
          resource: 'kv_customers',
          invalidates: ['list'],
        });

        console.log('[TEST PAGE] Invalidated and will refetch');
      } catch (error) {
        console.error('[TEST PAGE] Error during focus refetch:', error);
      }
    };

    // Dùng window focus thay vì visibilitychange để đảm bảo trigger đúng
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [invalidate]);

  // Chỉ log khi có thay đổi thực sự, tránh infinite loop
  // Sử dụng useRef để track previous values
  const prevStateRef = useRef<{
    isLoading: boolean | undefined;
    isError: boolean;
    dataLength: number;
    total: number | undefined;
  }>({
    isLoading: undefined,
    isError: false,
    dataLength: 0,
    total: undefined,
  });

  useEffect(() => {
    const currentDataLength = Array.isArray(data?.data) ? data.data.length : 0;
    const currentTotal = data?.total;

    // Chỉ log khi có thay đổi thực sự
    const hasChanged =
      prevStateRef.current.isLoading !== isLoading ||
      prevStateRef.current.isError !== isError ||
      prevStateRef.current.dataLength !== currentDataLength ||
      prevStateRef.current.total !== currentTotal;

    if (hasChanged) {
      console.log('[TEST PAGE] State changed:');
      console.log('[TEST PAGE] isLoading:', isLoading);
      console.log('[TEST PAGE] isError:', isError);
      console.log('[TEST PAGE] error:', error);
      console.log('[TEST PAGE] data?.data length:', currentDataLength);
      console.log('[TEST PAGE] data?.total:', currentTotal);
      console.log(
        '[TEST PAGE] table rows:',
        table.reactTable.getRowModel().rows.length
      );

      // Update ref với giá trị mới
      prevStateRef.current = {
        isLoading,
        isError,
        dataLength: currentDataLength,
        total: currentTotal,
      };
    }
  }, [isLoading, isError, data?.data, data?.total, error, table]);

  const handleManualRefetch = () => {
    console.log('[TEST PAGE] Manual refetch clicked');
    invalidate({
      resource: 'kv_customers',
      invalidates: ['all'],
    });
  };

  return (
    <ListView>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Page - Debug Tab Switch Bug</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Trang này dùng useList đơn giản để test xem có bị bug tương tự
              Products/Purchase Orders không.
            </p>
            <p className="text-sm text-muted-foreground">
              Resource: kv_customers | Hook: useList | Rows: 1303
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Manual refetch button */}
              <button
                onClick={handleManualRefetch}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Manual Refetch
              </button>

              {/* Debug info */}
              <div className="p-4 bg-muted rounded-md text-xs space-y-1">
                <div>
                  <strong>isLoading:</strong> {String(isLoading)} (
                  {typeof isLoading})
                </div>
                <div>
                  <strong>isError:</strong> {String(isError)}
                </div>
                <div>
                  <strong>error:</strong> {error ? String(error) : 'null'}
                </div>
                <div>
                  <strong>data type:</strong> {typeof data}
                </div>
                <div>
                  <strong>data?.data type:</strong> {typeof data?.data}
                </div>
                <div>
                  <strong>data?.data length:</strong>{' '}
                  {Array.isArray(data?.data) ? data.data.length : 'N/A'}
                </div>
                <div>
                  <strong>data?.total:</strong> {data?.total ?? 'undefined'}
                </div>
              </div>

              {/* Loading state */}
              {(isLoading === true || isLoading === undefined) && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}

              {/* Error state */}
              {isError && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                  <p className="font-semibold">Error loading data</p>
                  <p className="text-xs mt-1">{String(error)}</p>
                </div>
              )}

              {/* Data display - Dùng DataTable giống Products */}
              {isLoading === false && !isError && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold">
                    Total: {data?.total || 0} records | Showing:{' '}
                    {table.reactTable.getRowModel().rows.length} rows
                  </p>
                  <DataTable table={table} />
                </div>
              )}

              {/* Empty state */}
              {isLoading === false &&
                !isError &&
                (!data?.data ||
                  !Array.isArray(data.data) ||
                  data.data.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No data found</p>
                    <p className="text-xs mt-2">
                      Check console for logs. If you see this after switching
                      tabs, bug is confirmed.
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ListView>
  );
};
