import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

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
  last_purchase_date: string | null;
  order_template: string | null; // ⭐ Mới: order_template từ kv_products (master unit)
  images: string[] | null; // Images từ kv_products
  child_units: ChildUnit[] | null;
  master_unit: string | null; // ⭐ Mới: unit của master unit (ví dụ: "kg")
}

export interface SelectedProduct extends TemplateProduct {
  quantity: number;
  price: number | null;
}

/**
 * Raw data từ database view
 */
interface TemplateProductRaw {
  product_id: number;
  product_code: string | null;
  product_name: string | null;
  last_purchase_date: string | null;
  order_template?: string | null; // ⭐ Mới: order_template (chỉ có khi dùng po_template_products)
  images?: string[] | null; // Images (chỉ có khi dùng po_template_products)
  child_units: ChildUnit[] | null;
}

/**
 * Hook quản lý việc fetch templates cho supplier đã chọn
 * ⭐ Ưu tiên: Parse po_template_products từ supplierData (nếu có từ v_suppliers_admin)
 * ⚠️ Fallback: Query từ kv_supplier_product_templates nếu không có po_template_products
 * @param open - Dialog có đang mở không
 * @param supplierId - ID của supplier đã chọn
 * @param supplierData - Supplier data từ useSuppliers (có po_template_products từ v_suppliers_admin)
 * @returns Object chứa templates, loading state, error
 */
