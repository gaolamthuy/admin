/**
 * Invoices List Page - Danh sách hóa đơn
 * Sử dụng TanStack Query với pagination + in lại hóa đơn
 *
 * @module pages/invoices/InvoicesList
 */

import { useState, useMemo, useEffect } from 'react';
import { useInvoices, type Invoice } from '@/hooks/useInvoices';
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
import { formatDateTime } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePrintInvoice } from './hooks/usePrintInvoice';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

/**
 * Format số tiền VND
 */
const formatVND = (value: number | null | undefined): string => {
  const num = Number(value) || 0;
  return num.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
  });
};

/**
 * Badge variant cho trạng thái hóa đơn
 */
const getStatusBadge = (statusValue: string | null) => {
  if (!statusValue) return <span className="text-muted-foreground">-</span>;
  const normalized = statusValue.toLowerCase();
  if (normalized.includes('hoàn thành')) {
    return <Badge variant="default">{statusValue}</Badge>;
  }
  if (normalized.includes('hủy') || normalized.includes('trả')) {
    return <Badge variant="destructive">{statusValue}</Badge>;
  }
  return <Badge variant="secondary">{statusValue}</Badge>;
};

/**
 * Invoices List Page Component
 */
export const InvoicesList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: invoices = [], isLoading } = useInvoices(debouncedSearch);
  const { printInvoice, isLoading: isPrinting } = usePrintInvoice();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Paginated invoices
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return invoices.slice(startIndex, endIndex);
  }, [invoices, currentPage]);

  // Total pages
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  // Reset to page 1 when invoices change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Debounce search term
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
   * Xử lý in lại hóa đơn
   */
  const handlePrintInvoice = async (invoice: Invoice) => {
    if (!invoice.kiotviet_id) {
      toast.error('Không tìm thấy mã KiotViet của hóa đơn');
      return;
    }

    try {
      await printInvoice(invoice.kiotviet_id);
      toast.success('Đang mở hóa đơn để in', {
        description: `Hóa đơn ${invoice.code || ''}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi in hóa đơn';
      toast.error('In hóa đơn thất bại', {
        description: message,
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Danh sách hóa đơn</CardTitle>
            <div className="flex items-center gap-2 w-full max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo mã hóa đơn hoặc tên khách"
                  className="pl-10 pr-10"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  aria-label="Tìm kiếm hóa đơn"
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có hóa đơn nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã hóa đơn</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Ngày bán
                        <ArrowDown className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>NV bán</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedInvoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.code || `#${invoice.id}`}
                      </TableCell>
                      <TableCell>
                        {invoice.purchase_date
                          ? formatDateTime(invoice.purchase_date)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {invoice.customer_name || 'Khách lẻ'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatVND(invoice.total)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status_value)}
                      </TableCell>
                      <TableCell>{invoice.sold_by_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isPrinting || !invoice.kiotviet_id}
                            onClick={() => handlePrintInvoice(invoice)}
                          >
                            <Printer className="mr-1 h-4 w-4" />
                            {isPrinting ? 'Đang xử lý...' : 'In lại'}
                          </Button>
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

                      {(() => {
                        const pagesToShow: number[] = [];
                        let showFirstPage = false;
                        let showLastPage = false;
                        let showEllipsisBefore = false;
                        let showEllipsisAfter = false;

                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) {
                            pagesToShow.push(i);
                          }
                        } else {
                          showFirstPage = true;
                          showLastPage = true;

                          if (currentPage <= 3) {
                            for (let i = 2; i <= 4; i++) {
                              pagesToShow.push(i);
                            }
                            showEllipsisAfter = true;
                          } else if (currentPage >= totalPages - 2) {
                            for (let i = totalPages - 3; i < totalPages; i++) {
                              pagesToShow.push(i);
                            }
                            showEllipsisBefore = true;
                          } else {
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

export default InvoicesList;
