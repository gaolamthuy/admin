/**
 * ProductTableColumns Component
 * Column definitions cho product table với JSX support
 */

import React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { Product } from '@/types';
import { EditButton } from '@/components/refine-ui/buttons/edit';
import { ShowButton } from '@/components/refine-ui/buttons/show';

/**
 * Tạo columns cho product table
 * @param isAdmin - Whether user is admin
 * @returns Array of column definitions
 */
export const createProductTableColumns = (isAdmin: boolean) => {
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
          {isAdmin && (
            <EditButton
              recordItemId={row.original.id}
              size="sm"
              variant="outline"
            />
          )}
          {isAdmin && (
            <ShowButton
              recordItemId={row.original.id}
              size="sm"
              variant="outline"
            />
          )}
        </div>
      ),
      enableSorting: false,
      size: 200,
    }),
  ];
};
