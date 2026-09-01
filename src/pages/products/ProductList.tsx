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
import { useSyncProducts } from './hooks/useSyncProducts';

// Rename hook for clarity
const useDownloadProducts = useSyncProducts;
import { ProductCardGrid } from './components/ProductCardGrid';
import { ProductListTable } from './components/ProductListTable';
import type { Product } from '@/types/product';
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
import { Heart, LayoutGrid, List, Download, Upload } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ViewMode = 'card' | 'list';

interface FilterState {
  category: string | null;
  isFavorite: boolean;
  sortByPriceDifference: boolean;
  sortByKvStatus: boolean;
  sortByChangelog: boolean;
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
      sortByChangelog: sortParam === 'changelog',
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
    } else if (isAdmin && filters.sortByChangelog) {
      newSearchParams.set('sort', 'changelog');
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
  const downloadProducts = useDownloadProducts();
  const [updatingPriceId, setUpdatingPriceId] = useState<number | null>(null);

  const handleUpdatePrice = async (kiotvietId: number) => {
    setUpdatingPriceId(kiotvietId);
    try {
      return await updateProductPrice.mutateAsync(kiotvietId);
    } finally {
      setUpdatingPriceId(null);
    }
  };

  // Map rank của category theo id + tên (từ kv_product_categories)
  const categoryRankMap = useMemo(() => {
    const m = new Map<number | string, number>();
    categories.forEach(c => {
      const rank = c.rank ?? 1e9;
      m.set(c.category_id, rank);
      m.set(c.category_name, rank);
    });
    return m;
  }, [categories]);

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

    if (isAdmin && filters.sortByChangelog) {
      mappedProducts.sort((a, b) => {
        const getLatestChangelogTime = (product: ProductWithExtendedFields) => {
          const changelog = (product as Record<string, unknown>).changelog as
            | Record<string, Array<{ at: string }>>
            | null
            | undefined;
          if (!changelog) return -Infinity;
          let latest: number | null = null;
          for (const entries of Object.values(changelog)) {
            for (const entry of entries) {
              const t = new Date(entry.at).getTime();
              if (latest === null || t > latest) latest = t;
            }
          }
          return latest ?? -Infinity;
        };
        return getLatestChangelogTime(b) - getLatestChangelogTime(a);
      });
    }

    // Mặc định: sort theo cost tăng dần (SP rẻ trên đầu) — áp khi không
    // bật sort admin nào; các sort admin vẫn ưu tiên khi được bật
    const anyAdminSort =
      isAdmin &&
      (filters.sortByPriceDifference ||
        filters.sortByKvStatus ||
        filters.sortByChangelog);
    if (!anyAdminSort) {
      const costOf = (p: ProductWithExtendedFields) => {
        const ca = p.cost_analysis;
        const calcFromPo = (p as Record<string, unknown>).calculate_from_po as
          | { latest_total_cost_per_unit?: number | null }
          | null
          | undefined;
        const v =
          ca?.inventory_cost ??
          ca?.latest_po_price ??
          calcFromPo?.latest_total_cost_per_unit;
        return v != null ? Number(v) : Number.POSITIVE_INFINITY;
      };
      mappedProducts.sort((a, b) => costOf(a) - costOf(b));
    }

    // Nhóm theo danh mục làm khóa sort chính (sort stable → thứ tự trong nhóm
    // giữ nguyên theo các sort bên trên). Thứ tự nhóm theo rank từ
    // kv_product_categories; "Chưa phân loại" luôn cuối. Mảng liên tục theo
    // category để phân trang không xé nhóm xen kẽ.
    const categoryOf = (p: ProductWithExtendedFields) =>
      (p.category_name ?? '').trim() || 'Chưa phân loại';
    const rankOf = (p: ProductWithExtendedFields) => {
      if (!(p.category_name ?? '').trim()) return Infinity;
      return (
        categoryRankMap.get(p.category_id ?? -1) ??
        categoryRankMap.get((p.category_name ?? '').trim()) ??
        1e9
      );
    };
    mappedProducts.sort((a, b) => {
      const rankDiff = rankOf(a) - rankOf(b);
      if (rankDiff !== 0) return rankDiff;
      return categoryOf(a).localeCompare(categoryOf(b), 'vi');
    });

    return mappedProducts;
  }, [
    isAdmin,
    productsRaw,
    categoryRankMap,
    filters.sortByPriceDifference,
    filters.sortByKvStatus,
    filters.sortByChangelog,
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

  // Nhóm sản phẩm trên trang hiện tại (sau pagination — nhóm có thể lặp lại
  // ở trang kế nếu bị cắt ngang, đánh dấu isContinued)
  const productGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const labelOf = (p: (typeof products)[number]) =>
      (p.category_name ?? '').trim() || 'Chưa phân loại';

    const groups: Array<{
      key: string;
      label: string;
      products: Array<(typeof products)[number]>;
      isContinued: boolean;
    }> = [];

    paginatedProducts.forEach((p, idx) => {
      const label = labelOf(p);
      const last = groups[groups.length - 1];
      if (!last || last.key !== label) {
        const globalIdx = startIndex + idx;
        const isContinued =
          globalIdx > 0 && labelOf(products[globalIdx - 1]) === label;
        groups.push({ key: label, label, products: [p], isContinued });
      } else {
        last.products.push(p);
      }
    });
    return groups;
  }, [paginatedProducts, products, currentPage, itemsPerPage]);

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
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 mb-6">
            <div className="flex items-center gap-2">
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
                <SelectTrigger className="w-[160px] sm:w-[200px]">
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
                className="h-9 gap-1.5 px-2.5 data-[state=on]:bg-transparent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary"
              >
                <Heart className="h-4 w-4" />
                <span className="font-medium hidden xs:inline">Yêu thích</span>
              </Toggle>
            </div>

            <div className="flex items-center gap-2 sm:ml-auto">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5"
                  disabled={downloadProducts.isPending}
                  onClick={() => downloadProducts.mutate()}
                >
                  {downloadProducts.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="font-medium hidden sm:inline">
                    {downloadProducts.isPending ? 'Đang tải...' : 'Download SP'}
                  </span>
                </Button>
              )}

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
                  groups={
                    productGroups as unknown as Parameters<
                      typeof ProductCardGrid
                    >[0]['groups']
                  }
                  loading={isLoading}
                  onEdit={handleEdit}
                  onShow={handleShow}
                  onDelete={handleDelete}
                  isAdmin={isAdmin}
                />
              ) : (
                <ProductListTable
                  groups={
                    productGroups as unknown as Parameters<
                      typeof ProductListTable
                    >[0]['groups']
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
                      sortByChangelog: false,
                    }))
                  }
                  sortByKvStatus={filters.sortByKvStatus}
                  onToggleKvStatusSort={() =>
                    setFilters(prev => ({
                      ...prev,
                      sortByKvStatus: !prev.sortByKvStatus,
                      sortByPriceDifference: false,
                      sortByChangelog: false,
                    }))
                  }
                  sortByChangelog={filters.sortByChangelog}
                  onToggleChangelogSort={() =>
                    setFilters(prev => ({
                      ...prev,
                      sortByChangelog: !prev.sortByChangelog,
                      sortByPriceDifference: false,
                      sortByKvStatus: false,
                    }))
                  }
                />
              )}

              {products.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
