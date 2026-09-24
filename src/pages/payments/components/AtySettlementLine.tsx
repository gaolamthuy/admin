/**
 * AtySettlementLine — 1 dòng gạch nợ ATY nhúng trong card giao dịch (admin-only).
 * Pending: dòng clickable mở DebtSettlementDialog. Settled/rejected: badge mờ tĩnh
 * (chi tiết read-only được defer).
 */

import { Check, FileCheck2, X } from 'lucide-react';
import {
  type DebtSuggestion,
  type RefSuggestion,
} from '../hooks/useDebtSettlements';

export function AtySettlementLine({
  pendingSuggestion,
  settledInfo,
  onOpen,
}: {
  pendingSuggestion?: DebtSuggestion;
  settledInfo?: RefSuggestion;
  onOpen: () => void;
}) {
  if (pendingSuggestion) {
    return (
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onOpen();
        }}
        className="mt-1 flex w-full items-center gap-1.5 rounded-md border-l-2 border-sky-500 bg-sky-500/5 px-2 py-1.5 text-left text-[11px] font-medium text-sky-700 transition-colors hover:bg-sky-500/10"
        title="Xem gợi ý gạch nợ"
      >
        <FileCheck2 className="size-3.5 shrink-0" />
        <span className="truncate">
          Gạch nợ ATY · {pendingSuggestion.invoices.length} HD · chờ duyệt
        </span>
        <span className="ml-auto shrink-0 text-sky-400">→</span>
      </button>
    );
  }

  if (settledInfo?.status === 'settled') {
    const codes = settledInfo.invoice_codes.slice(0, 3).join(', ');
    return (
      <div
        className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground"
        title={`Đã gạch: ${settledInfo.invoice_codes.join(', ')}`}
      >
        <Check className="size-3 shrink-0 text-emerald-600" />
        <span className="truncate">
          Đã gạch {codes}
          {settledInfo.invoice_codes.length > 3 ? '…' : ''}
        </span>
      </div>
    );
  }

  if (settledInfo?.status === 'rejected') {
    return (
      <div className="mt-1 flex items-center gap-1.5 px-1 text-[11px] text-muted-foreground">
        <X className="size-3 shrink-0" />
        <span className="truncate">Đã bỏ qua gợi ý gạch nợ</span>
      </div>
    );
  }

  return null;
}

export default AtySettlementLine;
