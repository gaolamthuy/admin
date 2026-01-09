/**
 * Customers List Page
 * Sử dụng TanStack Query với pagination
 *
 * @module pages/customers/CustomersList
 */

import { useState, useMemo, useEffect } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { ArrowDown, Loader2, Printer, Search, X } from 'lucide-react';
import { formatTimeAgo } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { usePrintPriceTable } from './hooks/usePrintPriceTable';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

/**
 * Customers List Page Component
 */
export const CustomersList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: customers = [], isLoading } = useCustomers(debouncedSearch);
  const { printPriceTable, isLoading: isPrinting } = usePrintPriceTable();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return customers.slice(startIndex, endIndex);
  }, [customers, currentPage]);

  // Total pages
  const totalPages = Math.ceil(customers.length / itemsPerPage);

  // Reset to page 1 when customers change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Debounce search term để auto search khi nhập
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchTerm]);

  /**
   * Xử lý in bảng giá cho customer
   * @param customer - Customer object
   */
  const handlePrintPriceTable = async (customer: {
    kiotviet_id: number;
    name: string | null;
  }) => {
    if (!customer.kiotviet_id) {
      toast.error('Không tìm thấy thông tin khách hàng');
      return;
    }

    try {
      await printPriceTable(customer.kiotviet_id);
      toast.success('Đang mở bảng giá để in', {
        description: `Bảng giá cho ${customer.name || 'khách hàng'}`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi in bảng giá';
      toast.error('In bảng giá thất bại', {
        description: message,
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Danh sách khách hàng</CardTitle>
            <div className="flex items-center gap-2 w-full max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã hoặc số điện thoại"
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  aria-label="Tìm kiếm khách hàng"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchTerm('ut dao')}
                title="Tìm kiếm nhanh: ut dao"
              >
                ut dao
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có khách hàng nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã KH</TableHead>
                    <TableHead>Tên khách hàng</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Giao dịch gần nhất
                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">
                        {customer.code || `#${customer.id}`}
                      </TableCell>
                      <TableCell>{customer.name || '-'}</TableCell>
                      <TableCell>{customer.contact_number || '-'}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate">
                            {customer.address || '-'}
                            {customer.ward_name && `, ${customer.ward_name}`}
                            {customer.location_name &&
                              `, ${customer.location_name}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.latest_invoice_datetime
                          ? formatTimeAgo(customer.latest_invoice_datetime)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Chỉ hiển thị nút "In bảng giá" khi customer có groups (không null) */}
                          {customer.groups !== null && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintPriceTable(customer)}
                              disabled={isPrinting || !customer.kiotviet_id}
                              title="In bảng giá cho khách hàng này"
                            >
                              <Printer className="mr-2 h-4 w-4" />
                              {isPrinting ? 'Đang xử lý...' : 'In bảng giá'}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

export default CustomersList;
