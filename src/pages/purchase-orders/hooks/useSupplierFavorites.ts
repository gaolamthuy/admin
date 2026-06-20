/**
 * Hooks quản lý supplier favorites (bookmark).
 * Lưu trực tiếp trên cột kv_suppliers.favorite (sync KV không ghi đè —
 * ON CONFLICT chỉ update cột tường minh, không gồm favorite).
 * @module pages/purchase-orders/hooks/useSupplierFavorites
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ensureSessionActive } from '@/lib/supabase-session';

export const useSupplierFavorites = () => {
  return useQuery({
    queryKey: ['supplier-favorites'],
    queryFn: async (): Promise<number[]> => {
      await ensureSessionActive(supabase);
      const { data, error } = await supabase
        .from('kv_suppliers')
        .select('kiotviet_id')
        .eq('favorite', true);
      if (error) throw error;
      return (data ?? []).map(r => r.kiotviet_id);
    },
  });
};

/**
 * Toggle favorite: add nếu chưa có, remove nếu có.
 */
export const useToggleSupplierFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      supplierKiotvietId,
      favorite,
    }: {
      supplierKiotvietId: number;
      favorite: boolean;
    }) => {
      const { data, error } = await supabase
        .from('kv_suppliers')
        .update({ favorite })
        .eq('kiotviet_id', supplierKiotvietId)
        .select('kiotviet_id')
        .limit(1);
      if (error) throw error;
      // RLS chặn → 0 row affected, không throw error → tự phát hiện
      if (!data || data.length === 0) {
        throw new Error('Không có quyền ghi kv_suppliers (RLS chặn UPDATE)');
      }
      return { supplierKiotvietId, favorite };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplier-favorites'] });
    },
  });
};
