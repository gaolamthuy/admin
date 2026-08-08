/**
 * Payments List Page
 * Trang hiển thị lịch sử thanh toán từ glt_payment
 * Tích hợp SoundBox: realtime voice notification
 *
 * @module pages/payments/PaymentsList
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Search,
  CalendarDays,
  Infinity as InfinityIcon,
  Copy,
  Check,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePayments, type DateRange, type Payment } from '@/hooks/usePayments';
import { usePaymentRealtime } from '@/hooks/usePaymentRealtime';
import { usePaymentAnnouncer } from '@/hooks/usePaymentAnnouncer';
import {
  formatDate,
  formatTimeAgo,
  formatDateTimeWithSeconds,
} from '@/utils/date';
import { useIsAdmin } from '@/hooks/useAuth';
import { isMuted } from '@/pages/soundbox/components/MuteToggle';
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


export const PaymentsList = () => {
  const { isAdmin } = useIsAdmin();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [showTest, setShowTest] = useState(true);
  const { data: payments = [], isLoading } = usePayments({
    isAdmin,
    dateRange,
    showTest: isAdmin ? showTest : false,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [muted, setMuted] = useState(isMuted());
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const highlightTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const { announcePayment } = usePaymentAnnouncer();

  const handleNewPayment = useCallback(
    (payment: Payment) => {
      announcePayment(payment);

      setHighlightedIds(prev => new Set(prev).add(payment.id));
      const existing = highlightTimeouts.current.get(payment.id);
      if (existing) clearTimeout(existing);
      highlightTimeouts.current.set(
        payment.id,
        setTimeout(() => {
          setHighlightedIds(prev => {
            const next = new Set(prev);
            next.delete(payment.id);
            return next;
          });
          highlightTimeouts.current.delete(payment.id);
        }, 4000)
      );
    },
    [announcePayment]
  );

  const { isConnected } = usePaymentRealtime({
    enabled: true,
    onNewPayment: handleNewPayment,
    showTestPayments: isAdmin,
  });

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem('soundbox-muted', String(next));
    window.dispatchEvent(new Event('mute-change'));
  };

  const handleTestVoice = () => {
    announcePayment({
      id: 'test',
      provider: 'TCB',
      account_number: null,
      amount: 1500000,
      currency: 'VND',
      transaction_type: 'credit',
      balance: null,
      ref: 'TEST123',
      momo_ref: null,
      received_at: new Date().toISOString(),
      raw_body: {},
      created_at: new Date().toISOString(),
      test_trans: true,
      handle_status: 'pending',
      handle_ref: null,
      handle_note: null,
      momo_extrafield: null,
    });
  };

  const getProviderInfo = (providerRaw: string | null | undefined) => {
    const provider = (providerRaw ?? '').toLowerCase().trim();

    if (provider.includes('momo')) {
      return { label: 'MoMo', logoSrc: '/logo/momo-symbol.svg' };
    }
    if (provider.includes('acb')) {
      return { label: 'ACB', logoSrc: '/logo/acb-symbol.png' };
    }
    if (provider.includes('vietcom') || provider.includes('vcb')) {
      return {
        label: 'Vietcombank',
        logoSrc: '/logo/vietcombank-200x200.png',
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
      };
    }

    return {
      label: providerRaw || 'Khác',
      logoSrc: undefined as string | undefined,
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

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = useMemo(
    () =>
      filteredPayments.filter(p => p.received_at?.startsWith(todayStr)),
    [filteredPayments, todayStr]
  );
  const todayTotal = useMemo(
    () => todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [todayPayments]
  );

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

  const dateRangeOptions: { value: DateRange; label: string }[] = [
    { value: 'today', label: 'Hôm nay' },
    { value: '7days', label: '7 ngày' },
    ...(isAdmin ? [{ value: 'all' as DateRange, label: 'Tất cả' }] : []),
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle>Lịch sử thanh toán</CardTitle>

              {/* Date range filter */}
              <Tabs value={dateRange} onValueChange={(value) => setDateRange(value as DateRange)}>
                <TabsList>
                  {dateRangeOptions.map(opt => (
                    <TabsTrigger key={opt.value} value={opt.value} className="h-7 px-3 text-xs">
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              {/* Test filter (admin only) */}
              {isAdmin && (
                <Toggle
                  pressed={showTest}
                  onPressedChange={setShowTest}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {/* {showTest ? 'Bao gồm test' : 'Không test'} */ 'Giao dịch test'}
                </Toggle>
              )}

              {/* Search toggle (admin only) */}
              {isAdmin && (
                <>
                  {searchOpen ? (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        placeholder="Tìm theo provider, số TK, ref..."
                        className="h-7 w-48 pl-9 pr-8 text-xs"
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        onBlur={() => {
                          if (!searchTerm) setSearchOpen(false);
                        }}
                        aria-label="Tìm kiếm thanh toán"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => {
                            setSearchTerm('');
                            setSearchOpen(false);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setSearchOpen(true)}
                      title="Tìm kiếm"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* SoundBox hover card */}
              <HoverCard openDelay={20} closeDelay={20}>
                <HoverCardTrigger asChild>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
                    {isConnected ? (
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                    )}
                    Loa chuyển khoản
                  </span>
                </HoverCardTrigger>
                <HoverCardContent className="w-64 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                      <span className="text-sm">Thông báo giọng đọc</span>
                    </div>
                    <Switch checked={!muted} onCheckedChange={() => handleToggleMute()} />
                  </div>
                  <Button
                    onClick={handleTestVoice}
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={muted}
                  >
                    Test âm thanh
                  </Button>
                </HoverCardContent>
              </HoverCard>
            </div>
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
                              group.displayTime ||
                              `${group.date}T00:00:00Z`;
                            const isToday = group.date === todayStr;

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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {group.items.length} giao dịch
                          {group.date === todayStr && (
                            <>
                              {' '}•{' '}
                              {todayTotal.toLocaleString('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              })}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                      {group.items.map(payment => {
                        const displayTime =
                          payment.received_at ?? payment.created_at;
                        const providerInfo = getProviderInfo(payment.provider);
                        const isNew = displayTime
                          ? now - new Date(displayTime).getTime() <
                            10 * 60 * 1000
                          : false;

                        return (
                          <div
                            key={payment.id}
                            className={cn(
                              'flex flex-col gap-3 rounded-lg border bg-card p-3 text-card-foreground shadow-sm transition-colors',
                              highlightedIds.has(payment.id) &&
                                'animate-highlight border-primary/40'
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                {providerInfo.logoSrc && (
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                                    <img
                                      src={providerInfo.logoSrc}
                                      alt={providerInfo.label}
                                      className="h-full w-full object-contain"
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
                                  {displayTime?.startsWith(todayStr) && (
                                    <span className="ml-1.5 text-muted-foreground">
                                      ({formatTimeAgo(displayTime)})
                                    </span>
                                  )}
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
                                      <span className="truncate max-w-[120px] cursor-default">
                                        {payment.ref || '-'}
                                      </span>
                                    </TooltipTrigger>
                                    {payment.ref && (
                                      <TooltipContent
                                        side="top"
                                        align="start"
                                        className="max-w-xs break-all text-xs"
                                      >
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
                                {isNew && (
                                  <Badge variant="default" className="text-[10px]">
                                    mới
                                  </Badge>
                                )}
                                {payment.handle_ref && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                    Ref: {payment.handle_ref}
                                  </span>
                                )}
                                {payment.test_trans && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    TEST
                                  </Badge>
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