export const useTemplates = (
  open: boolean,
  supplierId: number | null | undefined,
      supplierData?: {
        po_template_products?: Array<{
          product_id: number;
          product_code: string | null;
          product_name: string | null;
          last_purchase_date: string | null;
          order_template?: string | null; // ⭐ Mới: order_template từ kv_products
          images?: string[] | null; // Images từ kv_products
          child_units: ChildUnit[] | null;
        }> | null;
      } | null
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
      setLoading(false);
      return;
    }

    // ⭐ Ưu tiên: Parse po_template_products từ supplierData (nếu có từ v_suppliers_admin)
    // Fallback: Query từ kv_supplier_product_templates nếu không có
    const currentSupplierId = supplierId;
    const templateProductsFromSupplier = supplierData?.po_template_products;

    // Nếu có po_template_products từ supplier data, dùng luôn (không cần query)
    if (templateProductsFromSupplier && templateProductsFromSupplier.length > 0) {
      console.log(
        '[useTemplates] Using po_template_products from supplier data:',
        templateProductsFromSupplier.length,
        'items'
      );

      setLoading(true);
      setError(null);

      (async () => {
        try {
          const seenProductIds = new Set<number>();
          const processed: TemplateProduct[] = templateProductsFromSupplier
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
              last_purchase_date: item.last_purchase_date,
              order_template: item.order_template || null, // ⭐ Mới: Parse order_template
              images: item.images || null, // Parse images
              child_units: item.child_units || null,
              master_unit: null, // Sẽ query sau
            }));

          // Query master_unit từ kv_products
          const productIds = processed.map(p => p.product_id);
          if (productIds.length > 0) {
            const { data: productsData, error: productsError } = await supabase
              .from('kv_products')
              .select('kiotviet_id, unit')
              .in('kiotviet_id', productIds);

            if (productsError) {
              console.warn('[useTemplates] Error fetching master units:', productsError);
            } else {
              // Tạo map để lookup unit nhanh
              const unitMap = new Map<number, string>();
              (productsData || []).forEach(p => {
                if (p.kiotviet_id && p.unit) {
                  unitMap.set(p.kiotviet_id, p.unit);
                }
              });

              // Update master_unit cho từng template
              processed.forEach(template => {
                template.master_unit = unitMap.get(template.product_id) || null;
              });
            }
          }

          console.log('[useTemplates] Processed templates:', processed.length);
          setTemplates(processed);
          setError(null);
          fetchedRef.current = currentSupplierId;
          setLoading(false);
        } catch (error: unknown) {
          console.error('[useTemplates] Parse error:', error);
          setError('Không thể parse template sản phẩm. Vui lòng thử lại.');
          setLoading(false);
        }
      })();
      return;
    }

    // Fallback: Query từ kv_supplier_product_templates
    console.log(
      '[useTemplates] No po_template_products in supplier data, querying from kv_supplier_product_templates for supplier:',
      currentSupplierId
    );

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let requestCompleted = false;

    setLoading(true);
    setError(null);

    const fetchStartTime = Date.now();

    const timeoutId = setTimeout(() => {
      if (!abortController.signal.aborted) {
        console.warn('[useTemplates] Query timeout after 10s, aborting...');
        abortController.abort();
        if (isMountedRef.current) {
          setError('Yêu cầu tải dữ liệu quá lâu. Vui lòng thử lại.');
          setLoading(false);
        }
      }
    }, 10000);

    (async () => {
      try {
        console.log('[useTemplates] Starting query from kv_supplier_product_templates...');

        const { data, error: queryError } = await supabase
          .from('kv_supplier_product_templates')
          .select('product_id, product_code, product_name, last_purchase_date, child_units')
          .eq('supplier_id', currentSupplierId)
          .order('last_purchase_date', { ascending: false });
        
        // ⚠️ Note: kv_supplier_product_templates không có images field
        // Nếu dùng fallback này, images sẽ là null

        clearTimeout(timeoutId);
        const fetchDuration = Date.now() - fetchStartTime;
        console.log(`[useTemplates] Query completed in ${fetchDuration}ms`);

        if (abortController.signal.aborted) {
          console.log('[useTemplates] Request was aborted, ignoring response');
          return;
        }

        if (!isMountedRef.current) {
          console.log('[useTemplates] Component unmounted, skipping state update');
          return;
        }

        if (queryError) {
          console.error('[useTemplates] Query error:', queryError);
          setError('Không thể tải template sản phẩm. Vui lòng thử lại.');
          setLoading(false);
          requestCompleted = true;
          return;
        }

        console.log('[useTemplates] Raw data received:', data?.length || 0, 'items');

        const seenProductIds = new Set<number>();
        const processed: TemplateProduct[] = (data || [])
          .filter((item: TemplateProductRaw) => {
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
          .map((item: TemplateProductRaw) => ({
            product_id: item.product_id,
            product_code: item.product_code,
            product_name: item.product_name,
            last_purchase_date: item.last_purchase_date,
            order_template: null, // ⚠️ kv_supplier_product_templates không có order_template
            images: null, // ⚠️ kv_supplier_product_templates không có images
            child_units: (item.child_units as ChildUnit[]) || null,
            master_unit: null, // Sẽ query sau
          }));

        // Query master_unit từ kv_products
        const productIds = processed.map(p => p.product_id);
        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('kv_products')
            .select('kiotviet_id, unit')
            .in('kiotviet_id', productIds);

          if (productsError) {
            console.warn('[useTemplates] Error fetching master units:', productsError);
          } else {
            // Tạo map để lookup unit nhanh
            const unitMap = new Map<number, string>();
            (productsData || []).forEach(p => {
              if (p.kiotviet_id && p.unit) {
                unitMap.set(p.kiotviet_id, p.unit);
              }
            });

            // Update master_unit cho từng template
            processed.forEach(template => {
              template.master_unit = unitMap.get(template.product_id) || null;
            });
          }
        }

        console.log('[useTemplates] Processed templates:', processed.length);
        setTemplates(processed);
        setError(null);
        fetchedRef.current = currentSupplierId;
        requestCompleted = true;
        setLoading(false);
      } catch (error: unknown) {
        clearTimeout(timeoutId);
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('[useTemplates] Request was aborted');
          return;
        }
        if (!abortController.signal.aborted && isMountedRef.current) {
          console.error('[useTemplates] Query error:', error);
          setError('Không thể tải template sản phẩm. Vui lòng thử lại.');
          setLoading(false);
          requestCompleted = true;
        }
      }
    })();

    return () => {
      clearTimeout(timeoutId);
      if (
        !requestCompleted &&
        abortControllerRef.current === abortController &&
        !abortController.signal.aborted
      ) {
        console.log('[useTemplates] Cleanup: aborting pending request');
        abortController.abort();
      }
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    };
  }, [open, supplierId, supplierData]);

  return {
    templates,
    loading,
    error,
  };
};
