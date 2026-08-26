/**
 * TransferToday — danh sách giao dịch chuyển khoản/MoMo hôm nay (thẻ đóng/mở)
 * Phục vụ kiểm đếm cuối ca: xem nhanh tổng tiền vào qua CK mà không rời trang.
 */
import { useMemo } from 'react';
import { usePayments } from '@/hooks/usePayments';
import type { Payment } from '@/types/payment';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, Landmark } from 'lucide-react';

function getProviderLabel(providerRaw: string | null | undefined): string {
  const provider = (providerRaw ?? '').toLowerCase().trim();
  if (provider.includes('momo')) return 'MoMo';
  if (provider.includes('acb')) return 'ACB';
  if (provider.includes('vietcom') || provider.includes('vcb'))
    return 'Vietcombank';
  if (
    provider.includes('techcom') ||
    provider.includes('tcb') ||
    provider.includes('techcomb')
  )
    return 'Techcombank';
  return providerRaw || 'Khác';
}

function formatAmount(n: number): string {
  return n.toLocaleString('vi-VN');
}

function formatTime(iso: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? '--:--'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function TransferRow({ payment }: { payment: Payment }) {
  const amount = Number(payment.amount) || 0;
  const provider = getProviderLabel(payment.provider);
  const ref = payment.ref || payment.momo_ref;
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50">
      <span className="w-11 shrink-0 text-xs text-muted-foreground tabular-nums">
        {formatTime(payment.received_at)}
      </span>
      <Badge variant="secondary" className="shrink-0 font-normal">
        {provider}
      </Badge>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
        {payment.account_number || ref || ''}
      </span>
      <span className="shrink-0 text-sm font-medium tabular-nums">
        {formatAmount(amount)}đ
      </span>
    </div>
  );
}

export function TransferToday() {
  const { data: payments = [], isLoading } = usePayments({
    dateRange: 'today',
    showTest: false,
  });

  const { total, count } = useMemo(() => {
    let total = 0;
    payments.forEach(p => {
      total += Number(p.amount) || 0;
    });
    return { total, count: payments.length };
  }, [payments]);

  return (
    <Collapsible className="group/collapsible-transfer rounded-xl border bg-card shadow-sm">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-3 text-left"
        >
          <Landmark className="size-4 text-sky-600" />
          <span className="text-sm font-semibold">Chuyển khoản hôm nay</span>
          {isLoading ? (
            <Skeleton className="h-4 w-24" />
          ) : (
            <span className="text-xs text-muted-foreground tabular-nums">
              {count} giao dịch · {formatAmount(total)}đ
            </span>
          )}
          <ChevronDown className="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible-transfer:rotate-180" />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t px-2 py-1">
          {!isLoading && count === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Chưa có giao dịch chuyển khoản nào hôm nay
            </p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="mx-2 my-2 h-9 w-[calc(100%-1rem)]"
                    />
                  ))
                : payments.map(p => <TransferRow key={p.id} payment={p} />)}
            </div>
          )}
          <p className="px-2 pb-2 pt-1 text-xs text-muted-foreground">
            Không gồm giao dịch test
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
