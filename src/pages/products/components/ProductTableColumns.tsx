/**
 * ProductTableColumns Component
 * Column definitions cho product table với JSX support
 */

import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Eye, Edit } from 'lucide-react';

/**
 * Tạo columns cho product table
 * @param isAdmin - Whether user is admin
 * @param onEdit - Edit action handler
 * @param onShow - Show action handler
 * @returns Array of column definitions
 */
export const createProductTableColumns = (
  isAdmin: boolean,
  onEdit?: (id: string | number) => void,
  onShow?: (id: string | number) => void
) => {
  const columnHelper = createColumnHelper<Product>();

  return [
    columnHelper.accessor('id', {
      id: 'id',
      header: 'ID',
      enableSorting: false,
      size: 80,
    }),
    columnHelper.accessor('code', {
      id: 'code',
      header: 'Mã SP',
      enableSorting: true,
      size: 120,
    }),
    columnHelper.accessor('name', {
      id: 'name',
      header: 'Tên sản phẩm',
      enableSorting: true,
      cell: ({ getValue }) => {
        const name = getValue();
        return (
          <div className="max-w-xs">
            <p className="font-medium truncate">{name}</p>
          </div>
        );
      },
    }),
    columnHelper.accessor('category_name', {
      id: 'category',
      header: 'Danh mục',
      enableSorting: false,
      cell: ({ getValue }) => {
        const category = getValue();
        return category || '-';
      },
    }),
    columnHelper.accessor('base_price', {
      id: 'price',
      header: 'Giá bán',
      enableSorting: true,
      cell: ({ getValue }) => {
        const price = getValue();
        return price ? `${price.toLocaleString()} VND` : '-';
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
