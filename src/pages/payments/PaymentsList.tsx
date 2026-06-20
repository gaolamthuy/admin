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
import { Button } from '@/components/ui/button';
import { Loader2, Search, CalendarDays, Infinity, Copy, Check } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePayments, type Payment } from '@/hooks/usePayments';
import {
  formatDate,
  formatTimeAgo,
  formatDateTimeWithSeconds,
} from '@/utils/date';
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Sao chép"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
}

/**
 * PaymentsList Component
 * Chỉ xem lịch sử, không có hành động tạo/sửa/xoá
 */
export const PaymentsList = () => {
  const { isAdmin } = useIsAdmin();
  const [showAll, setShowAll] = useState(false);
  const { data: payments = [], isLoading } = usePayments({
    isAdmin,
    showAll: isAdmin && showAll,
  });
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const getProviderInfo = (providerRaw: string | null | undefined) => {
    const provider = (providerRaw ?? '').toLowerCase().trim();

    if (provider.includes('momo')) {
      return {
        label: 'MoMo',
        logoSrc: '/logo/momo-symbol.svg',
        fillAvatar: false,
        badgeClass:
          'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-100',
      };
    }

    if (provider.includes('acb')) {
      return {
        label: 'ACB',
        logoSrc: '/logo/acb-200x200.png',
        fillAvatar: true,
        badgeClass:
          'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100',
      };
    }

    if (provider.includes('vietcom') || provider.includes('vcb')) {
      return {
        label: 'Vietcombank',
        logoSrc: '/logo/vietcombank-200x200.png',
        fillAvatar: true,
        badgeClass:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100',
      };
    }

    if (
      provider.includes('techcom') ||
      provider.includes('tcb') ||
      provider.includes('techcomb')
    ) {
      return {
        label: 'Techcombank',
        logoSrc: '/logo/techcombank-symbol.svg',
        fillAvatar: false,
        badgeClass:
          'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-100',
      };
    }

    return {
      label: providerRaw || 'Khác',
      logoSrc: undefined as string | undefined,
      fillAvatar: false,
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
      const momoRef = payment.momo_ref?.toLowerCase() ?? '';
      const handleRef = payment.handle_ref?.toLowerCase() ?? '';
      const handleStatus = payment.handle_status?.toLowerCase() ?? '';

      return (
        provider.includes(term) ||
        account.includes(term) ||
        ref.includes(term) ||
        momoRef.includes(term) ||
        handleRef.includes(term) ||
        handleStatus.includes(term)
      );
    });
  }, [payments, searchTerm]);

  /**
   * Group TẤT CẢ giao dịch theo ngày, sau đó paginate theo nhóm ngày
   * → mỗi ngày không bị xé qua trang
   */
  const allGroups = useMemo(() => {
    const groups: Record<string, Payment[]> = {};

    filteredPayments.forEach(payment => {
      const displayTime = payment.received_at ?? payment.created_at;
      if (!displayTime) {
        const key = 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push(payment);
        return;
      }

      const dateKey = formatDate(displayTime, 'YYYY-MM-DD');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(payment);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([date, items]) => {
        const firstPayment = items[0];
        const displayTime =
          firstPayment?.received_at ?? firstPayment?.created_at;
        return { date, items, displayTime: displayTime || null };
      });
  }, [filteredPayments]);

  const daysPerPage = 7;
  const totalPages = Math.ceil(allGroups.length / daysPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const groupedPayments = useMemo(() => {
    const start = (currentPage - 1) * daysPerPage;
    return allGroups.slice(start, start + daysPerPage);
  }, [allGroups, currentPage]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>Lịch sử thanh toán</CardTitle>
              {isAdmin && (
                <Button
                  variant={showAll ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowAll(prev => !prev)}
                  className="h-7 gap-1.5 text-xs"
                >
                  {showAll ? (
                    <Infinity className="h-3.5 w-3.5" />
                  ) : (
                    <CalendarDays className="h-3.5 w-3.5" />
                  )}
                  {showAll ? 'Tất cả' : '7 ngày'}
                </Button>
              )}
              {!isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  7 ngày gần nhất
                </Badge>
              )}
            </div>
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
              <p className="text-muted-foreground">
                Chưa có giao dịch thanh toán nào
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {groupedPayments.map(group => (
                  <section key={group.date} className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {group.date === 'unknown' ? (
                          <span className="text-sm font-semibold">
                            Không rõ ngày
                          </span>
                        ) : (
                          (() => {
                            const dateStr =
                              group.displayTime || `${group.date}T00:00:00Z`;

                            let formattedDate = formatDate(
                              dateStr,
                              'dddd, DD/MM/YYYY'
                            );

                            const parts = formattedDate.split(', ');
                            if (parts.length === 2) {
                              const weekday = parts[0];
                              const datePart = parts[1];
                              const capitalizedWeekday = weekday
                                .split(' ')
                                .map(
                                  word =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
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
                                <span className="text-sm font-semibold">
                                  {formattedDate}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {daysAgoText}
                                </Badge>
                              </>
                            );
                          })()
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {group.items.length} giao dịch
                      </span>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                      {group.items.map(payment => {
                        const displayTime =
                          payment.received_at ?? payment.created_at;
                        const providerInfo = getProviderInfo(payment.provider);

                        return (
                          <div
                            key={payment.id}
                            className="flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {providerInfo.logoSrc && (
                                  <span
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${
                                      providerInfo.fillAvatar
                                        ? ''
                                        : providerInfo.badgeClass
                                    }`}
                                  >
                                    <img
                                      src={providerInfo.logoSrc}
                                      alt={providerInfo.label}
                                      className={
                                        providerInfo.fillAvatar
                                          ? 'h-full w-full object-cover'
                                          : 'h-5 w-5 object-contain'
                                      }
                                    />
                                  </span>
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
                                <span className="text-muted-foreground">
                                  Thời gian
                                </span>
                                <span className="font-medium">
                                  {displayTime
                                    ? formatDateTimeWithSeconds(displayTime)
                                    : '-'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">
                                  Số tài khoản
                                </span>
                                <span className="font-mono">
                                  {payment.account_number || '-'}
                                </span>
                              </div>
                              {isAdmin &&
                                payment.balance !== null &&
                                payment.balance !== undefined && (
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-muted-foreground">
                                      Số dư
                                    </span>
                                    <span className="font-mono">
                                      {payment.balance.toLocaleString('vi-VN', {
                                        style: 'currency',
                                        currency: payment.currency || 'VND',
                                      })}
                                    </span>
                                  </div>
                                )}
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">
                                  Mô tả
                                </span>
                                <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <span className="truncate max-w-[120px] cursor-default">{payment.ref || '-'}</span>
                                    </TooltipTrigger>
                                    {payment.ref && (
                                      <TooltipContent side="top" align="start" className="max-w-xs break-all text-xs">
                                        {payment.ref}
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                  {payment.ref && (
                                    <CopyButton value={payment.ref} />
                                  )}
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
                            (page >= currentPage - 1 && page <= currentPage + 1)
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
