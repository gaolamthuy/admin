/**
 * Customers List Page
 * Sử dụng TanStack Query với pagination
 *
 * @module pages/customers/CustomersList
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Badge } from '@/components/ui/badge';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Loader2, Eye } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { Button } from '@/components/ui/button';

/**
 * Customers List Page Component
 */
export const CustomersList = () => {
  const navigate = useNavigate();
  const { data: customers = [], isLoading } = useCustomers();

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Danh sách khách hàng</CardTitle>
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
                    <TableHead>Công nợ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
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
                        {customer.debt
                          ? new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(Number(customer.debt))
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            customer.glt_is_active === false
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {customer.glt_is_active === false
                            ? 'Không hoạt động'
                            : 'Hoạt động'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.created_date
                          ? formatDate(customer.created_date)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/customers/show/${customer.id}`)
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Xem
                        </Button>
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
                            // Ở đầu: hiển thị 1, 2, 3, 4
                            for (let i = 1; i <= 4; i++) {
                              pagesToShow.push(i);
                            }
                            showEllipsisAfter = true;
                          } else if (currentPage >= totalPages - 2) {
                            // Ở cuối: hiển thị các trang cuối
                            for (
                              let i = totalPages - 3;
                              i <= totalPages;
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
