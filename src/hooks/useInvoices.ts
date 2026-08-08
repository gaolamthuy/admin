/**
 * useInvoices hook với TanStack Query
 * Fetch invoices (hóa đơn) từ Supabase
 *
 * @module hooks/useInvoices
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';

/**
 * Invoice interface (kv_invoices)
 */
export interface Invoice {
  id: number;
  kiotviet_id: number | null;
  code: string | null;
  purchase_date: string | null;
  branch_name: string | null;
  sold_by_name: string | null;
  customer_name: string | null;
  customer_code: string | null;
  total: number | null;
  total_payment: number | null;
  status: number | null;
  status_value: string | null;
  discount: number | null;
  description: string | null;
  sale_channel_name: string | null;
  created_at: string | null;
}

/**
 * Hook fetch danh sách hóa đơn từ kv_invoices
 *
 * @param searchTerm - Từ khóa tìm kiếm theo mã HD / tên khách (tùy chọn)
 * @returns Query result với invoices data
 */
export const useInvoices = (searchTerm?: string) => {
  const { data: session } = useSession();
  const sanitizedSearch = searchTerm?.trim();

  return useQuery({
    queryKey: ['invoices', sanitizedSearch],
    queryFn: async (): Promise<Invoice[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const baseQuery = supabase.from('kv_invoices').select(
        `
          id,
          kiotviet_id,
          code,
          purchase_date,
          branch_name,
          sold_by_name,
          customer_name,
          customer_code,
          total,
          total_payment,
          status,
          status_value,
          discount,
          description,
          sale_channel_name,
          created_at
        `
      );

      // Filter search nếu có
      let query = baseQuery;
      if (sanitizedSearch) {
        const escaped = sanitizedSearch.replace(/[%_]/g, '\\$&');
        query = query.or(
          `code.ilike.%${escaped}%,customer_name.ilike.%${escaped}%`
        );
      }

      query = query
        .order('purchase_date', { ascending: false, nullsFirst: false })
        .limit(2000);

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as Invoice[];
    },
    enabled: !!session,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
};
