/**
 * Product List Page
 * Sử dụng TanStack Query với filters và conditional rendering cho admin
 * Supports card view and list (table) view with URL param sync
 *
 * @module pages/products/ProductList
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts, useProductCategories } from '@/hooks/useProducts';
import { useIsAdmin } from '@/hooks/useAuth';
import { useUpdateProductPrice } from './hooks/useUpdateProductPrice';
import { ProductCardGrid } from './components/ProductCardGrid';
import { ProductListTable } from './components/ProductListTable';
import type { Product, ProductCard } from '@/types/product';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Heart, LayoutGrid, List } from 'lucide-react';
import { Loader2 } from 'lucide-react';

type ViewMode = 'card' | 'list';

interface FilterState {
  category: string | null;
  isFavorite: boolean;
  sortByPriceDifference: boolean;
  sortByKvStatus: boolean;
  viewMode: ViewMode;
}

export const ProductList = () => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const readFiltersFromURL = (): FilterState => {
    const favoriteParam = searchParams.get('favorite');
    const categoryParam = searchParams.get('category');
    const sortParam = searchParams.get('sort');
    const viewParam = searchParams.get('view');

    return {
      category: categoryParam || null,
      isFavorite: favoriteParam === null ? true : favoriteParam === 'true',
      sortByPriceDifference: sortParam === 'price-diff',
      sortByKvStatus: sortParam === 'kv-status',
      viewMode: viewParam === 'list' ? 'list' : 'card',
    };
  };

  const [filters, setFilters] = useState<FilterState>(readFiltersFromURL);

  useEffect(() => {
    const urlFilters = readFiltersFromURL();
    setFilters(urlFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    const newSearchParams = new URLSearchParams();

    if (!filters.isFavorite) {
      newSearchParams.set('favorite', 'false');
    }

    if (filters.category) {
      newSearchParams.set('category', filters.category);
    }

    if (isAdmin && filters.sortByPriceDifference) {
      newSearchParams.set('sort', 'price-diff');
    } else if (isAdmin && filters.sortByKvStatus) {
      newSearchParams.set('sort', 'kv-status');
    }

    if (filters.viewMode === 'list') {
      newSearchParams.set('view', 'list');
    }

    const newParamsString = newSearchParams.toString();
    const currentParamsString = searchParams.toString();

    if (newParamsString !== currentParamsString) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [filters, isAdmin, setSearchParams, searchParams]);

  const { data: categories = [], isLoading: categoriesLoading } =
    useProductCategories();

  const { data: productsRaw = [], isLoading: productsLoading } = useProducts({
    category: filters.category,
    isFavorite: filters.isFavorite,
    requirePurchaseData: false,
  });

  const updateProductPrice = useUpdateProductPrice();
  const [updatingPriceId, setUpdatingPriceId] = useState<number | null>(null);

  const handleUpdatePrice = async (kiotvietId: number) => {
    setUpdatingPriceId(kiotvietId);
    try {
      await updateProductPrice.mutateAsync(kiotvietId);
    } finally {
      setUpdatingPriceId(null);
    }
  };

  const products = useMemo(() => {
    type ProductWithExtendedFields = Omit<Product, 'id'> & {
      id: string;
      cost_analysis?: import('@/types/product').CostAnalysis | null;
      kiotviet_status?: Record<string, unknown> | null;
    };

    let mappedProducts: ProductWithExtendedFields[];

    if (!isAdmin) {
      mappedProducts = productsRaw.map(p => ({
        ...p,
        id: String(p.id),
      })) as unknown as ProductWithExtendedFields[];
    } else {
      mappedProducts = productsRaw.map(product => ({
        ...product,
        id: String(product.id),
      })) as unknown as ProductWithExtendedFields[];
    }

    if (isAdmin && filters.sortByPriceDifference) {
      mappedProducts.sort((a, b) => {
        const aDiff =
          a.cost_analysis?.cost_diff != null
            ? Math.abs(a.cost_analysis.cost_diff)
            : -Infinity;
        const bDiff =
          b.cost_analysis?.cost_diff != null
            ? Math.abs(b.cost_analysis.cost_diff)
            : -Infinity;
        return bDiff - aDiff;
      });
    }

    if (isAdmin && filters.sortByKvStatus) {
      mappedProducts.sort((a, b) => {
        const aStatus = (a as Record<string, unknown>).kiotviet_status as
          | {
              cost_vs_basecost?: {
                status?: string;
                difference?: number | null;
              };
            }
          | null
          | undefined;
        const bStatus = (b as Record<string, unknown>).kiotviet_status as
          | {
              cost_vs_basecost?: {
                status?: string;
                difference?: number | null;
              };
            }
          | null
          | undefined;

        const aCostCheck = aStatus?.cost_vs_basecost;
        const bCostCheck = bStatus?.cost_vs_basecost;

        const getStatusPriority = (status?: string) => {
          if (status === 'mismatched') return 0;
          if (status === 'matched') return 1;
          return 2;
        };

        const aPriority = getStatusPriority(aCostCheck?.status);
        const bPriority = getStatusPriority(bCostCheck?.status);

        if (aPriority !== bPriority) return aPriority - bPriority;

        const aDiff = Math.abs(Number(aCostCheck?.difference ?? 0));
        const bDiff = Math.abs(Number(bCostCheck?.difference ?? 0));
        return bDiff - aDiff;
      });
    }

    return mappedProducts;
  }, [
    isAdmin,
    productsRaw,
    filters.sortByPriceDifference,
    filters.sortByKvStatus,
  ]);

  const handleShow = (id: string | number) => {
    navigate(`/products/show/${id}`);
  };

  const handleEdit = () => {};
  const handleDelete = () => {};

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const isLoading = productsLoading;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Select
              value={filters.category || 'all'}
              onValueChange={value =>
                setFilters(prev => ({
                  ...prev,
                  category: value === 'all' ? null : value,
                }))
              }
              disabled={categoriesLoading}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map(
                  (cat: { category_id: number; category_name: string }) => (
                    <SelectItem
                      key={cat.category_id}
                      value={String(cat.category_id)}
                    >
                      {cat.category_name}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>

            <Toggle
              aria-label="Toggle yêu thích"
              size="sm"
              variant="outline"
              pressed={filters.isFavorite}
              onPressedChange={pressed =>
                setFilters(prev => ({
                  ...prev,
                  isFavorite: pressed,
                }))
              }
              className="h-10 gap-2 data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary"
            >
              <Heart className="h-4 w-4" />
              <span className="font-medium">Yêu thích</span>
            </Toggle>

            <div className="ml-auto">
              <ToggleGroup
                type="single"
                value={filters.viewMode}
                onValueChange={value => {
                  if (value) {
                    setFilters(prev => ({
                      ...prev,
                      viewMode: value as ViewMode,
                    }));
                  }
                }}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="card" aria-label="Card view">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="List view">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {filters.viewMode === 'card' ? (
                <ProductCardGrid
                  products={paginatedProducts as unknown as ProductCard[]}
                  loading={isLoading}
                  onEdit={handleEdit}
                  onShow={handleShow}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
              ) : (
                <ProductListTable
                  products={
                    paginatedProducts as unknown as Parameters<
                      typeof ProductListTable
                    >[0]['products']
                  }
                  loading={isLoading}
                  onShow={handleShow}
                  isAdmin={isAdmin}
                  onUpdatePrice={handleUpdatePrice}
                  updatingPriceId={updatingPriceId}
                  sortByPriceDifference={filters.sortByPriceDifference}
                  onTogglePriceDiffSort={() =>
                    setFilters(prev => ({
                      ...prev,
                      sortByPriceDifference: !prev.sortByPriceDifference,
                      sortByKvStatus: false,
                    }))
                  }
                  sortByKvStatus={filters.sortByKvStatus}
                  onToggleKvStatusSort={() =>
                    setFilters(prev => ({
                      ...prev,
                      sortByKvStatus: !prev.sortByKvStatus,
                      sortByPriceDifference: false,
                    }))
                  }
                />
              )}

              {products.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Hiển thị</span>
                    <Select
                      value={String(itemsPerPage)}
                      onValueChange={value => {
                        setItemsPerPage(Number(value));
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span>mỗi trang</span>
                  </div>

                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() =>
                              setCurrentPage(prev => Math.max(1, prev - 1))
                            }
                            className={
                              currentPage === 1
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>

                        {currentPage > 3 && (
                          <>
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCurrentPage(1)}
                                className="cursor-pointer"
                              >
                                1
                              </PaginationLink>
                            </PaginationItem>
                            {currentPage > 4 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                          </>
                        )}

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            page =>
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 &&
                                page <= currentPage + 1)
                          )
                          .map((page, index, array) => {
                            const prevPage = array[index - 1];
                            const showEllipsisBefore =
                              prevPage && page - prevPage > 1;

                            return (
                              <div key={page} className="contents">
                                {showEllipsisBefore && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(page)}
                                    isActive={currentPage === page}
                                    className="cursor-pointer"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              </div>
                            );
                          })}

                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && (
                              <PaginationItem>
                                <PaginationEllipsis />
                              </PaginationItem>
                            )}
                            <PaginationItem>
                              <PaginationLink
                                onClick={() => setCurrentPage(totalPages)}
                                className="cursor-pointer"
                              >
                                {totalPages}
                              </PaginationLink>
                            </PaginationItem>
                          </>
                        )}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() =>
                              setCurrentPage(prev =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            className={
                              currentPage === totalPages
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductList;
