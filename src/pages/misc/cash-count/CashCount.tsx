import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Banknote, Repeat, Trash2, Wallet } from 'lucide-react';

const COLUMN_A = [1000, 2000, 5000, 10000, 20000] as const;
const COLUMN_B = [50000, 100000, 200000, 500000] as const;
const DENOMINATIONS: number[] = [...COLUMN_A, ...COLUMN_B];

const NOTE_IMAGES: Record<number, string> = {
  1000: '/images/vnd/1k.jpeg',
  2000: '/images/vnd/2k.jpg',
  5000: '/images/vnd/5k.jpg',
  10000: '/images/vnd/10k.jpg',
  20000: '/images/vnd/20k.jpg',
  50000: '/images/vnd/50k.jpg',
  100000: '/images/vnd/100k.jpg',
  200000: '/images/vnd/200k.jpg',
  500000: '/images/vnd/500k.jpg',
};

const STORAGE_KEY = 'glt-admin-cash-count';

// Khối tiền thối chuẩn đầu ca — sửa tại đây nếu muốn đổi tỷ lệ
// 10×100k + 10×50k + 15×20k + 20×10k = 2.000.000đ (55 tờ)
const FLOAT_2M_TEMPLATE: Partial<Record<number, number>> = {
  100000: 10,
  50000: 10,
  20000: 15,
  10000: 20,
};

// Cỡ hiển thị ảnh tiền: 1 height chung cho mọi mệnh giá (h-24 = 96px, h-32 = 128px...)
const NOTE_IMAGE_CLASS = 'h-24 w-auto';

type CountMap = Partial<Record<number, number>>;

function sanitizeMap(raw: unknown): CountMap {
  const result: CountMap = {};
  if (!raw || typeof raw !== 'object') return result;
  for (const d of DENOMINATIONS) {
    const v = (raw as CountMap)[d];
    if (typeof v === 'number' && v >= 0 && Number.isInteger(v)) {
      result[d] = v;
    }
  }
  return result;
}

// Đọc localStorage, tương thích dữ liệu cũ (map phẳng hoặc {counts,...})
function loadCounts(): CountMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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

function loadDesc(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return (
      !!parsed &&
      typeof parsed === 'object' &&
      'desc' in parsed &&
      (parsed as { desc: unknown }).desc === true
    );
  } catch {
    return false;
  }
}

function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN');
}

export function CashCount() {
  const [counts, setCounts] = useState<CountMap>(loadCounts);
  const [desc, setDesc] = useState(loadDesc);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts, desc }));
  }, [counts, desc]);

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
          className={`${NOTE_IMAGE_CLASS} rounded-md border bg-muted/30 object-contain p-1`}
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
            className="h-9 w-24 text-center tabular-nums"
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
    <div className="container mx-auto max-w-5xl space-y-6 py-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Banknote className="size-4 text-emerald-600" />
                Kiểm đếm tiền mặt
              </CardTitle>
              <CardDescription className="mt-1">
                Nhập số tờ từng mệnh giá — dữ liệu được giữ lại khi tải lại
                trang
              </CardDescription>
            </div>
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
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
