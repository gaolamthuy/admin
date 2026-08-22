import { useSupplierPoTemplate } from './useSupplierPoTemplate';
import { PoTemplateProduct } from './useSuppliers';

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
  order_template: string | null; // order_template từ kv_products (master unit)
  images: string[] | null;
  child_units: ChildUnit[] | null;
  master_unit: string | null; // unit của master unit (ví dụ: "kg")
}

export interface SelectedProduct extends TemplateProduct {
  quantity: number;
  price: number | null;
}

/**
 * Hook quản lý việc fetch templates cho supplier đã chọn
 * ⭐ Nguồn duy nhất: glt_supplier_po_templates (qua useSupplierPoTemplate)
 * — Auto-seed từ po_template_products / kv_supplier_product_templates khi NCC chưa có rows
 *
 * @param open - Trang có đang active không
 * @param supplierId - ID của supplier đã chọn
 * @param supplierData - Supplier data từ useSuppliers (chứa po_template_products làm seed)
 * @returns Object chứa templates, loading state, error
 */
export const useTemplates = (
  open: boolean,
  supplierId: number | null | undefined,
  supplierData?: {
    po_template_products?: PoTemplateProduct[] | null;
  } | null
) => {
  const { templates, loading, error } = useSupplierPoTemplate(
    open ? supplierId : null,
    supplierData?.po_template_products
  );

  return {
    templates,
    loading: loading && open,
    error,
  };
};
