/**
 * Payments List Page
 * Trang hiển thị lịch sử thanh toán từ glt_payment (chỉ đọc)
 *
 * @module pages/payments/PaymentsList
 */

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { usePayments, type Payment } from '@/hooks/usePayments';
import { formatDate, formatTimeAgo, formatDateTimeWithSeconds } from '@/utils/date';
import { useIsAdmin } from '@/hooks/useAuth';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

/**
 * PaymentsList Component
 * Chỉ xem lịch sử, không có hành động tạo/sửa/xoá
 */
export const PaymentsList = () => {
  const { isAdmin } = useIsAdmin();
  // ⚠️ Phân quyền: Admin lấy full query, Staff chỉ lấy 20 records
  const { data: payments = [], isLoading } = usePayments(isAdmin);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  /**
   * Helper: Chuẩn hoá thông tin provider (logo, màu, label hiển thị)
   */
  const getProviderInfo = (providerRaw: string | null | undefined) => {
    const provider = (providerRaw ?? '').toLowerCase().trim();

    if (provider.includes('momo')) {
      return {
        label: 'MoMo',
        logoSrc: '/logo/momo-200x200.png',
        badgeClass:
          'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-100',
      };
    }

    if (provider.includes('acb')) {
      return {
        label: 'ACB',
        logoSrc: '/logo/acb-200x200.png',
        badgeClass:
          'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100',
      };
    }

    if (provider.includes('vietcom') || provider.includes('vcb')) {
      return {
        label: 'Vietcombank',
        logoSrc: '/logo/vietcombank-200x200.png',
        badgeClass:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
      };
    }

    return {
      label: providerRaw || 'Khác',
      logoSrc: undefined as string | undefined,
      badgeClass:
        'bg-muted text-muted-foreground dark:bg-muted/40 dark:text-muted-foreground',
    };
  };

  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return payments;

    return payments.filter(payment => {
      const provider = payment.provider?.toLowerCase() ?? '';
      const account = payment.account_number?.toLowerCase() ?? '';
      const ref = payment.ref?.toLowerCase() ?? '';
      const note = payment.note?.toLowerCase() ?? '';
      const handleRef = payment.handle_ref?.toLowerCase() ?? '';
      const handleStatus = payment.handle_status?.toLowerCase() ?? '';

      return (
        provider.includes(term) ||
        account.includes(term) ||
        ref.includes(term) ||
        note.includes(term) ||
        handleRef.includes(term) ||
        handleStatus.includes(term)
      );
    });
  }, [payments, searchTerm]);

  /**
   * Group các giao dịch theo ngày (YYYY-MM-DD) dựa trên received_at / created_at
   * Sau đó sort ngày mới nhất trước
   */
  // Pagination: Chia filteredPayments thành các page
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, currentPage, itemsPerPage]);

  // Total pages
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  // Reset to page 1 when filtered payments change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const groupedPayments = useMemo(() => {
    const groups: Record<string, Payment[]> = {};

    paginatedPayments.forEach(payment => {
      const displayTime = payment.received_at ?? payment.created_at;
      if (!displayTime) {
        const key = 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(payment);
        return;
      }

      // Dùng formatDate để lấy date key theo UTC (database đã lưu UTC)
      const dateKey = formatDate(displayTime, 'YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(payment);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1)) // ngày mới trước
      .map(([date, items]) => {
        // Lấy datetime thực tế từ payment đầu tiên để tính days ago chính xác
        const firstPayment = items[0];
        const displayTime = firstPayment?.received_at ?? firstPayment?.created_at;
        return { date, items, displayTime: displayTime || null };
      });
  }, [paginatedPayments]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lịch sử thanh toán</CardTitle>
            {/* ⚠️ Search box chỉ hiển thị cho admin */}
            {isAdmin && (
              <div className="w-full max-w-md relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo provider, số TK, ref, nội dung..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                  aria-label="Tìm kiếm thanh toán"
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có giao dịch thanh toán nào</p>
            </div>
          ) : (
            <>
              {/* Thông tin số lượng records - Đã ẩn theo yêu cầu */}
              {/* <div className="mb-4 text-sm text-muted-foreground">
                Hiển thị {paginatedPayments.length} / {filteredPayments.length} giao dịch
                {!isAdmin && (
                  <span className="ml-2 text-xs">
                    (Staff chỉ xem được 20 records đầu tiên)
                  </span>
                )}
              </div> */}
              <div className="space-y-6">
                {groupedPayments.map(group => (
                  <section key={group.date} className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {group.date === 'unknown' ? (
                          <span className="text-sm font-semibold">Không rõ ngày</span>
                        ) : (() => {
                            // Format date group: dddd, dd/MM/yyyy với times ago trong badge
                            const dateStr = group.displayTime || `${group.date}T00:00:00Z`;
                            
                            // Format với thứ trong tuần: dddd, DD/MM/YYYY
                            // dddd = tên đầy đủ của thứ (thứ hai, thứ ba, ...) với locale 'vi'
                            let formattedDate = formatDate(dateStr, 'dddd, DD/MM/YYYY');
                            
                            // Capitalize chữ cái đầu của weekday để đẹp hơn
                            // Ví dụ: "thứ hai" -> "Thứ Hai"
                            const parts = formattedDate.split(', ');
                            if (parts.length === 2) {
                              const weekday = parts[0];
                              const datePart = parts[1];
                              // Capitalize từng từ trong weekday
                              const capitalizedWeekday = weekday
                                .split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' ');
                              formattedDate = `${capitalizedWeekday}, ${datePart}`;
                            }
                            
                            const daysAgoText = formatTimeAgo(dateStr, {
                              includeSeconds: false,
                              includeMinutes: false,
                              includeHours: false,
                            });
                            
                            return (
                              <>
                                <span className="text-sm font-semibold">{formattedDate}</span>
                                <Badge variant="outline" className="text-xs">
                                  {daysAgoText}
                                </Badge>
                              </>
                            );
                          })()}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {group.items.length} giao dịch
                      </span>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                      {group.items.map(payment => {
                        const displayTime = payment.received_at ?? payment.created_at;
                        const providerInfo = getProviderInfo(payment.provider);

                        return (
                          <div
                            key={payment.id}
                            className="flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {providerInfo.logoSrc && (
                                  <img
                                    src={providerInfo.logoSrc}
                                    alt={providerInfo.label}
                                    className="h-6 w-6 rounded-full object-cover"
                                  />
                                )}
                                <span className="text-sm font-medium">
                                  {providerInfo.label}
                                </span>
                              </div>
                              <div className="text-right">
                                <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xl font-semibold text-primary">
                                  {payment.amount !== null &&
                                  payment.amount !== undefined
                                    ? payment.amount.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: payment.currency || 'VND',
                                      })
                                    : '-'}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 text-xs">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Thời gian</span>
                                <span className="font-medium">
                                  {displayTime
                                    ? formatDateTimeWithSeconds(displayTime)
                                    : '-'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Số tài khoản</span>
                                <span className="font-mono">
                                  {payment.account_number || '-'}
                                </span>
                              </div>
                              {isAdmin &&
                                payment.balance !== null &&
                                payment.balance !== undefined && (
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">Số dư</span>
                                    <span className="font-mono">
                                      {payment.balance.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: payment.currency || 'VND',
                                      })}
                                    </span>
                                  </div>
                                )}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">Mã giao dịch</span>
                                <span className="font-mono text-[11px]">
                                  {payment.ref || '-'}
                                </span>
                              </div>
                            </div>

                            <div className="mt-1 flex flex-col gap-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {payment.handle_ref && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                    Ref: {payment.handle_ref}
                                  </span>
                                )}
                                {payment.test_trans && (
                                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-100">
                                    Giao dịch TEST
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
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

export default PaymentsList;

