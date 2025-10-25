import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useNavigate } from 'react-router';
import React, { useState, useMemo, useEffect } from 'react';
import { useIsAdmin } from '@/hooks/useIsAdmin';

import { EditButton } from '@/components/refine-ui/buttons/edit';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import { ListView } from '@/components/refine-ui/views/list-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import {
  ProductCardGrid,
  ProductListView,
  ProductCategoryFilter,
  ProductFavoriteFilter,
} from './components';
import { useProductView } from './hooks';
import { X } from 'lucide-react';

/**
 * Component danh sách sản phẩm
 * Hiển thị tất cả sản phẩm từ bảng kv_products với 2 view modes: list và card
 */
export const ProductList = () => {
  const { viewMode, setViewMode } = useProductView();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(true); // Auto active favorite filter
  const { isAdmin } = useIsAdmin(); // Get admin status

  const columns = React.useMemo(() => {
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
  }, [isAdmin]); // Include isAdmin in dependencies

  const table = useTable({
    columns,
    refineCoreProps: {
      syncWithLocation: true,
      meta: {
        select: '*, kv_product_categories!inner(category_id,glt_is_active)',
        count: 'estimated', // Performance optimization theo docs
      },
      filters: {
        initial: [
          {
            field: 'is_active',
            operator: 'eq',
            value: true,
          },
          {
            field: 'master_unit_id',
            operator: 'null',
            value: true,
          },
          {
            field: 'kv_product_categories.glt_is_active',
            operator: 'eq',
            value: true,
          },
          {
            field: 'glt_labelprint_favorite',
            operator: 'eq',
            value: true,
          },
        ],
      },
      sorters: {
        initial: [
          {
            field: 'base_price',
            order: 'asc',
          },
        ],
      },
    },
  });

  // Sync filters to data source (theo example từ admin)
  useEffect(() => {
    const filters = [
      {
        field: 'is_active',
        operator: 'eq' as const,
        value: true,
      },
      {
        field: 'master_unit_id',
        operator: 'null' as const,
        value: true,
      },
      {
        field: 'kv_product_categories.glt_is_active',
        operator: 'eq' as const,
        value: true,
      },
    ];

    // Add favorite filter based on isFavorite state
    if (isFavorite) {
      filters.push({
        field: 'glt_labelprint_favorite',
        operator: 'eq' as const,
        value: true,
      });
    }

    // Add category filter if a specific category is selected
    if (selectedCategory) {
      filters.push({
        field: 'kv_product_categories.category_id',
        operator: 'eq' as const,
        value: parseInt(selectedCategory, 10) as any,
      });
    }

    table.refineCore.setFilters(filters, 'replace');
  }, [selectedCategory, isFavorite]); // Remove table.refineCore to prevent infinite loop

  // Handle edit action
  const handleEdit = (id: string | number) => {
    navigate(`/products/edit/${id}`);
  };

  // Handle show action
  const handleShow = (id: string | number) => {
    navigate(`/products/show/${id}`);
  };

  // Handle delete action
  const handleDelete = () => {
    // Delete logic handled by DeleteButton component
  };

  // Get products data từ table (đã được filter từ server)
  const filteredProducts = table.reactTable.getRowModel().rows.map(row => ({
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

  // Check if table is loading
  const isLoading = table.refineCore.tableQuery.isLoading;

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
                    {isFavorite
                      ? `Hiển thị ${filteredProducts.length} sản phẩm yêu thích`
                      : selectedCategory
                        ? `Hiển thị ${filteredProducts.length} sản phẩm trong danh mục`
                        : 'Hiển thị tất cả sản phẩm trong hệ thống'}
                  </p>
                </div>
                <DataTable table={table} />
              </CardContent>
            </Card>
          ) : (
            // Card View - ProductCardGrid
            <ProductCardGrid
              products={filteredProducts}
              loading={isLoading}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShow={handleShow}
            />
          )}
        </ProductListView>
      </div>
    </ListView>
  );
};
