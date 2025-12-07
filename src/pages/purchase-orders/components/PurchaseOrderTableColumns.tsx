/**
 * PurchaseOrderTableColumns Component
 * Column definitions cho purchase order table với JSX support
 */

import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { PurchaseOrder } from '../types/purchase-order-list';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';
import { formatDate, formatDaysAgo } from '@/utils/date';

// Helper functions for status mapping (reserved for future use)
// const getStatusLabel = (status: number | null): string => {
//   if (status === null) return 'Chưa xác định';
//   const statusMap: Record<number, string> = {
//     0: 'Nháp',
//     1: 'Đã duyệt',
//     2: 'Đã hủy',
//     3: 'Hoàn thành',
//   };
//   return statusMap[status] || `Trạng thái ${status}`;
// };

// const getStatusVariant = (
//   status: number | null
// ): 'default' | 'secondary' | 'destructive' | 'outline' => {
//   if (status === null) return 'outline';
//   const variantMap: Record<
//     number,
//     'default' | 'secondary' | 'destructive' | 'outline'
//   > = {
//     0: 'secondary',
//     1: 'default',
//     2: 'destructive',
//     3: 'default',
//   };
//   return variantMap[status] || 'outline';
// };

/**
 * Tạo columns cho purchase order table
 * @param isAdmin - Whether user is admin
 * @param onEdit - Edit action handler
 * @param onShow - Show action handler
 * @returns Array of column definitions
 */
export const createPurchaseOrderTableColumns = (
  isAdmin: boolean,
  onEdit?: (id: string | number) => void,
  onShow?: (id: string | number) => void
) => {
  const columnHelper = createColumnHelper<PurchaseOrder>();

  return [
    columnHelper.accessor('id', {
      id: 'id',
      header: 'ID',
      enableSorting: false,
      size: 80,
    }),
    columnHelper.accessor('code', {
      id: 'code',
      header: 'Mã đơn',
      enableSorting: true,
      size: 150,
      cell: ({ getValue }) => {
        const code = getValue();
        return (
          <div className="max-w-xs">
            <p className="font-medium truncate">{code || '-'}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor('supplier_name', {
      id: 'supplier',
      header: 'Nhà cung cấp',
      enableSorting: false,
      cell: ({ getValue }) => {
        const supplier = getValue();
        return supplier || '-';
      },
    }),
    columnHelper.accessor('purchase_date', {
      id: 'purchase_date',
      header: 'Ngày mua',
      enableSorting: true,
      cell: ({ getValue }) => {
        const date = getValue();
        if (!date) return '-';
        return (
          <div>
            <div className="font-medium">{formatDate(date)}</div>
            <div className="text-xs text-muted-foreground">
              {formatDaysAgo(date)}
            </div>
          </div>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Thao tác',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {isAdmin && onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(row.original.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onShow && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShow(row.original.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
      enableSorting: false,
      size: 200,
    }),
  ];
};
