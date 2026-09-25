/**
 * AtySettlementLine — 1 dòng mở dialog gợi ý gạch nợ ATY, nhúng trong card
 * giao dịch aty (admin-only). Stateless: hiện cố định trên mọi card aty.
 */

import { FileCheck2 } from 'lucide-react';

export function AtySettlementLine({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={e => {
        e.stopPropagation();
        onOpen();
      }}
      className="mt-1 flex w-full items-center gap-1.5 rounded-md border-l-2 border-sky-500 bg-sky-500/5 px-2 py-1.5 text-left text-[11px] font-medium text-sky-700 transition-colors hover:bg-sky-500/10"
      title="Xem gợi ý gạch nợ (copy thông tin tạo phiếu thu trên KiotViet)"
    >
      <FileCheck2 className="size-3.5 shrink-0" />
      <span className="truncate">Gạch nợ ATY</span>
      <span className="ml-auto shrink-0 text-sky-400">→</span>
    </button>
  );
}

export default AtySettlementLine;
