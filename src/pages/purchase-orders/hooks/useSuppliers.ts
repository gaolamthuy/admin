import { useEffect, useRef, useState } from 'react';
import { supabaseClient } from '@/utility';
import { ensureSessionActive } from '@/lib/supabase-session';

export interface SupplierOption {
  kiotviet_id: number;
  name: string | null;
  code: string | null;
  contact_number: string | null;
  address: string | null;
  branch_id: number | null;
  total_invoice: number;
  last_purchase_date: string | null;
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

    const executeQuery = async () =>
      await Promise.resolve(
        supabaseClient
          .from('kv_supplier_stats')
          .select('*')
          .order('total_invoice', { ascending: false })
          .order('last_purchase_date', {
            ascending: false,
            nullsFirst: false,
          })
          .limit(100)
      );

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
            await ensureSessionActive(supabaseClient);
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

            const mapped = data.map((item: SupplierOption) => ({
              kiotviet_id: item.kiotviet_id,
              name: item.name,
              code: item.code,
              contact_number: item.contact_number,
              address: item.address,
              branch_id: item.branch_id,
              total_invoice: item.total_invoice || 0,
              last_purchase_date: item.last_purchase_date,
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
