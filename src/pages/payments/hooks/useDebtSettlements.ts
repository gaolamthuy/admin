/**
 * useDebtSettlements — pending suggestions + map theo glt_ref + approve/reject
 * qua Windmill f/frontend_admin/{get,approve}_debt_settlements.
 * Dùng cho strip gạch nợ ATY nhúng trong card giao dịch + dialog duyệt
 * (admin-only) trên trang Thanh toán.
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import { getWindmillApiUrl } from '@/lib/windmill';

const LIST_PATH =
  'jobs/run_wait_result/p/f/frontend_admin/get_debt_settlements';
const ACT_PATH =
  'jobs/run_wait_result/p/f/frontend_admin/approve_debt_settlement';

export interface DebtInvoice {
  code: string;
  purchase_date: string;
  total: number;
  remaining: number;
}

export interface DebtSuggestion {
  id: number;
  glt_ref: string;
  amount: number;
  customer_code: string;
  customer_name: string | null;
  range_start: string | null;
  range_end: string | null;
  status: string;
  match_how: string;
  note: string | null;
  account_number: string | null;
  live: boolean;
  created_str: string;
  received_str: string | null;
  invoices: DebtInvoice[];
  diff: number;
  sum_remaining: number;
}

export interface RefSuggestion {
  status: string;
  invoice_codes: string[];
  payment_codes: string[] | null;
}

export interface ActDebtSettlementResult {
  status: string;
  id: number;
  payments?: { invoice_code: string; amount: number }[];
  skipped?: { code: string; reason: string }[];
  leftover?: number | null;
}

async function callWindmill<T>(path: string, body: unknown): Promise<T> {
  const token = env.VITE_BACKEND_TOKEN;
  const url = getWindmillApiUrl('w', path);
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
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const message =
      (err?.error?.message as string | undefined) ||
      `Windmill error: ${res.status}`;
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export const useDebtSettlements = (enabled = true) =>
  useQuery({
    queryKey: ['debt-settlements'],
    queryFn: async () => {
      const r = await callWindmill<{
        suggestions: DebtSuggestion[];
        by_ref?: Record<string, RefSuggestion>;
      }>(LIST_PATH, {});
      return {
        pending: r.suggestions ?? [],
        pendingCount: r.suggestions?.length ?? 0,
        byRef: r.by_ref ?? {},
      };
    },
    enabled,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

export const useActDebtSettlement = () => {
  const queryClient = useQueryClient();
  const [actingId, setActingId] = useState<number | null>(null);

  const act = async (
    id: number,
    action: 'approve' | 'reject',
    note?: string
  ): Promise<boolean> => {
    setActingId(id);
    try {
      const result = await callWindmill<ActDebtSettlementResult>(ACT_PATH, {
        action,
        settlement_id: id,
        ...(note ? { note } : {}),
      });

      if (action === 'approve') {
        if (result.status === 'already_settled') {
          toast.info('Hóa đơn đã được trả đủ trên KiotViet', {
            description: `Đã đóng gợi ý #${result.id} — không ghi phiếu thu nào thêm`,
          });
        } else {
          const total = (result.payments ?? []).reduce(
            (sum, p) => sum + p.amount,
            0
          );
          toast.success(
            `Đã ghi ${result.payments?.length ?? 0} phiếu thu KiotViet`,
            {
              description: `${total.toLocaleString('vi-VN')}đ${
                result.leftover
                  ? ` — còn dư ${result.leftover.toLocaleString('vi-VN')}đ chưa phân bổ`
                  : ''
              }`,
            }
          );
        }
      } else {
        toast.info('Đã bỏ gợi ý gạch nợ');
      }

      await queryClient.invalidateQueries({ queryKey: ['debt-settlements'] });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Thao tác thất bại';
      toast.error(
        action === 'approve'
          ? 'Duyệt gạch nợ thất bại — chưa ghi phiếu thu nào'
          : 'Bỏ gợi ý thất bại',
        { description: message }
      );
      return false;
    } finally {
      setActingId(null);
    }
  };

  return { act, actingId };
};
