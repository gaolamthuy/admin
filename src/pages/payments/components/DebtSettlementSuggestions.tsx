/**
 * DebtSettlementSuggestions — section "Gợi ý gạch nợ" (admin-only)
 * trên trang Thanh toán. List debt_settlements pending của 2 khách ATY,
 * duyệt → ghi phiếu thu KiotViet (approve_debt_settlement) hoặc bỏ qua.
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Check, FileCheck2, Loader2, Plus, X } from 'lucide-react';
import {
  useActDebtSettlement,
  useDebtSettlements,
  useManualDebtSettlement,
  type DebtSuggestion,
} from '../hooks/useDebtSettlements';

const fmtVnd = (n: number) => `${n.toLocaleString('vi-VN')}đ`;

function RangeBadge({ suggestion }: { suggestion: DebtSuggestion }) {
  if (!suggestion.range_start || !suggestion.range_end) return null;
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };
  return (
    <Badge variant="outline" className="text-[10px]">
      {fmt(suggestion.range_start)} → {fmt(suggestion.range_end)}
    </Badge>
  );
}

function SuggestionItem({
  suggestion,
  acting,
  onAct,
}: {
  suggestion: DebtSuggestion;
  acting: boolean;
  onAct: (action: 'approve' | 'reject') => void;
}) {
  const diff = suggestion.diff;
  const hasWarning = diff !== 0 || !!suggestion.note;

  return (
    <div className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {suggestion.customer_name || suggestion.customer_code}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {suggestion.match_how}
            </Badge>
            <RangeBadge suggestion={suggestion} />
            {suggestion.status === 'no_account' && (
              <Badge variant="destructive" className="text-[10px]">
                chưa map STK
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>
              CK:{' '}
              <span className="font-semibold text-foreground">
                {fmtVnd(suggestion.amount)}
              </span>
            </span>
            {suggestion.received_str && (
              <span>· nhận {suggestion.received_str}</span>
            )}
            <span>· gợi ý {suggestion.created_str}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {suggestion.invoices.length > 0 ? (
              suggestion.invoices.map(inv => (
                <span
                  key={inv.code}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 font-mono text-[11px]"
                  title={`${inv.code} — tổng ${fmtVnd(inv.total)}, còn ${fmtVnd(inv.remaining)}`}
                >
                  {inv.code}
                  <span className="text-muted-foreground">
                    {inv.purchase_date}
                  </span>
                  <span className="font-semibold">{fmtVnd(inv.remaining)}</span>
                </span>
              ))
            ) : (
              <span className="text-xs italic text-muted-foreground">
                Không có hóa đơn phù hợp
              </span>
            )}
          </div>

          {hasWarning && (
            <div className="space-y-1">
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
                    ? `CK thiếu ${fmtVnd(diff)} so với tổng hóa đơn`
                    : `CK thừa ${fmtVnd(-diff)} so với tổng hóa đơn`}
                </Badge>
              )}
              {suggestion.note && (
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {suggestion.note}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-emerald-600 px-3 text-xs hover:bg-emerald-700"
            disabled={acting || suggestion.invoices.length === 0}
            onClick={() => {
              if (
                window.confirm(
                  `Ghi phiếu thu KiotViet cho ${
                    suggestion.invoices.length
                  } hóa đơn (tổng ${fmtVnd(suggestion.sum_remaining)})?`
                )
              ) {
                onAct('approve');
              }
            }}
          >
            {acting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Duyệt gạch nợ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 px-3 text-xs"
            disabled={acting}
            onClick={() => {
              if (window.confirm('Bỏ gợi ý gạch nợ này?')) {
                onAct('reject');
              }
            }}
          >
            <X className="size-3.5" />
            Bỏ qua
          </Button>
        </div>
      </div>
    </div>
  );
}

function ManualEntryDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const { submit, submitting } = useManualDebtSettlement();

  const handleSubmit = async () => {
    const result = await submit(text, date || undefined);
    if (result) {
      setText('');
      setDate('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ghi phiếu thu thủ công</DialogTitle>
          <DialogDescription>
            Dòng 1 = mô tả chuyển khoản (chứa mã FT...), các dòng sau = mã hóa
            đơn cần gạch. Ngày phiếu thu mặc định lấy ngày CK.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder={
              'FT26260750474280,NGUYEN HONG TRUC,TKH TT GAO 6-20/8/26...\nHD071729\nHD071939'
            }
            className="font-mono text-xs"
          />
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-8 w-40 text-xs"
              aria-label="Ngày phiếu thu (tùy chọn)"
            />
            <span className="text-[11px] text-muted-foreground">
              Tuỳ chọn — bỏ trống dùng ngày CK
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Huỷ
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={
              submitting || text.trim().split('\n').filter(Boolean).length < 2
            }
          >
            {submitting && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
            Ghi phiếu thu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const DebtSettlementSuggestions = () => {
  const { data: suggestions = [], isLoading } = useDebtSettlements();
  const { act, actingId } = useActDebtSettlement();
  const [manualOpen, setManualOpen] = useState(false);

  if (isLoading) {
    return null;
  }

  return (
    <Card className="border-sky-500/40">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck2 className="size-4 text-sky-600" />
            <CardTitle>Gợi ý gạch nợ ATY</CardTitle>
            {suggestions.length > 0 && (
              <Badge variant="default" className="text-[10px]">
                {suggestions.length} chờ duyệt
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs"
            onClick={() => setManualOpen(true)}
          >
            <Plus className="size-3.5" />
            Nhập tay
          </Button>
        </div>
      </CardHeader>
      {suggestions.length > 0 && (
        <CardContent className="space-y-3">
          {suggestions.map(s => (
            <SuggestionItem
              key={s.id}
              suggestion={s}
              acting={actingId === s.id}
              onAct={action => act(s.id, action)}
            />
          ))}
        </CardContent>
      )}
      <ManualEntryDialog open={manualOpen} onOpenChange={setManualOpen} />
    </Card>
  );
};

export default DebtSettlementSuggestions;
