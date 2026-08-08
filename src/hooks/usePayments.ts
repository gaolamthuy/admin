/**
 * usePayments hook
 * Đọc lịch sử thanh toán từ bảng glt_payment
 *
 * @module hooks/usePayments
 */

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';
import type { Payment } from '@/types/payment';

export type { Payment };

dayjs.extend(utc);
dayjs.extend(timezone);

export interface UsePaymentsOptions {
  isAdmin?: boolean;
  showAll?: boolean;
}

/**
 * Hook fetch danh sách thanh toán từ bảng glt_payment
 * Chỉ dùng để xem lịch sử, không tạo mới
 *
 * ⚠️ Phân quyền:
 * - Staff: Chỉ xem 7 ngày gần nhất (ko toggle)
 * - Admin: Mặc định 7 ngày, có thể bật showAll để xem toàn bộ
 *
 * @param options - isAdmin, showAll
 * @returns Danh sách payments đã sort mới nhất trước
 */
export const usePayments = (options: UsePaymentsOptions = {}) => {
  const { isAdmin = false, showAll = false } = options;
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['payments', isAdmin, showAll],
    queryFn: async (): Promise<Payment[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      let query = supabase
        .from('glt_payment')
        .select(
          `
          id,
          provider,
          account_number,
          amount,
          currency,
          transaction_type,
          balance,
          ref,
          momo_ref,
          received_at,
          raw_body,
          created_at,
          test_trans,
          handle_status,
          handle_ref,
          handle_note,
          momo_extrafield
        `
        )
        .order('received_at', { ascending: false, nullsFirst: false });

      if (isAdmin && showAll) {
        query = query.limit(5000);
      } else {
        const VN_TIMEZONE = 'Asia/Ho_Chi_Minh';
        const sevenDaysAgo = dayjs()
          .tz(VN_TIMEZONE)
          .subtract(7, 'day')
          .startOf('day')
          .utc()
          .toISOString();

        query = query
          .gte('received_at', sevenDaysAgo)
          .limit(1000);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as Payment[];
    },
    enabled: !!session,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
