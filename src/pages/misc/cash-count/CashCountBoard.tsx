/**
 * CashCountBoard — bảng kiểm đếm tiền mặt theo mệnh giá, dùng lại được
 * (trang /misc/cash-count và dialog kiểm đếm cuối ca trên trang Thanh toán).
 * Dữ liệu lưu localStorage theo storageKey — mỗi ngày một key riêng.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Repeat, Trash2, Wallet } from 'lucide-react';
import {
  COLUMN_A,
  COLUMN_B,
  DENOMINATIONS,
  FLOAT_2M_TEMPLATE,
  NOTE_IMAGES,
  NOTE_IMAGE_CLASS,
  sanitizeMap,
  type CountMap,
} from './constants';

// Đọc localStorage, tương thích dữ liệu cũ (map phẳng hoặc {counts,...})
function loadCounts(storageKey: string): CountMap {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'counts' in parsed) {
      return sanitizeMap((parsed as { counts: unknown }).counts);
    }
    return sanitizeMap(parsed);
  } catch {
    return {};
  }
}

// Mặc định xếp giảm dần (500k → 1k); chỉ dùng giá trị lưu nếu có
function loadDesc(storageKey: string): boolean {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return true;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      'desc' in parsed &&
      typeof (parsed as { desc: unknown }).desc === 'boolean'
    ) {
      return (parsed as { desc: boolean }).desc;
    }
    return true;
  } catch {
    return true;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

interface CashCountBoardProps {
  storageKey: string;
  onTotals?: (totals: { total: number; sheets: number }) => void;
  className?: string;
  /** Chế độ gọn (ảnh tiền nhỏ hơn) — dùng trong dialog */
  compact?: boolean;
}

export function CashCountBoard({
  storageKey,
  onTotals,
  className,
  compact = false,
}: CashCountBoardProps) {
  const [counts, setCounts] = useState<CountMap>(() => loadCounts(storageKey));
  const [desc, setDesc] = useState(() => loadDesc(storageKey));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ counts, desc }));
  }, [storageKey, counts, desc]);

  const { total, sheets } = useMemo(() => {
    let total = 0;
    let sheets = 0;
    for (const d of DENOMINATIONS) {
      const n = counts[d] ?? 0;
      total += n * d;
      sheets += n;
    }
    return { total, sheets };
  }, [counts]);

  useEffect(() => {
    onTotals?.({ total, sheets });
  }, [onTotals, total, sheets]);

  const setCount = (denom: number, value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6);
    const n = digits ? parseInt(digits, 10) : 0;
    setCounts(prev => ({ ...prev, [denom]: n }));
  };

  const prefill2M = () => setCounts({ ...FLOAT_2M_TEMPLATE });

  const reset = () => setCounts({});

  const firstColumn = desc ? [...COLUMN_B].reverse() : [...COLUMN_A];
  const secondColumn = desc ? [...COLUMN_A].reverse() : [...COLUMN_B];
  const visualOrder: number[] = [...firstColumn, ...secondColumn];

  const renderRow = (denom: number) => {
    const index = visualOrder.indexOf(denom);
    const n = counts[denom] ?? 0;
    return (
      <div
        key={denom}
        className="grid grid-cols-[auto_1fr_6rem] items-center gap-3 rounded-lg border bg-card/50 p-2.5 transition-colors hover:bg-muted/50"
      >
        <img
          src={NOTE_IMAGES[denom]}
          alt={`Tờ ${formatNumber(denom)} đồng`}
          loading="lazy"
          className={`${compact ? 'h-16 w-auto' : NOTE_IMAGE_CLASS} rounded-md border bg-muted/30 object-contain p-1`}
        />
        <div className="flex min-w-0 flex-col items-center gap-1">
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            {formatNumber(denom)}đ
          </span>
          <Input
            ref={el => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            placeholder="0 tờ"
            value={n === 0 ? '' : String(n)}
            onChange={e => setCount(denom, e.target.value)}
            onFocus={e => e.currentTarget.select()}
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const next = inputRefs.current[index + 1];
              if (next) {
                next.focus();
              } else {
                e.currentTarget.blur();
              }
            }}
            className="h-8 w-14 text-center text-sm tabular-nums"
          />
        </div>
        <span
          className={`text-right text-sm tabular-nums ${
            n > 0 ? 'font-medium' : 'text-muted-foreground'
          }`}
        >
          {formatNumber(n * denom)}đ
        </span>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          Đếm theo mệnh giá
        </span>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDesc(v => !v)}
            title={
              desc
                ? 'Xếp mệnh giá tăng dần từ 1k đến 500k'
                : 'Xếp mệnh giá giảm dần từ 500k về 1k'
            }
          >
            <Repeat className="mr-1.5 size-3.5" />
            Đảo ngược
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={prefill2M}
            title="Soạn sẵn khối tiền thối chuẩn 2.000.000đ, ghi đè số hiện có"
          >
            <Wallet className="mr-1.5 size-3.5" />
            Soạn 2tr
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            disabled={sheets === 0}
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Xóa hết
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <div className="space-y-2">{firstColumn.map(renderRow)}</div>
        <div className="space-y-2">{secondColumn.map(renderRow)}</div>
      </div>

      <p className="rounded-lg border bg-muted/50 px-3 py-2 text-center text-sm tabular-nums">
        <span className="text-muted-foreground">Tổng: </span>
        <span className="text-base font-bold">{formatNumber(total)}đ</span>
        <span className="text-muted-foreground">
          {' '}
          · {formatNumber(sheets)} tờ
        </span>
      </p>
    </div>
  );
}
