/**
 * useCustomers hook với TanStack Query
 * Fetch customers từ Supabase
 *
 * @module hooks/useCustomers
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';

/**
 * Customer interface
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
}

/**
 * Hook fetch customers
 *
 * @returns Query result với customers data
 */
export const useCustomers = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['customers'],
    queryFn: async (): Promise<Customer[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_customers')
        .select('*')
        .order('created_date', { ascending: false });

      if (error) throw error;
      return (data || []) as Customer[];
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook fetch single customer by ID
 *
 * @param id - Customer ID
 * @returns Query result với customer data
 */
export const useCustomer = (id: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['customers', id],
    queryFn: async (): Promise<Customer | null> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Customer;
    },
    enabled: !!session && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};
