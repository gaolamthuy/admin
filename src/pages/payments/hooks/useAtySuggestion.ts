/**
 * useAtySuggestion — gợi ý gạch nợ ATY STATELESS qua Windmill
 * f/frontend_admin/get_aty_suggestion. Fetch khi mở dialog (live KV mỗi lần),
 * không mutation — admin tự tạo phiếu thu trên KiotViet portal.
 */
import { useQuery } from '@tanstack/react-query';
import { env } from '@/lib/env';
import { getWindmillApiUrl } from '@/lib/windmill';

const SCRIPT_PATH =
  'jobs/run_wait_result/p/f/frontend_admin/get_aty_suggestion';

export interface AtySuggestionInvoice {
  code: string;
  purchase_date: string;
  total: number;
  remaining: number;
}

export interface AtySuggestion {
  matched: boolean;
  reason?: string;
  ref: string;
  amount: number;
  received_str: string | null;
  customer_code: string;
  customer_name: string;
  match_how: string;
  range_start: string | null;
  range_end: string | null;
  invoices: AtySuggestionInvoice[];
  sum_remaining: number;
  diff: number;
  notes: string[];
  live: boolean;
}

async function callWindmill(ref: string): Promise<AtySuggestion> {
  const token = env.VITE_BACKEND_TOKEN;
  const url = getWindmillApiUrl('w', SCRIPT_PATH);
  if (!token) {
    throw new Error('VITE_BACKEND_TOKEN chưa được cấu hình');
  }
  if (!url) {
    throw new Error('VITE_BACKEND_URL chưa được cấu hình');
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ref }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const message =
      (err?.error?.message as string | undefined) ||
      `Windmill error: ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as AtySuggestion;
}

export const useAtySuggestion = (ref: string | null) =>
  useQuery({
    queryKey: ['aty-suggestion', ref],
    queryFn: () => callWindmill(ref!),
    enabled: !!ref,
    staleTime: 0,
    gcTime: 30 * 1000,
    retry: 1,
  });
