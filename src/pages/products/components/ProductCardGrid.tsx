import { Skeleton } from '@/components/ui/skeleton';
import React, { useMemo } from 'react';
import { ProductCardGridProps } from '@/types';
import type { ProductCard as ProductCardModel } from '@/types';
import { Badge } from '@/components/ui/badge';
import { ProductCard } from './ProductCard';

export interface ProductGroupItem<T> {
  key: string;
  label: string;
  products: T[];
  isContinued: boolean;
}

/**
 * ProductCardGrid Component
 * Hiển thị sản phẩm dưới dạng grid responsive, nhóm theo danh mục
 */
export const ProductCardGrid: React.FC<
  Omit<ProductCardGridProps, 'products'> & {
    isAdmin?: boolean;
    groups: Array<ProductGroupItem<ProductCardModel>>;
  }
> = ({
  groups,
  loading = false,
  onEdit: _onEdit, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDelete,
  onShow,
  isAdmin = false,
}) => {
  const totalProducts = useMemo(
    () => groups.reduce((sum, g) => sum + g.products.length, 0),
    [groups]
  );

  // Memoize product cards theo nhóm để tránh re-render khi parent re-render
  const groupedCards = useMemo(
    () =>
      groups.map(group => ({
        ...group,
        cards: group.products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onShow={onShow}
            onDelete={onDelete}
            isAdmin={isAdmin}
          />
        )),
      })),
    [groups, onShow, onDelete, isAdmin]
  );

  // Loading skeleton
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
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
  if (totalProducts === 0) {
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

  return (
    <div className="space-y-5">
      {groupedCards.map(group => (
        <section key={group.key} className="space-y-2">
          <div className="flex items-center gap-2 border-b pb-1.5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h3>
            <Badge variant="secondary" className="font-normal">
              {group.products.length} SP
            </Badge>
            {group.isContinued && (
              <span className="text-xs text-muted-foreground/60">(tiếp)</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {group.cards}
          </div>
        </section>
      ))}
    </div>
  );
};

export default ProductCardGrid;
