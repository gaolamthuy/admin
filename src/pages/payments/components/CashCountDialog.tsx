/**
 * CashCountDialog — kiểm đếm tiền mặt cuối ca theo ngày
 * Mở từ trang Thanh toán: nạp tổng thu chi Sổ quỹ KiotViet của ngày đó,
 * kèm giao dịch chuyển khoản/MoMo của ngày, đếm tiền theo mệnh giá
 * (lưu riêng theo ngày) và gợi ý chênh lệch.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  Calculator,
  ChevronDown,
  Landmark,
  RefreshCw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/date';
import { getProviderLabel } from '@/pages/misc/cash-count/constants';
import { CashCountBoard } from '@/pages/misc/cash-count/CashCountBoard';
import type { Payment } from '@/hooks/usePayments';
import { useDailyCashflow } from '../hooks/useDailyCashflow';

function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

function formatHeaderDate(date: string): string {
  const formatted = formatDate(`${date}T00:00:00Z`, 'dddd, DD/MM/YYYY');
  const parts = formatted.split(', ');
  if (parts.length === 2) {
    const weekday = parts[0]
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return `${weekday}, ${parts[1]}`;
  }
  return formatted;
}

function formatPaymentTime(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '--:--'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatVoucherTime(transDate: string | null): string {
  if (!transDate || transDate.length < 16) return '--:--';
  return transDate.slice(11, 16);
}

function getMethodLabel(method: string): string {
  const m = method.toLowerCase();
  if (m.includes('cash')) return 'Tiền mặt';
  if (m.includes('transfer') || m.includes('bank')) return 'CK';
  if (m.includes('card')) return 'Thẻ';
  return method || 'Khác';
}

interface CashCountDialogProps {
  date: string | null;
  payments: Payment[];
  onClose: () => void;
}

export function CashCountDialog({
  date,
  payments,
  onClose,
}: CashCountDialogProps) {
  const { data, isLoading, isError, error, refetch, isRefetching } =
    useDailyCashflow(date);
  const [totals, setTotals] = useState({ total: 0, sheets: 0 });
  const handleTotals = useCallback(
    (t: { total: number; sheets: number }) => setTotals(t),
    []
  );

  // Các giao dịch CK bị loại khỏi chênh lệch (không thuộc ca mình) — lưu theo ngày
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!date) return;
    try {
      const raw = localStorage.getItem(
        `glt-admin-cash-count:${date}:ck-excluded`
      );
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      setExcludedIds(new Set(Array.isArray(arr) ? arr : []));
    } catch {
      setExcludedIds(new Set());
    }
  }, [date]);

  useEffect(() => {
    if (!date) return;
    localStorage.setItem(
      `glt-admin-cash-count:${date}:ck-excluded`,
      JSON.stringify([...excludedIds])
    );
  }, [date, excludedIds]);

  const toggleExcluded = (id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const transferSummary = useMemo(() => {
    let total = 0;
    let count = 0;
    payments.forEach(p => {
      if (excludedIds.has(p.id)) return;
      total += Number(p.amount) || 0;
      count += 1;
    });
    return { total, count, excluded: payments.length - count };
  }, [payments, excludedIds]);

  const diff = useMemo(() => {
    if (!data) return null;
    const kvNet = data.totalIn - data.totalOut;
    const actual = totals.total + transferSummary.total;
    return { kvNet, actual, diff: kvNet - actual };
  }, [data, totals.total, transferSummary.total]);

  return (
    <Dialog open={!!date} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-none overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
            <Banknote className="size-4 text-emerald-600" />
            Kiểm đếm cuối ca
            {date && (
              <Badge variant="outline" className="font-normal">
                {formatHeaderDate(date)}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Đối chiếu Sổ quỹ KiotViet với tiền mặt đếm được — số đếm lưu riêng
            theo ngày
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-4 lg:space-y-0">
          <div className="min-w-0 space-y-4">
            {/* Sổ quỹ KiotViet */}
            <section className="rounded-lg border bg-muted/30 p-3">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-2/3" />
                </div>
              ) : isError ? (
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      Không lấy được Sổ quỹ KiotViet: {error?.message}. Vẫn đếm
                      tiền bình thường.
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs"
                    onClick={() => refetch()}
                    disabled={isRefetching}
                  >
                    <RefreshCw
                      className={cn(
                        'mr-1 size-3.5',
                        isRefetching && 'animate-spin'
                      )}
                    />
                    Làm mới
                  </Button>
                </div>
              ) : data ? (
                <Collapsible className="group/collapsible-kv">
                  <div className="flex min-w-0 items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-muted/50"
                        aria-label="Mở/đóng danh sách phiếu thu chi"
                      >
                        <Banknote className="size-4 shrink-0 text-emerald-600" />
                        <span className="shrink-0 text-sm font-semibold">
                          Thu chi theo KiotViet
                        </span>
                        <span
                          className={cn(
                            'shrink-0 text-lg font-bold tabular-nums',
                            data.totalIn - data.totalOut >= 0
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : 'text-rose-700 dark:text-rose-400'
                          )}
                        >
                          {formatNumber(data.totalIn - data.totalOut)}đ
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible-kv:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <div className="h-5 w-px shrink-0 bg-border" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      title="Làm mới Sổ quỹ KiotViet"
                      onClick={() => refetch()}
                      disabled={isRefetching}
                    >
                      <RefreshCw
                        className={cn(
                          'size-3.5',
                          isRefetching && 'animate-spin'
                        )}
                      />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                    Thu {formatNumber(data.totalIn)}đ · Chi{' '}
                    {formatNumber(data.totalOut)}đ · {data.count} phiếu — bấm
                    xem chi tiết từng phiếu
                  </p>
                  <CollapsibleContent>
                    {data.vouchers.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">
                        Ngày này chưa có phiếu thu chi nào
                      </p>
                    ) : (
                      <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto overflow-x-hidden rounded-md border bg-card/60 p-1.5">
                        {data.vouchers.map((v, i) => {
                          const detail = `${v.code ?? ''} · ${getMethodLabel(
                            v.method
                          )}${v.partnerName ? ` · ${v.partnerName}` : ''}`;
                          return (
                            <div
                              key={`${v.code ?? i}-${i}`}
                              className="flex min-w-0 items-center gap-2 overflow-hidden px-1.5 py-1 text-xs"
                            >
                              <span className="w-9 shrink-0 text-muted-foreground tabular-nums">
                                {formatVoucherTime(v.transDate)}
                              </span>
                              <Badge
                                variant={
                                  v.isReceipt ? 'secondary' : 'destructive'
                                }
                                className="h-5 shrink-0 px-1.5 font-normal"
                              >
                                {v.isReceipt ? 'Thu' : 'Chi'}
                              </Badge>
                              <span
                                className="min-w-0 flex-1 truncate text-muted-foreground"
                                title={detail}
                              >
                                {detail}
                              </span>
                              <span
                                className={cn(
                                  'shrink-0 font-medium tabular-nums',
                                  v.isReceipt
                                    ? 'text-emerald-700 dark:text-emerald-400'
                                    : 'text-rose-700 dark:text-rose-400'
                                )}
                              >
                                {v.isReceipt ? '+' : '−'}
                                {formatNumber(v.amount)}đ
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
            </section>

            {/* Giao dịch chuyển khoản/MoMo của ngày (từ trang Thanh toán) */}
            {date && (
              <section className="rounded-lg border bg-muted/30 p-3">
                <Collapsible className="group/collapsible-transfer">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 text-left"
                    >
                      <Landmark className="size-4 shrink-0 text-sky-600" />
                      <span className="text-sm font-semibold">
                        Chuyển khoản
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {transferSummary.excluded > 0
                          ? `${transferSummary.count}/${payments.length} giao dịch · `
                          : `${transferSummary.count} giao dịch · `}
                        {formatNumber(transferSummary.total)}đ
                      </span>
                      <span className="ml-auto flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground">
                          Bỏ tick để loại CK không thuộc ca mình
                        </span>
                        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible-transfer:rotate-180" />
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {payments.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">
                        Ngày này chưa có giao dịch chuyển khoản nào
                      </p>
                    ) : (
                      <div className="mt-2 max-h-44 space-y-0.5 overflow-y-auto overflow-x-hidden rounded-md border bg-card/60 p-1.5">
                        {payments.map(p => {
                          const amount = Number(p.amount) || 0;
                          const provider = getProviderLabel(p.provider);
                          const ref = p.ref || p.momo_ref;
                          const excluded = excludedIds.has(p.id);
                          return (
                            <label
                              key={p.id}
                              className={cn(
                                'flex min-w-0 cursor-pointer items-center gap-2 overflow-hidden rounded px-1.5 py-1 text-xs transition-opacity hover:bg-muted/50',
                                excluded && 'opacity-45'
                              )}
                            >
                              <Checkbox
                                checked={!excluded}
                                onCheckedChange={() => toggleExcluded(p.id)}
                                className="size-3.5 shrink-0"
                              />
                              <span className="w-9 shrink-0 text-muted-foreground tabular-nums">
                                {formatPaymentTime(p.received_at)}
                              </span>
                              <Badge
                                variant="secondary"
                                className="h-5 shrink-0 px-1.5 font-normal"
                              >
                                {provider}
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="min-w-0 flex-[1_1_0%] cursor-default truncate text-muted-foreground">
                                    {ref || '—'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-h-56 max-w-xs overflow-y-auto whitespace-pre-wrap break-all"
                                >
                                  <p className="text-xs font-semibold">
                                    {provider}
                                    {p.account_number
                                      ? ` · STK ${p.account_number}`
                                      : ''}
                                  </p>
                                  {ref && <p className="break-all">{ref}</p>}
                                </TooltipContent>
                              </Tooltip>
                              <span
                                className={cn(
                                  'shrink-0 font-medium tabular-nums text-emerald-700 dark:text-emerald-400',
                                  excluded && 'line-through'
                                )}
                              >
                                +{formatNumber(amount)}đ
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </section>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            {/* Bảng đếm theo ngày */}
            {date && (
              <CashCountBoard
                storageKey={`glt-admin-cash-count:${date}`}
                onTotals={handleTotals}
                compact
              />
            )}

            {/* Chênh lệch (gợi ý) */}
            {diff && data && (
              <section className="space-y-1.5 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Calculator className="size-4 text-muted-foreground" />
                    Chênh lệch
                  </span>
                  {diff.diff === 0 ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      Khớp quỹ
                    </Badge>
                  ) : diff.diff > 0 ? (
                    <Badge variant="destructive">
                      Thiếu {formatNumber(diff.diff)}đ
                    </Badge>
                  ) : (
                    <Badge className="bg-sky-600 hover:bg-sky-600">
                      Thừa {formatNumber(-diff.diff)}đ
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  KiotViet: {formatNumber(diff.kvNet)}đ (thu − chi) · Thực tế:{' '}
                  {formatNumber(totals.total)}đ đếm +{' '}
                  {formatNumber(transferSummary.total)}đ CK ={' '}
                  {formatNumber(diff.actual)}đ
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Chênh lệch = KiotViet − (đếm + chuyển khoản) — dương là thiếu,
                  âm là thừa. Chỉ mang tính gợi ý.
                </p>
              </section>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
