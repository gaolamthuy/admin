/**
 * Types & hooks cho supplier cost defaults (chi phí nhập hàng: cước xe, xuống gạo...)
 * @module pages/purchase-orders/hooks/useSupplierCostDefaults
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ensureSessionActive } from '@/lib/supabase-session';

export interface CostType {
  code: string;
  name: string;
  is_supplier_expense: boolean;
  sort_order: number;
}

export interface SupplierCostDefault {
  id: number;
  supplier_kiotviet_id: number;
  cost_type_code: string;
  cost_type_name: string;
  is_supplier_expense: boolean;
  sort_order: number;
  default_value: number;
  is_active: boolean;
  updated_at: string | null;
  note: string | null;
}

export const useCostTypes = () => {
  return useQuery({
    queryKey: ['cost-types'],
    queryFn: async (): Promise<CostType[]> => {
      const { data, error } = await supabase
        .from('glt_cost_types')
        .select('code, name, is_supplier_expense, sort_order')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
};

/**
 * Fetch default surcharges cho 1 supplier.
 * Trả về mảng (có thể rỗng nếu chưa config).
 */
export const useSupplierCostDefaults = (
  supplierKiotvietId: number | null | undefined
) => {
  return useQuery({
    queryKey: ['supplier-cost-defaults', supplierKiotvietId],
    enabled: supplierKiotvietId != null,
    queryFn: async (): Promise<SupplierCostDefault[]> => {
      if (supplierKiotvietId == null) return [];
      await ensureSessionActive(supabase);
      const { data, error } = await supabase
        .from('v_supplier_cost_defaults')
        .select(
          'id, supplier_kiotviet_id, cost_type_code, cost_type_name, is_supplier_expense, sort_order, default_value, is_active, updated_at, note'
        )
        .eq('supplier_kiotviet_id', supplierKiotvietId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
};

export interface UpsertSupplierCostDefaultInput {
  supplier_kiotviet_id: number;
  cost_type_code: string;
  default_value: number;
  note?: string | null;
}

/**
 * Upsert default value cho 1 (supplier, cost_type).
 * Dùng ở trang config.
 */
export const useUpsertSupplierCostDefault = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpsertSupplierCostDefaultInput) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;

      const { data, error } = await supabase
        .from('glt_supplier_cost_defaults')
        .upsert(
          {
            supplier_kiotviet_id: input.supplier_kiotviet_id,
            cost_type_code: input.cost_type_code,
            default_value: input.default_value,
            note: input.note ?? null,
            updated_by: userId,
            is_active: true,
          },
          { onConflict: 'supplier_kiotviet_id,cost_type_code' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-cost-defaults', variables.supplier_kiotviet_id],
      });
    },
  });
};

export interface SurchargeHistoryEntry {
  id: number;
  supplier_kiotviet_id: number;
  cost_type_code: string;
  value: number;
  note: string | null;
  po_code: string | null;
  created_at: string;
}

export interface SurchargeHistoryRow {
  supplier_kiotviet_id: number;
  cost_type_code: string;
  value: number;
  note?: string | null;
  po_code?: string | null;
}

/**
 * Lịch sử chi phí nhập hàng của supplier (append-only log),
 * group theo cost_type_code, mỗi loại tối đa perTypeLimit entries mới nhất.
 */
export const useSupplierSurchargeHistory = (
  supplierKiotvietId: number | null | undefined,
  perTypeLimit = 5
) => {
  return useQuery({
    queryKey: ['supplier-surcharge-history', supplierKiotvietId],
    enabled: supplierKiotvietId != null,
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, SurchargeHistoryEntry[]>> => {
      const { data, error } = await supabase
        .from('glt_supplier_surcharge_history')
        .select(
          'id, supplier_kiotviet_id, cost_type_code, value, note, po_code, created_at'
        )
        .eq('supplier_kiotviet_id', supplierKiotvietId!)
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;

      const grouped: Record<string, SurchargeHistoryEntry[]> = {};
      (data ?? []).forEach(r => {
        const entry: SurchargeHistoryEntry = { ...r, value: Number(r.value) };
        const list = grouped[r.cost_type_code] ?? [];
        if (list.length < perTypeLimit) list.push(entry);
        grouped[r.cost_type_code] = list;
      });
      return grouped;
    },
  });
};

/**
 * Append rows vào lịch sử chi phí (gọi khi tạo PO thành công).
 */
export const useInsertSurchargeHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: SurchargeHistoryRow[]) => {
      if (rows.length === 0) return;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user?.id ?? null;
      const { error } = await supabase
        .from('glt_supplier_surcharge_history')
        .insert(rows.map(r => ({ ...r, created_by: userId })));
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-surcharge-history'],
      });
    },
  });
};
