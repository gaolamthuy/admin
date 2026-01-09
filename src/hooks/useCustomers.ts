/**
 * useCustomers hook với TanStack Query
 * Fetch customers từ Supabase
 *
 * @module hooks/useCustomers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';
import { compareDates } from '@/utils/date';

/**
 * Customer interface
 * ⭐ Không include recent_invoices ở list page để tối ưu performance
 * recent_invoices chỉ load khi vào detail page
 */
export interface Customer {
  id: number;
  kiotviet_id: number;
  code: string | null;
  name: string | null;
  contact_number: string | null;
  address: string | null;
  debt: number | null;
  retailer_id: number | null;
  branch_id: number | null;
  location_name: string | null;
  ward_name: string | null;
  type: number | null;
  groups: string | null;
  comments: string | null;
  glt_is_active: boolean | null;
  glt_customer_group_name: string | null;
  glt_notes: string | null;
  search_priority: number;
  created_date: string | null;
  modified_date: string | null;
  synced_at: string | null;
  // ⭐ NEW: Latest invoice datetime để sort (không load recent_invoices ở list)
  latest_invoice_datetime: string | null;
}

/**
 * Hook fetch customers từ view v_customers_admin
 * View này clone từ kv_customers và có thể mở rộng thêm các field custom sau này
 *
 * @param searchTerm - Từ khóa tìm kiếm theo tên/mã/SĐT (tùy chọn)
 * @returns Query result với customers data
 */
export const useCustomers = (searchTerm?: string) => {
  const { data: session } = useSession();
  const sanitizedSearch = searchTerm?.trim();

  return useQuery({
    queryKey: ['customers', sanitizedSearch],
    queryFn: async (): Promise<Customer[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Query từ view v_customers_admin
      // ⭐ Tối ưu: Không select recent_invoices ở list page (chỉ load khi vào detail)
      // Chỉ select các fields cần thiết + latest_invoice_datetime để sort
      // ⭐ Performance: Limit 2000 records để tránh load quá nhiều (frontend sẽ paginate)
      const baseQuery = supabase
        .from('v_customers_admin')
        .select(
          `
          id,
          kiotviet_id,
          code,
          name,
          contact_number,
          address,
          debt,
          retailer_id,
          branch_id,
          location_name,
          ward_name,
          type,
          groups,
          comments,
          glt_is_active,
          glt_customer_group_name,
          glt_notes,
          search_priority,
          created_date,
          modified_date,
          synced_at,
          latest_invoice_datetime
          `
        );

      // Thêm filter search nếu có
      let query = baseQuery;
      if (sanitizedSearch) {
        const escaped = sanitizedSearch.replace(/[%_]/g, '\\$&');
        query = query.or(
          `name.ilike.%${escaped}%,code.ilike.%${escaped}%,contact_number.ilike.%${escaped}%`
        );
      }

      // ⭐ Sort phải được gọi SAU khi đã áp dụng tất cả filters
      // Đảm bảo sort luôn được áp dụng (mới nhất trước, nulls ở cuối)
      // ⚠️ Supabase chỉ hỗ trợ nullsFirst, không có nullsLast
      // Để đưa nulls về cuối, dùng nullsFirst: false
      query = query
        .order('latest_invoice_datetime', { ascending: false, nullsFirst: false })
        .limit(2000); // ⭐ Limit để tối ưu performance

      const { data, error } = await query;

      if (error) throw error;
      
      // ⭐ Sort ở frontend để đảm bảo luôn được áp dụng
      // Sort theo latest_invoice_datetime DESC (mới nhất trước), nulls ở cuối
      // Dùng compareDates để đảm bảo parse đúng timezone
      const sortedData = (data || []).sort((a, b) => {
        // Nếu cả hai đều null, giữ nguyên thứ tự
        if (!a.latest_invoice_datetime && !b.latest_invoice_datetime) return 0;
        // Nếu a null, đưa về cuối
        if (!a.latest_invoice_datetime) return 1;
        // Nếu b null, đưa về cuối
        if (!b.latest_invoice_datetime) return -1;
        // So sánh datetime (mới nhất trước) - dùng compareDates để parse đúng UTC
        // compareDates trả về -1 nếu date1 < date2, 1 nếu date1 > date2
        // Để sort DESC (mới nhất trước), cần đảo ngược: b so với a
        return compareDates(b.latest_invoice_datetime, a.latest_invoice_datetime);
      });
      
      return sortedData as Customer[];
    },
    enabled: !!session,
    staleTime: 30 * 1000, // Giảm xuống 30s để đảm bảo sort được áp dụng
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook fetch single customer by ID từ view v_customers_admin
 * ⭐ Load đầy đủ data bao gồm recent_invoices (dùng cho detail page)
 *
 * @param id - Customer ID
 * @returns Query result với customer data (bao gồm recent_invoices)
 */
export const useCustomer = (id: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['customers', id],
    queryFn: async (): Promise<Customer & { recent_invoices?: any } | null> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      // ⭐ Detail page: Load đầy đủ bao gồm recent_invoices
      const { data, error } = await supabase
        .from('v_customers_admin')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Customer & { recent_invoices?: any };
    },
    enabled: !!session && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
