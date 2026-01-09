/**
 * usePayments hook
 * Đọc lịch sử thanh toán từ bảng glt_payment
 *
 * @module hooks/usePayments
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';

/**
 * Kiểu dữ liệu cho bản ghi thanh toán trong bảng glt_payment
 */
export interface Payment {
  id: string;
  provider: string;
  account_number: string | null;
  amount: number | null;
  currency: string | null;
  transaction_type: string | null;
  balance: number | null;
  ref: string | null;
  note: string | null;
  received_at: string | null;
  raw_body: unknown;
  created_at: string | null;
  test_trans: boolean | null;
  handle_status: string;
  handle_ref: string | null;
  handle_note: string | null;
}

/**
 * Hook fetch danh sách thanh toán từ bảng glt_payment
 * Chỉ dùng để xem lịch sử, không tạo mới
 * 
 * ⚠️ Phân quyền:
 * - Admin: Lấy tất cả records (không limit hoặc limit cao)
 * - Staff: Chỉ lấy 20 records đầu tiên
 *
 * @param isAdmin - Có phải admin không (mặc định: false)
 * @returns Danh sách payments đã sort mới nhất trước
 */
export const usePayments = (isAdmin: boolean = false) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['payments', isAdmin],
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
          note,
          received_at,
          raw_body,
          created_at,
          test_trans,
          handle_status,
          handle_ref,
          handle_note
        `
        )
        // Ưu tiên giao dịch thật, bỏ qua test nếu cần
        .order('received_at', { ascending: false, nullsFirst: false });

      // ⚠️ Phân quyền: Admin lấy tất cả, Staff chỉ lấy 20 records đầu
      if (!isAdmin) {
        query = query.limit(20);
      } else {
        // Admin có thể lấy nhiều hơn, nhưng vẫn giới hạn để tránh quá tải
        query = query.limit(5000);
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

