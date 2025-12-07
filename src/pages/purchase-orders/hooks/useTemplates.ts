import { useEffect, useRef, useState } from 'react';
import { supabaseClient } from '@/utility';

export interface ChildUnit {
  code: string;
  name: string;
  unit: string;
  full_name: string;
  base_price: number;
  kiotviet_id: number;
  conversion_value: number;
  base_price_per_masterunit: number;
}

export interface TemplateProduct {
  product_id: number;
  product_code: string | null;
  product_name: string | null;
  order_count: number;
  avg_quantity: number;
  avg_price: number | null;
  last_purchase_date: string | null;
  child_units: ChildUnit[] | null;
}

export interface SelectedProduct extends TemplateProduct {
  quantity: number;
  price: number | null;
}

/**
 * Hook quản lý việc fetch templates cho supplier đã chọn
 * @param open - Dialog có đang mở không
 * @param supplierId - ID của supplier đã chọn
 * @returns Object chứa templates, loading state, error
 */
export const useTemplates = (
  open: boolean,
  supplierId: number | null | undefined
) => {
  const [templates, setTemplates] = useState<TemplateProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      fetchedRef.current = null;
      return;
    }

    if (!supplierId) {
      setTemplates([]);
      setError(null);
      return;
    }

    // Always fetch templates for selected supplier (force fresh data)
    const currentSupplierId = supplierId;
    console.log(
      '[useTemplates] Starting templates fetch for supplier:',
      currentSupplierId
    );

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Local flag trong closure để track completion của request này
    let requestCompleted = false;

    setLoading(true);
    setError(null);

    const fetchStartTime = Date.now();

    // Add timeout to prevent hanging requests
    const timeoutId = setTimeout(() => {
      if (!abortController.signal.aborted) {
        console.warn('[useTemplates] Query timeout after 10s, aborting...');
        abortController.abort();
        if (isMountedRef.current) {
          setError('Yêu cầu tải dữ liệu quá lâu. Vui lòng thử lại.');
          setLoading(false);
        }
      }
    }, 10000); // 10 second timeout

    // Note: ensureActiveSession removed - Supabase client auto-handles session refresh

    // Sử dụng async/await để xử lý error tốt hơn
    (async () => {
      try {
        // Bỏ qua ensureActiveSession vì Supabase client tự động handle session refresh
        // Nếu query fail vì auth, Supabase sẽ trả về error và ta handle error đó
        console.log(
          '[useTemplates] Starting query (Supabase will auto-handle session)...'
        );

        const { data, error: queryError } = await supabaseClient
          .from('kv_supplier_product_templates')
          .select('*')
          .eq('supplier_id', currentSupplierId)
          .order('order_count', { ascending: false })
          .order('last_purchase_date', { ascending: false });

        clearTimeout(timeoutId); // Clear timeout on success
        const fetchDuration = Date.now() - fetchStartTime;
        console.log(`[useTemplates] Query completed in ${fetchDuration}ms`);

        // Check if request was aborted
        if (abortController.signal.aborted) {
          console.log('[useTemplates] Request was aborted, ignoring response');
          return;
        }

        // Check if component is still mounted
        if (!isMountedRef.current) {
          console.log(
            '[useTemplates] Component unmounted, skipping state update'
          );
          return;
        }

        if (queryError) {
          console.error('[useTemplates] Query error:', queryError);
          setError('Không thể tải template sản phẩm. Vui lòng thử lại.');
          setLoading(false);
          requestCompleted = true; // Đánh dấu request đã complete (với error) trong closure
          return;
        }

        console.log(
          '[useTemplates] Raw data received:',
          data?.length || 0,
          'items'
        );
        // Transform view data to TemplateProduct format
        // Remove duplicates by product_id (keep first occurrence)
        const seenProductIds = new Set<number>();
        const processed: TemplateProduct[] = (data || [])
          .filter(item => {
            if (!item.product_id) return false;
            if (seenProductIds.has(item.product_id)) {
              console.warn(
                `[useTemplates] Duplicate product_id ${item.product_id} found in templates, skipping`
              );
              return false;
            }
            seenProductIds.add(item.product_id);
            return true;
          })
          .map(item => ({
            product_id: item.product_id,
            product_code: item.product_code,
            product_name: item.product_name,
            order_count: item.order_count,
            avg_quantity: item.avg_quantity || 1,
            avg_price: item.avg_price || null,
            last_purchase_date: item.last_purchase_date,
            child_units: (item.child_units as ChildUnit[]) || null,
          }));

        console.log('[useTemplates] Processed templates:', processed.length);
        setTemplates(processed);
        setError(null);
        fetchedRef.current = currentSupplierId; // Mark as fetched for this supplier
        requestCompleted = true; // Đánh dấu request đã complete trong closure
        setLoading(false);
        console.log('[useTemplates] State updated successfully');
      } catch (error: unknown) {
        clearTimeout(timeoutId); // Clear timeout on error
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('[useTemplates] Request was aborted');
          return;
        }
        if (!abortController.signal.aborted && isMountedRef.current) {
          console.error('[useTemplates] Query error:', error);
          setError('Không thể tải template sản phẩm. Vui lòng thử lại.');
          setLoading(false);
          requestCompleted = true; // Đánh dấu request đã complete (với error) trong closure
        }
      }
    })();

    return () => {
      clearTimeout(timeoutId); // Clear timeout on cleanup
      // Chỉ abort nếu request chưa complete và controller vẫn là controller hiện tại
      // Sử dụng closure variable requestCompleted thay vì ref để tránh race condition
      if (
        !requestCompleted &&
        abortControllerRef.current === abortController &&
        !abortController.signal.aborted
      ) {
        console.log('[useTemplates] Cleanup: aborting pending request');
        abortController.abort();
      } else {
        console.log(
          `[useTemplates] Cleanup: requestCompleted=${requestCompleted}, controllerMatch=${abortControllerRef.current === abortController}, alreadyAborted=${abortController.signal.aborted}`
        );
      }
      // Chỉ clear ref nếu vẫn là controller hiện tại
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    };
  }, [open, supplierId]);

  return {
    templates,
    loading,
    error,
  };
};
