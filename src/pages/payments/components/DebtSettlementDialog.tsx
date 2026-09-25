/**
 * DebtSettlementDialog — copy station cho gạch nợ ATY (stateless).
 * Mở từ strip trên card giao dịch aty (admin-only). Hiển thị 3 hàng copy
 * (mô tả CK / số tiền / thời gian) để dán vào phiếu thu trên KiotViet portal,
 * kèm checklist hóa đơn chưa trả (live KV). Không có action — thu trực tiếp
 * trên KV UI.
 */

import { useState } from 'react';
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
import { Check, Copy, Loader2 } from 'lucide-react';
import { useAtySuggestion } from '../hooks/useAtySuggestion';

const fmtVnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate font-mono text-xs" title={value}>
          {value}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="h-7 shrink-0 gap-1 px-2 text-[11px]"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="size-3 text-green-600" />
        ) : (
          <Copy className="size-3" />
        )}
        {copied ? 'Đã copy' : 'Copy'}
      </Button>
    </div>
  );
}

export function DebtSettlementDialog({
  ref: atyRef,
  open,
  onOpenChange,
}: {
  ref: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: sug, isLoading } = useAtySuggestion(open ? atyRef : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gợi ý gạch nợ ATY</DialogTitle>
          <DialogDescription>
            Copy thông tin bên dưới rồi tạo phiếu thu trên KiotViet
            {sug?.matched ? ` — ${sug.customer_name ?? sug.customer_code}` : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !sug?.matched ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {sug?.reason ?? 'Không phải giao dịch ATY'}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {sug.match_how}
                {sug.range_start && sug.range_end
                  ? ` ${fmtDate(sug.range_start)}→${fmtDate(sug.range_end)}`
                  : ''}
              </Badge>
              {sug.live && (
                <Badge variant="outline" className="text-[10px]">
                  live KV
                </Badge>
              )}
              {sug.diff !== 0 && (
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px]',
                    sug.diff > 0
                      ? 'border-orange-500/50 text-orange-600'
                      : 'border-blue-500/50 text-blue-600'
                  )}
                >
                  {sug.diff > 0
                    ? `CK thiếu ${fmtVnd(sug.diff)}`
                    : `CK thừa ${fmtVnd(-sug.diff)}`}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <CopyRow label="Mô tả" value={sug.ref} />
              <CopyRow label="Số tiền" value={String(sug.amount)} />
              {sug.received_str && (
                <CopyRow label="Thời gian" value={sug.received_str} />
              )}
            </div>

            {sug.invoices.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-[10px] text-muted-foreground">
                    <th className="py-1 pr-2 font-medium">Hóa đơn cần thu</th>
                    <th className="py-1 pr-2 font-medium">Ngày</th>
                    <th className="py-1 pr-2 text-right font-medium">Tổng</th>
                    <th className="py-1 text-right font-medium">Còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {sug.invoices.map(inv => (
                    <tr key={inv.code} className="border-b last:border-0">
                      <td className="py-1.5 pr-2 font-mono">{inv.code}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">
                        {inv.purchase_date}
                      </td>
                      <td className="py-1.5 pr-2 text-right text-muted-foreground">
                        {fmtVnd(inv.total)}
                      </td>
                      <td className="py-1.5 text-right font-semibold">
                        {fmtVnd(inv.remaining)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                Không còn hóa đơn chưa trả phù hợp — có thể đã gạch rồi
              </p>
            )}

            {sug.notes.length > 0 && (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {sug.notes.join(' | ')}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DebtSettlementDialog;
