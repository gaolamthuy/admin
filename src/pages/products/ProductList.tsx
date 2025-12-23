/**
 * Product List Page
 * Sử dụng TanStack Query với filters và conditional rendering cho admin
 *
 * @module pages/products/ProductList
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useProducts, useProductCategories } from '@/hooks/useProducts';
import { useIsAdmin } from '@/hooks/useAuth';
import { useProductPriceDifference } from './hooks/useProductPriceDifference';
import { ProductCardGrid } from './components/ProductCardGrid';
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
import { Heart } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { ProductPriceDifferenceFilter } from './components/ProductPriceDifferenceFilter';
import { AdminFilters } from '@/components/admin';

/**
 * Filter state interface
 */
interface FilterState {
  category: string | null;
  isFavorite: boolean;
  sortByPriceDifference: boolean; // Admin only: sort theo cost_diff_from_latest_po
}

/**
 * Product List Page Component
 */
export const ProductList = () => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Đọc filters từ URL params
   * Default: favorite = true, category = null, sortByPriceDifference = false
   */
  const readFiltersFromURL = (): FilterState => {
    const favoriteParam = searchParams.get('favorite');
    const categoryParam = searchParams.get('category');
    const sortParam = searchParams.get('sort');

    return {
      category: categoryParam || null,
      // Default favorite = true nếu không có param trong URL
      isFavorite: favoriteParam === null ? true : favoriteParam === 'true',
      sortByPriceDifference: sortParam === 'price-diff',
    };
  };

  // Filters state - khởi tạo từ URL params
  const [filters, setFilters] = useState<FilterState>(readFiltersFromURL);

  // Sync filters với URL params khi URL thay đổi (browser back/forward)
  useEffect(() => {
    const urlFilters = readFiltersFromURL();
    setFilters(urlFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]); // Chỉ sync khi URL params thay đổi từ bên ngoài

  // Sync filters với URL params khi filters thay đổi
  useEffect(() => {
    const newSearchParams = new URLSearchParams();

    // Chỉ thêm favorite vào URL nếu khác default (true)
    // Nếu favorite = false thì thêm ?favorite=false
    // Nếu favorite = true thì không thêm (vì là default)
    if (!filters.isFavorite) {
      newSearchParams.set('favorite', 'false');
    }

    // Thêm category nếu có
    if (filters.category) {
      newSearchParams.set('category', filters.category);
    }

    // Thêm sort nếu có (admin only)
    if (isAdmin && filters.sortByPriceDifference) {
      newSearchParams.set('sort', 'price-diff');
    }

    // Update URL mà không trigger navigation
    const newParamsString = newSearchParams.toString();
    const currentParamsString = searchParams.toString();

    // Chỉ update nếu khác nhau để tránh infinite loop
    if (newParamsString !== currentParamsString) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [filters, isAdmin, setSearchParams, searchParams]);

  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } =
    useProductCategories();

  // Fetch products:
  // - Admin: chỉ lấy products có purchase data (requirePurchaseData: true)
  // - Non-admin: lấy tất cả products (requirePurchaseData: false)
  const { data: productsRaw = [], isLoading: productsLoading } = useProducts({
    category: filters.category,
    isFavorite: filters.isFavorite,
    requirePurchaseData: isAdmin, // Admin: chỉ products có purchase data
  });

  // Fetch inventory costs cho admin để tính cost_difference
  const {
    products: priceDifferenceProducts = [],
    loading: priceDifferenceLoading,
  } = useProductPriceDifference(isAdmin);

  // Map products với price difference data và sort (chỉ cho admin)
  const products = useMemo(() => {
    type ProductWithExtendedFields = Omit<Product, 'id'> & {
      id: string; // Convert to string for ProductCard compatibility
      priceDifference?: number | null;
      priceDifferencePercent?: number | null;
      inventoryCost?: number | null;
      latestPriceDifference?: number | null;
      latestPriceDifferencePercent?: number | null;
      latestPurchaseCost?: number | null;
      costDiffFromLatestPo?: number | null;
    };

    let mappedProducts: ProductWithExtendedFields[];

    if (!isAdmin) {
      // Non-admin: chỉ convert id sang string
      mappedProducts = productsRaw.map(p => ({
        ...p,
        id: String(p.id),
      })) as unknown as ProductWithExtendedFields[];
    } else {
      // Admin: map với price difference data
      mappedProducts = productsRaw.map(product => {
        // Tìm matching price difference data (có inventory cost)
        const priceDiffData = priceDifferenceProducts.find(
          p => p.product_id === Number(product.id)
        );

        // Lưu latest_price_difference gốc từ v_products_admin (trước khi override)
        const productWithExt = product as unknown as ProductWithExtendedFields;
        const originalLatestPriceDifference =
          productWithExt.priceDifference || null;
        const originalLatestPriceDifferencePercent =
          productWithExt.priceDifferencePercent || null;

        return {
          ...product,
          id: String(product.id),
          // Override price difference với cost_difference nếu có (từ inventory)
          priceDifference:
            priceDiffData?.cost_difference !== null &&
            priceDiffData?.cost_difference !== undefined
              ? priceDiffData.cost_difference
              : originalLatestPriceDifference,
          priceDifferencePercent:
            priceDiffData?.cost_difference_percent !== null &&
            priceDiffData?.cost_difference_percent !== undefined
              ? priceDiffData.cost_difference_percent
              : originalLatestPriceDifferencePercent,
          inventoryCost: priceDiffData?.inventory_cost || null,
          // latest_price_difference từ v_products_admin (giữ nguyên giá trị gốc)
          latestPriceDifference: originalLatestPriceDifference,
          latestPriceDifferencePercent: originalLatestPriceDifferencePercent,
          latestPurchaseCost: productWithExt.latestPurchaseCost || null,
          // cost_diff_from_latest_po từ v_products_admin (inventory_cost - latest_total_cost_per_unit)
          costDiffFromLatestPo: productWithExt.costDiffFromLatestPo || null,
        } as ProductWithExtendedFields;
      });
    }

    // Sort theo cost_diff_from_latest_po nếu toggle on (admin only)
    if (isAdmin && filters.sortByPriceDifference) {
      mappedProducts.sort((a, b) => {
        const aDiff =
          a.costDiffFromLatestPo !== null &&
          a.costDiffFromLatestPo !== undefined
            ? Number(a.costDiffFromLatestPo)
            : -Infinity;
        const bDiff =
          b.costDiffFromLatestPo !== null &&
          b.costDiffFromLatestPo !== undefined
            ? Number(b.costDiffFromLatestPo)
            : -Infinity;

        // Sort descending (lớn nhất trước)
        return bDiff - aDiff;
      });
    }

    return mappedProducts;
  }, [
    isAdmin,
    productsRaw,
    priceDifferenceProducts,
    filters.sortByPriceDifference,
  ]);

  const handleShow = (id: string | number) => {
    navigate(`/products/show/${id}`);
  };

  const handleEdit = () => {
    // Not needed per requirements
  };

  const handleDelete = () => {
    // Not needed per requirements
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return products.slice(startIndex, endIndex);
  }, [products, currentPage]);

  // Total pages
  const totalPages = Math.ceil(products.length / itemsPerPage);

  // Reset to page 1 when products change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Loading state
  const isLoading = productsLoading || (isAdmin && priceDifferenceLoading);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters - dùng chung cho tất cả users */}
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

            {/* Admin Filter: Sort theo Giá chênh lệch */}
            <AdminFilters>
              <ProductPriceDifferenceFilter
                pressed={filters.sortByPriceDifference}
                onPressedChange={pressed =>
                  setFilters(prev => ({
                    ...prev,
                    sortByPriceDifference: pressed,
                  }))
                }
                aria-label="Sort by price difference"
              />
            </AdminFilters>
          </div>

          {/* Products Display */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <ProductCardGrid
                products={paginatedProducts as unknown as ProductCard[]}
                loading={isLoading}
                onEdit={handleEdit}
                onShow={handleShow}
                onDelete={handleDelete}
                isAdmin={isAdmin}
              />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex justify-center">
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

                      {/* First page */}
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

                      {/* Page numbers around current page */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          page =>
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                        )
                        .map((page, index, array) => {
                          // Add ellipsis if there's a gap
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

                      {/* Last page */}
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
