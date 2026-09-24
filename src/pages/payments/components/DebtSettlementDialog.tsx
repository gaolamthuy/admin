/**
 * DebtSettlementDialog — chi tiết + duyệt gợi ý gạch nợ ATY.
 * Mở từ strip trên card giao dịch aty (admin-only). Bảng hóa đơn kèm preview
 * phân bổ FIFO số tiền CK — "sẽ thu" chính là số tiền phiếu thu sẽ ghi trên KV.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Check, Loader2, X } from 'lucide-react';
import {
  useActDebtSettlement,
  type DebtSuggestion,
} from '../hooks/useDebtSettlements';

const fmtVnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });

function fifoAllocations(s: DebtSuggestion) {
  let left = s.amount;
  return s.invoices
    .filter(inv => inv.remaining > 0)
    .map(inv => {
      const alloc = Math.min(inv.remaining, left);
      left -= alloc;
      return { ...inv, alloc };
    });
}

export function DebtSettlementDialog({
  suggestion,
  open,
  onOpenChange,
}: {
  suggestion: DebtSuggestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { act, actingId } = useActDebtSettlement();

  if (!suggestion) return null;

  const rows = fifoAllocations(suggestion);
  const willCollect = rows.reduce((s, r) => s + r.alloc, 0);
  const leftover = suggestion.amount - willCollect;
  const diff = suggestion.diff;
  const acting = actingId === suggestion.id;

  const handleAct = async (action: 'approve' | 'reject') => {
    const ok = await act(suggestion.id, action);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gợi ý gạch nợ ATY</DialogTitle>
          <DialogDescription>
            {suggestion.customer_name ?? suggestion.customer_code} ·{' '}
            {fmtVnd(suggestion.amount)}
            {suggestion.received_str
              ? ` · nhận ${suggestion.received_str}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {suggestion.match_how}
              {suggestion.range_start && suggestion.range_end
                ? ` ${fmtDate(suggestion.range_start)}→${fmtDate(suggestion.range_end)}`
                : ''}
            </Badge>
            {suggestion.live && (
              <Badge variant="outline" className="text-[10px]">
                live KV
              </Badge>
            )}
            {diff !== 0 && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px]',
                  diff > 0
                    ? 'border-orange-500/50 text-orange-600'
                    : 'border-blue-500/50 text-blue-600'
                )}
              >
                {diff > 0
                  ? `CK thiếu ${fmtVnd(diff)}`
                  : `CK thừa ${fmtVnd(-diff)}`}
              </Badge>
            )}
          </div>

          <div
            className="break-all rounded-md border bg-muted/50 p-2 font-mono text-[11px]"
            title="Mô tả chuyển khoản"
          >
            {suggestion.glt_ref}
          </div>

          {rows.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-[10px] text-muted-foreground">
                  <th className="py-1 pr-2 font-medium">Hóa đơn</th>
                  <th className="py-1 pr-2 font-medium">Ngày</th>
                  <th className="py-1 pr-2 text-right font-medium">Còn lại</th>
                  <th className="py-1 text-right font-medium">Sẽ thu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.code} className="border-b last:border-0">
                    <td className="py-1.5 pr-2 font-mono">{r.code}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">
                      {r.purchase_date}
                    </td>
                    <td className="py-1.5 pr-2 text-right">
                      {fmtVnd(r.remaining)}
                    </td>
                    <td
                      className={cn(
                        'py-1.5 text-right font-semibold',
                        r.alloc > 0
                          ? 'text-emerald-600'
                          : 'text-muted-foreground'
                      )}
                    >
                      {r.alloc > 0 ? fmtVnd(r.alloc) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs italic text-muted-foreground">
              Không còn hóa đơn chưa trả phù hợp
            </p>
          )}

          {leftover > 0 && (
            <p className="text-[11px] text-orange-600">
              CK dư {fmtVnd(leftover)} chưa phân bổ vào hóa đơn nào
            </p>
          )}
          {suggestion.note && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {suggestion.note}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAct('reject')}
            disabled={acting}
          >
            <X className="mr-1 size-3.5" />
            Bỏ qua
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => handleAct('approve')}
            disabled={acting || rows.length === 0}
          >
            {acting ? (
              <Loader2 className="mr-1 size-3.5 animate-spin" />
            ) : (
              <Check className="mr-1 size-3.5" />
            )}
            Duyệt gạch nợ — {rows.filter(r => r.alloc > 0).length} phiếu thu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DebtSettlementDialog;
