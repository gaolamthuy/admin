/**
 * Hook quản lý per-supplier PO product templates (bảng glt_supplier_po_templates)
 *
 * Nguồn sự thật duy nhất cho danh sách SP nhập hàng chuẩn của từng NCC.
 * Auto-seed: NCC chưa có rows → lấy từ nguồn cũ (po_template_products JSONB
 * hoặc kv_supplier_product_templates) rồi bulk insert (chỉ admin pass RLS).
 */
import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { ChildUnit, TemplateProduct } from './useTemplates';
import type { PoTemplateProduct } from './useSuppliers';

export interface TemplateRow {
  supplier_kiotviet_id: number;
  product_id: number;
  sort_order: number;
  created_at: string;
  product_code: string | null;
  product_name: string | null;
  order_template: string | null;
  images: string[] | null;
  child_units: ChildUnit[] | null;
  master_unit: string | null;
}

function rowToTemplate(row: TemplateRow): TemplateProduct {
  return {
    product_id: row.product_id,
    product_code: row.product_code,
    product_name: (row.product_name || '').replace(/\s*\(kg\)\s*$/i, ''),
    last_purchase_date: null,
    order_template: row.order_template || null,
    images: row.images || null,
    child_units: row.child_units || null,
    master_unit: row.master_unit || null,
  };
}

/**
 * Seed template từ nguồn cũ khi NCC chưa có rows.
 * Ưu tiên po_template_products (JSONB trên supplier), fallback kv_supplier_product_templates.
 * Trả về số rows đã insert (0 nếu không seed được).
 */
async function seedFromLegacy(
  supplierId: number,
  legacyProducts: PoTemplateProduct[] | null | undefined
): Promise<number> {
  let productIds: number[] = [];

  if (legacyProducts && legacyProducts.length > 0) {
    const seen = new Set<number>();
    legacyProducts.forEach(p => {
      if (p.product_id && !seen.has(p.product_id)) {
        seen.add(p.product_id);
        productIds.push(p.product_id);
      }
    });
  } else {
    const { data, error } = await supabase
      .from('kv_supplier_product_templates')
      .select('product_id')
      .eq('supplier_id', supplierId)
      .order('last_purchase_date', { ascending: false, nullsFirst: false })
      .limit(50);
    if (error) throw error;
    productIds = (data || [])
      .map((r: { product_id: number }) => r.product_id)
      .filter((id: number) => Boolean(id));
  }

  if (productIds.length === 0) return 0;

  const rows = productIds.map((product_id, index) => ({
    supplier_kiotviet_id: supplierId,
    product_id,
    sort_order: index,
  }));

  const { error: insertError } = await supabase
    .from('glt_supplier_po_templates')
    .upsert(rows, {
      onConflict: 'supplier_kiotviet_id,product_id',
      ignoreDuplicates: true,
    });

  if (insertError) throw insertError;
  return rows.length;
}

/**
 * Fetch template của 1 supplier từ v_supplier_po_templates.
 * Tự seed từ nguồn cũ (1 lần) khi bảng mới chưa có rows.
 *
 * @param supplierId - kiotviet_id của supplier
 * @param legacySeedProducts - po_template_products từ v_suppliers_admin (nguồn seed)
 */
export const useSupplierPoTemplate = (
  supplierId: number | null | undefined,
  legacySeedProducts?: PoTemplateProduct[] | null
) => {
  const queryClient = useQueryClient();
  const seedAttemptedRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: ['supplier-po-template', supplierId],
    queryFn: async (): Promise<TemplateProduct[]> => {
      const { data, error } = await supabase
        .from('v_supplier_po_templates')
        .select('*')
        .eq('supplier_kiotviet_id', supplierId!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []).map(rowToTemplate);
    },
    enabled: Boolean(supplierId),
    staleTime: 30_000,
  });

  const data = query.data ?? [];

  // Auto-seed 1 lần mỗi supplier khi bảng mới trống
  useEffect(() => {
    if (!supplierId || query.isLoading) return;
    if (seedAttemptedRef.current === supplierId) return;
    if (data.length > 0) {
      seedAttemptedRef.current = supplierId;
      return;
    }

    seedAttemptedRef.current = supplierId;
    (async () => {
      try {
        const inserted = await seedFromLegacy(supplierId, legacySeedProducts);
        if (inserted > 0) {
          await queryClient.invalidateQueries({
            queryKey: ['supplier-po-template', supplierId],
          });
          await queryClient.invalidateQueries({
            queryKey: ['supplier-po-template-counts'],
          });
        }
      } catch (err) {
        // RLS chặn non-admin hoặc lỗi mạng — im lặng, để template rỗng
        console.warn('[useSupplierPoTemplate] Seed failed:', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId, query.isLoading, data.length]);

  /** Thêm nhiều SP vào template (admin) */
  const addProducts = useMutation({
    mutationFn: async (productIds: number[]) => {
      const maxSort = (data ?? []).length;
      const rows = productIds.map((product_id, index) => ({
        supplier_kiotviet_id: supplierId!,
        product_id,
        sort_order: maxSort + index,
      }));
      const { error } = await supabase
        .from('glt_supplier_po_templates')
        .upsert(rows, {
          onConflict: 'supplier_kiotviet_id,product_id',
          ignoreDuplicates: true,
        });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-po-template', supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: ['supplier-po-template-counts'],
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Không thêm được sản phẩm vào template', {
        description: msg,
      });
    },
  });

  /** Xóa 1 SP khỏi template (admin) */
  const removeProduct = useMutation({
    mutationFn: async (productId: number) => {
      const { error } = await supabase
        .from('glt_supplier_po_templates')
        .delete()
        .eq('supplier_kiotviet_id', supplierId!)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['supplier-po-template', supplierId],
      });
      queryClient.invalidateQueries({
        queryKey: ['supplier-po-template-counts'],
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error('Không xóa được sản phẩm khỏi template', {
        description: msg,
      });
    },
  });

  const refetch = useCallback(() => query.refetch(), [query]);

  return {
    templates: data,
    loading: query.isLoading,
    error: query.error ? 'Không tải được template sản phẩm.' : null,
    refetch,
    addProducts,
    removeProduct,
  };
};

/**
 * Đếm số SP trong template của tất cả NCC (cho badge trên card supplier).
 * Bảng nhỏ (vài trăm rows tối đa) — fetch 1 cột rồi count client-side.
 */
export const useSupplierPoTemplateCounts = () => {
  return useQuery({
    queryKey: ['supplier-po-template-counts'],
    queryFn: async (): Promise<Record<number, number>> => {
      const { data, error } = await supabase
        .from('glt_supplier_po_templates')
        .select('supplier_kiotviet_id');
      if (error) throw error;
      const counts: Record<number, number> = {};
      (data || []).forEach(
        (r: { supplier_kiotviet_id: number }) =>
          (counts[r.supplier_kiotviet_id] =
            (counts[r.supplier_kiotviet_id] || 0) + 1)
      );
      return counts;
    },
    staleTime: 60_000,
  });
};
