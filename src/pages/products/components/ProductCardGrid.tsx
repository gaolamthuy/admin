import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo } from 'react';
import { ProductCardGridProps } from '@/types';
import { ProductCard } from './ProductCard';

/**
 * ProductCardGrid Component
 * Hiển thị danh sách sản phẩm dưới dạng grid responsive
 */
export const ProductCardGrid: React.FC<
  ProductCardGridProps & { isAdmin?: boolean }
> = ({
  products,
  loading = false,
  onEdit: _onEdit, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDelete,
  onShow,
  isAdmin = false,
}) => {
  // Memoize product cards để tránh re-render khi parent re-render
  // Phải đặt trước các early returns để tuân thủ Rules of Hooks
  const productCards = useMemo(
    () =>
      products && products.length > 0
        ? products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onShow={onShow}
              onDelete={onDelete}
              isAdmin={isAdmin}
            />
          ))
        : null,
    [products, onShow, onDelete, isAdmin]
  );

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
    console.log('ProductCardGrid: Empty products', {
      products,
      length: products?.length,
    });
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

  console.log('ProductCardGrid: Rendering products', products.length);

  // Grid layout
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {productCards}
    </div>
  );
};

export default ProductCardGrid;
