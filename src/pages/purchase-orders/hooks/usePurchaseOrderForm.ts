import { useMemo, useState, useCallback } from 'react';
import { SupplierOption } from './useSuppliers';
import { TemplateProduct, SelectedProduct } from './useTemplates';

export interface PurchaseOrderFormData {
  supplier: SupplierOption | null;
  selectedProducts: Record<number, SelectedProduct>;
  isSelectAll: boolean;
}

/**
 * Hook quản lý form state và validation cho purchase order
 * Đã migrate từ Refine sang useState (không còn Refine dependency)
 */
export const usePurchaseOrderForm = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSupplier, setSelectedSupplier] =
    useState<SupplierOption | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<
    Record<number, SelectedProduct>
  >({});

  // State cho form loading và errors (thay thế Refine form)
  // Note: setFormLoading và setErrors không được dùng nhưng giữ lại để tương thích với interface
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [formLoading, _setFormLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [errors, _setErrors] = useState<Record<string, string>>({});

  /**
   * Validate form trước khi submit
   */
  const validate = (): boolean => {
    if (!selectedSupplier) {
      return false;
    }
    if (Object.keys(selectedProducts).length === 0) {
      return false;
    }
    return true;
  };

  /**
   * Reset form về trạng thái ban đầu
   * Sử dụng useCallback để tránh re-create function mỗi lần render
   */
  const reset = useCallback(() => {
    setStep(1);
    setSelectedSupplier(null);
    setSelectedProducts({});
    // isSelectAll sẽ tự động tính toán lại từ selectedProducts
  }, []);

  /**
   * Toggle product selection
   */
  const toggleProduct = (
    product: TemplateProduct,
    checked: boolean,
    _templates?: TemplateProduct[] // eslint-disable-line @typescript-eslint/no-unused-vars
  ) => {
    if (!product.product_id) return;

    setSelectedProducts(prev => {
      const next = { ...prev };
      if (!checked) {
        delete next[product.product_id];
        // isSelectAll sẽ được tính toán từ bên ngoài
        return next;
      }

      next[product.product_id] = {
        ...product,
        quantity: Math.max(1, Math.round(product.avg_quantity) || 1),
        price: product.avg_price,
      };

      // isSelectAll sẽ được tính toán từ bên ngoài dựa trên templates và selectedProducts

      return next;
    });
  };

  /**
   * Select/deselect all products
   */
  const selectAll = (templates: TemplateProduct[], checked: boolean) => {
    if (!templates.length) return;

    if (checked) {
      const allSelected: Record<number, SelectedProduct> = {};
      templates.forEach(template => {
        if (template.product_id) {
          allSelected[template.product_id] = {
            ...template,
            quantity: Math.max(1, Math.round(template.avg_quantity) || 1),
            price: template.avg_price,
          };
        }
      });
      setSelectedProducts(allSelected);
    } else {
      setSelectedProducts({});
    }
  };

  /**
   * Update quantity cho product
   */
  const updateQuantity = (productId: number, value: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        quantity: value,
      },
    }));
  };

  /**
   * Update price cho product
   */
  const updatePrice = (productId: number, value: number | null) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        price: value,
      },
    }));
  };

  /**
   * Auto-select all products từ templates (dùng khi templates load xong)
   * Sử dụng useCallback để tránh re-create function mỗi lần render
   */
  const autoSelectAll = useCallback((templates: TemplateProduct[]) => {
    if (templates.length > 0) {
      const autoSelected: Record<number, SelectedProduct> = {};
      templates.forEach(template => {
        if (template.product_id) {
          autoSelected[template.product_id] = {
            ...template,
            quantity: Math.max(1, Math.round(template.avg_quantity) || 1),
            price: template.avg_price,
          };
        }
      });
      setSelectedProducts(autoSelected);
    } else {
      setSelectedProducts({});
    }
  }, []);

  const selectedProductList = useMemo(
    () => Object.values(selectedProducts),
    [selectedProducts]
  );

  return {
    // State
    step,
    selectedSupplier,
    selectedProducts,
    selectedProductList,
    formLoading,
    errors,

    // Actions
    setStep,
    setSelectedSupplier,
    setSelectedProducts,
    reset,
    validate,
    toggleProduct,
    selectAll,
    updateQuantity,
    updatePrice,
    autoSelectAll,
  };
};
