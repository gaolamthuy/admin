import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ensureSessionActive } from '@/lib/supabase-session';
import { ChildUnit } from './useTemplates';

export interface SupplierOption {
  kiotviet_id: number;
  name: string | null;
  code: string | null;
  contact_number: string | null;
  address: string | null;
  branch_id: number | null;
  total_invoice: number;
  last_purchase_date: string | null;
  last_master_unit_quantity: number | null; // ⭐ Mới: Tổng kg từ PO gần nhất
  po_template_products?: PoTemplateProduct[] | null; // Field mới từ v_suppliers_admin
}

/**
 * Purchase Order Template Product interface
 * Được lấy từ po_template_products JSONB trong v_suppliers_admin
 */
export interface PoTemplateProduct {
  product_id: number;
  product_code: string | null;
  product_name: string | null;
  last_purchase_date: string | null;
  order_template: string | null; // ⭐ Mới: order_template từ kv_products (master unit)
  images: string[] | null; // Images từ kv_products
  child_units: ChildUnit[] | null;
}

/**
 * Hook quản lý việc fetch danh sách suppliers
 * @param open - Dialog có đang mở không
 * @returns Object chứa suppliers, loading state, error
 */
export const useSuppliers = (open: boolean) => {
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setSuppliers([]);
      setError(null);
      setLoading(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    // Tạo abort controller mới cho request này
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let isCancelled = false;

    const delay = (ms: number) =>
      new Promise(resolve => setTimeout(resolve, ms));

    // ⭐ Ưu tiên query từ v_suppliers_admin, fallback về kv_supplier_stats nếu view chưa tồn tại
    const executeQuery = async () => {
      // Thử query từ v_suppliers_admin trước
      const { data, error } = await supabase
        .from('v_suppliers_admin')
        .select('*')
        .order('total_invoice', { ascending: false })
        .order('last_purchase_date', {
          ascending: false,
          nullsFirst: false,
        })
        .limit(100);

      // Nếu view chưa tồn tại (PGRST205), fallback về kv_supplier_stats
      if (error && error.code === 'PGRST205') {
        console.log('[useSuppliers] v_suppliers_admin not found, falling back to kv_supplier_stats');
        return await supabase
          .from('kv_supplier_stats')
          .select('*')
          .order('total_invoice', { ascending: false })
          .order('last_purchase_date', {
            ascending: false,
            nullsFirst: false,
          })
          .limit(100);
      }

      return { data, error };
    };

    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        setError(null);

        const MAX_ATTEMPTS = 3;
        let lastError: unknown = null;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
          if (isCancelled || abortController.signal.aborted) {
            return;
          }

          try {
            await ensureSessionActive(supabase);
            const queryStartTime = Date.now();
            const { data, error: queryError } = await executeQuery();
            const queryDuration = Date.now() - queryStartTime;
            console.log(
              `[useSuppliers] Query completed in ${queryDuration}ms (attempt ${attempt})`
            );

            if (queryError) {
              throw queryError;
            }

            if (!data) {
              throw new Error('No data returned from query');
            }

            // Map data, bao gồm po_template_products nếu có (từ v_suppliers_admin)
            const mapped = data.map((item: SupplierOption & { po_template_products?: any; last_master_unit_quantity?: number | string | null }) => ({
              kiotviet_id: item.kiotviet_id,
              name: item.name,
              code: item.code,
              contact_number: item.contact_number,
              address: item.address,
              branch_id: item.branch_id,
              total_invoice: item.total_invoice || 0,
              last_purchase_date: item.last_purchase_date,
              last_master_unit_quantity: item.last_master_unit_quantity
                ? Number(item.last_master_unit_quantity)
                : null, // ⭐ Mới: Map last_master_unit_quantity từ view
              // ⭐ Lấy po_template_products nếu có (từ v_suppliers_admin)
              po_template_products: item.po_template_products || null,
            }));

            if (!isCancelled && !abortController.signal.aborted) {
              setSuppliers(mapped);
              setLoading(false);
              setError(null);
            }
            return;
          } catch (queryError) {
            lastError = queryError;
            console.warn(
              `[useSuppliers] Attempt ${attempt} failed:`,
              queryError
            );
            if (attempt < MAX_ATTEMPTS) {
              await delay(500 * attempt);
            }
          }
        }

        throw lastError ?? new Error('Unknown suppliers fetch error');
      } catch (err: unknown) {
        console.error('[useSuppliers] Fetch error:', err);

        if (isCancelled || abortController.signal.aborted) {
          return;
        }

        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách nhà cung cấp. Vui lòng thử lại.';

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchSuppliers();

    return () => {
      isCancelled = true;
      if (abortControllerRef.current === abortController) {
        abortController.abort();
        abortControllerRef.current = null;
      }
    };
  }, [open]);

  return {
    suppliers,
    loading,
    error,
  };
};
