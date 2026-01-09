/**
 * Purchase Order List Page
 * Card View với TanStack Query
 *
 * @module pages/purchase-orders/PurchaseOrderList
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Loader2, Plus, Package, Calendar } from 'lucide-react';
import { formatDate, formatDaysAgo } from '@/utils/date';

/**
 * Purchase Order List Page Component - Card View
 */
export const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 cards per page cho card view

  // Paginated purchase orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return purchaseOrders.slice(startIndex, endIndex);
  }, [purchaseOrders, currentPage]);

  // Total pages
  const totalPages = Math.ceil(purchaseOrders.length / itemsPerPage);

  // Reset to page 1 when purchase orders change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);


  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách đơn mua hàng</CardTitle>
          <Button onClick={() => navigate('/purchase-orders/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn mua hàng
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có đơn mua hàng nào</p>
            </div>
          ) : (
            <>
              {/* Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedOrders.map(order => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold">
                            {order.code || `#${order.id}`}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.supplier_name || 'Chưa có nhà cung cấp'}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Thông tin tổng quan */}
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Ngày mua:</span>
                          </div>
                          <div className="text-right">
                            {order.purchase_date ? (
                              <div>
                                <div className="font-medium">
                                  {formatDate(order.purchase_date)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDaysAgo(order.purchase_date)}
                                </div>
                              </div>
                            ) : (
                              '-'
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Số lượng:</span>
                          </div>
                          <div className="text-right font-medium">
                            {order.total_items || 0} sản phẩm
                            {order.total_quantity &&
                              ` (${Number(order.total_quantity).toLocaleString('vi-VN')} kg)`}
                          </div>
                        </div>
                      </div>

                      {/* Danh sách sản phẩm */}
                      {order.details && order.details.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2 text-muted-foreground">
                            Sản phẩm ({order.details.length}):
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {order.details.slice(0, 5).map((item, idx) => (
                              <div
                                key={item.id || idx}
                                className="flex items-start justify-between text-sm bg-muted/50 p-2 rounded"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {item.product_name || item.product_code || '-'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.product_code && `Mã: ${item.product_code}`}
                                    {item.quantity &&
                                      ` • ${Number(item.quantity).toLocaleString('vi-VN')} kg`}
                                  </p>
                                </div>
                              </div>
                            ))}
                            {order.details.length > 5 && (
                              <p className="text-xs text-center text-muted-foreground pt-1">
                                +{order.details.length - 5} sản phẩm khác...
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Notes nếu có */}
                      {(order.combined_notes || order.combined_admin_notes) && (
                        <div className="border-t pt-3">
                          {order.combined_notes && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium">Ghi chú:</span>{' '}
                              {order.combined_notes}
                            </p>
                          )}
                          {order.combined_admin_notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Admin note:</span>{' '}
                              {order.combined_admin_notes}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Action button */}
                      <div className="border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            navigate(`/purchase-orders/show/${order.id}`)
                          }
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

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

                      {/* Tính toán các trang cần hiển thị */}
                      {(() => {
                        const pagesToShow: number[] = [];
                        let showFirstPage = false;
                        let showLastPage = false;
                        let showEllipsisBefore = false;
                        let showEllipsisAfter = false;

                        // Xác định các trang cần hiển thị
                        if (totalPages <= 7) {
                          // Nếu tổng số trang <= 7, hiển thị tất cả
                          for (let i = 1; i <= totalPages; i++) {
                            pagesToShow.push(i);
                          }
                        } else {
                          // Luôn hiển thị trang 1
                          showFirstPage = true;

                          // Luôn hiển thị trang cuối
                          showLastPage = true;

                          // Xác định các trang xung quanh currentPage
                          if (currentPage <= 3) {
                            // Ở đầu: hiển thị 2, 3, 4 (không hiển thị 1 vì đã có showFirstPage)
                            for (let i = 2; i <= 4; i++) {
                              pagesToShow.push(i);
                            }
                            showEllipsisAfter = true;
                          } else if (currentPage >= totalPages - 2) {
                            // Ở cuối: hiển thị các trang cuối (không hiển thị trang cuối vì đã có showLastPage)
                            for (
                              let i = totalPages - 3;
                              i < totalPages;
                              i++
                            ) {
                              pagesToShow.push(i);
                            }
                            showEllipsisBefore = true;
                          } else {
                            // Ở giữa: hiển thị currentPage - 1, currentPage, currentPage + 1
                            for (
                              let i = currentPage - 1;
                              i <= currentPage + 1;
                              i++
                            ) {
                              pagesToShow.push(i);
                            }
                            showEllipsisBefore = true;
                            showEllipsisAfter = true;
                          }
                        }

                        return (
                          <>
                            {/* Trang 1 */}
                            {showFirstPage && totalPages > 7 && (
                              <>
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(1)}
                                    isActive={currentPage === 1}
                                    className="cursor-pointer"
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                                {showEllipsisBefore && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                              </>
                            )}

                            {/* Các trang ở giữa */}
                            {pagesToShow.map(page => (
                              <PaginationItem key={page}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(page)}
                                  isActive={currentPage === page}
                                  className="cursor-pointer"
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            ))}

                            {/* Trang cuối */}
                            {showLastPage && totalPages > 7 && (
                              <>
                                {showEllipsisAfter && (
                                  <PaginationItem>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )}
                                <PaginationItem>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(totalPages)}
                                    isActive={currentPage === totalPages}
                                    className="cursor-pointer"
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              </>
                            )}
                          </>
                        );
                      })()}

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

export default PurchaseOrderList;
