import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';
import { ProductCardGridProps } from '@/types';
import { ProductCard } from './ProductCard';

/**
 * ProductCardGrid Component
 * Hiển thị danh sách sản phẩm dưới dạng grid responsive
 */
export const ProductCardGrid: React.FC<ProductCardGridProps> = ({
  products,
  loading = false,
  onEdit: _onEdit, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDelete,
  onShow,
}) => {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
          <p className="text-gray-400 text-sm mt-2">
            Hãy thêm sản phẩm mới để bắt đầu
          </p>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onShow={onShow}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ProductCardGrid;
