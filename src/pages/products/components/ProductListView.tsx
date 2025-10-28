import { Grid, List } from 'lucide-react';
import React from 'react';
import { ProductListViewProps } from '@/types';
import { ProductCategoryFilter } from './ProductCategoryFilter';
import { ProductFavoriteFilter } from './ProductFavoriteFilter';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * ProductListView Component
 * Header với view mode toggle (List/Grid)
 */
export const ProductListView: React.FC<ProductListViewProps> = ({
  viewMode,
  onViewModeChange,
  children,
  selectedCategory,
  onCategoryChange,
  isFavorite,
  onFavoriteChange,
  isAdmin = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header với View Mode Toggle và Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Danh sách sản phẩm</h2>

        {/* Right side: Filter + View Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <ProductCategoryFilter
            value={selectedCategory}
            onChange={onCategoryChange}
            placeholder="Danh mục"
            allowClear
            size="md"
          />

          {/* Favorite Filter */}
          <ProductFavoriteFilter
            pressed={isFavorite}
            onPressedChange={onFavoriteChange}
            aria-label="Toggle favorite products"
            size="default"
          />

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={onViewModeChange}>
            <TabsList
              className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <TabsTrigger value="card" className="gap-2">
                <List className="h-4 w-4" />
                <div className="hidden sm:block">Thẻ</div>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="list" className="gap-2">
                  <Grid className="h-4 w-4" />
                  <div className="hidden sm:block">Danh sách</div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">{children}</div>
    </div>
  );
};

export default ProductListView;
