/**
 * usePurchaseOrders hook với TanStack Query
 * Fetch purchase orders từ Supabase
 *
 * @module hooks/usePurchaseOrders
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';

/**
 * Purchase Order Detail Item interface (từ details jsonb)
 */
export interface PurchaseOrderDetailItem {
  id: number;
  product_id: number;
  product_code: string | null;
  product_name: string | null;
  quantity: number;
  price: number;
  discount: number;
  base_price: number | null;
  glt_status: string | null;
  glt_note: string | null;
  glt_admin_note: string | null;
  inventory_cost: number | null;
  glt_baseprice_markup: number | null;
  calculate_price?: {
    cost_diff_now?: number;
    cost_suggestion?: number;
    baseprice_diff_now?: number;
    baseprice_suggestion?: number;
    glt_extra_cost_per_unit?: number;
  };
  previous_purchase_info?: {
    prev_price?: number;
    price_change?: number;
    prev_quantity?: number;
    quantity_change?: number;
    supplier_changed?: boolean;
    prev_purchase_date?: string;
    prev_supplier_name?: string;
    prev_purchase_order_id?: number;
    price_change_percentage?: number | null;
    days_since_last_purchase?: number;
    quantity_change_percentage?: number;
  };
}

/**
 * Purchase Order interface (từ v_purchase_orders)
 */
export interface PurchaseOrder {
  id: number;
  po_kiotviet_id: number | null;
  code: string | null;
  description: string | null;
  supplier_name: string | null;
  supplier_code: string | null;
  purchase_date: string | null;
  total: number | null;
  total_payment: number | null;
  discount: number | null;
  discount_ratio: number | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_date: string | null;
  total_items: number | null;
  total_quantity: number | null;
  avg_price: number | null;
  overall_status: string | null;
  combined_notes: string | null;
  combined_admin_notes: string | null;
  details: PurchaseOrderDetailItem[] | null;
}

/**
 * Purchase Order Detail interface
 */
export interface PurchaseOrderDetail {
  id: number;
  purchase_order_id: number;
  product_id: number | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
  discount: number | null;
}

/**
 * Hook fetch purchase orders từ view v_purchase_orders
 * Chỉ lấy orders có status = 3 (status 4 là đã hủy)
 *
 * @returns Query result với purchase orders data
 */
export const usePurchaseOrders = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async (): Promise<PurchaseOrder[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('v_purchase_orders')
        .select('*')
        .eq('status', 3) // Chỉ lấy status = 3
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as PurchaseOrder[];
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook fetch single purchase order by ID
 *
 * @param id - Purchase order ID
 * @returns Query result với purchase order data
 */
export const usePurchaseOrder = (id: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['purchase-orders', id],
    queryFn: async (): Promise<PurchaseOrder | null> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_purchase_orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as PurchaseOrder;
    },
    enabled: !!session && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook fetch purchase order details
 *
 * @param purchaseOrderId - Purchase order ID
 * @returns Query result với purchase order details
 */
export const usePurchaseOrderDetails = (purchaseOrderId: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['purchase-orders', purchaseOrderId, 'details'],
    queryFn: async (): Promise<PurchaseOrderDetail[]> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_purchase_order_details')
        .select('*')
        .eq('purchase_order_id', purchaseOrderId)
        .order('id');

      if (error) throw error;
      return (data || []) as PurchaseOrderDetail[];
    },
    enabled: !!session && !!purchaseOrderId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook fetch suppliers
 *
 * @returns Query result với suppliers data
 */
export const useSuppliers = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_suppliers')
        .select('kiotviet_id, name, code, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
    staleTime: 10 * 60 * 1000, // 10 phút (suppliers ít thay đổi)
    refetchOnWindowFocus: false,
  });
};

/**
 * Create purchase order mutation
 *
 * @returns Mutation object với createPurchaseOrder function
 */
export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<PurchaseOrder>) => {
      const { data: result, error } = await supabase
        .from('kv_purchase_orders')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result as PurchaseOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
};
