/**
 * useDailyCashflow — lấy tổng thu chi trong ngày từ Sổ quỹ KiotViet
 * qua Windmill script f/frontend_admin/get_daily_cashflow.
 * Dùng cho dialog kiểm đếm cuối ca trên trang Thanh toán.
 */
import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { getWindmillApiUrl } from '@/lib/windmill';

// p/ = chạy theo script path (f/ là cho flow)
const SCRIPT_PATH =
  'jobs/run_wait_result/p/f/frontend_admin/get_daily_cashflow';

export interface CashflowVoucher {
  code: string | null;
  transDate: string | null;
  amount: number;
  method: string;
  isReceipt: boolean;
  partnerName: string | null;
  description: string | null;
}

export interface DailyCashflow {
  date: string;
  username: string;
  count: number;
  totalIn: number;
  totalOut: number;
  cashIn: number;
  cashOut: number;
  transferIn: number;
  transferOut: number;
  cardIn: number;
  cardOut: number;
  otherIn: number;
  otherOut: number;
  vouchers: CashflowVoucher[];
}

async function fetchDailyCashflow(date: string): Promise<DailyCashflow> {
  const token = env.VITE_BACKEND_TOKEN;
  if (!token) {
    throw new Error('VITE_BACKEND_TOKEN chưa được cấu hình');
  }

  const url = getWindmillApiUrl('w', SCRIPT_PATH);
  if (!url) {
    throw new Error('VITE_BACKEND_URL chưa được cấu hình');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ date }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const message =
      (err?.error?.message as string | undefined) ||
      `Lấy sổ quỹ KiotViet thất bại: ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as DailyCashflow;
}

export const useDailyCashflow = (date: string | null) =>
  useQuery({
    queryKey: ['daily-cashflow', date],
    queryFn: () => fetchDailyCashflow(date!),
    enabled: !!date,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
