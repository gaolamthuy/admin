/**
 * Purchase Order Create Page
 * Sử dụng step-based flow với usePurchaseOrderForm
 * Step 1: Chọn supplier
 * Step 2: Chọn products từ templates
 *
 * @module pages/purchase-orders/PurchaseOrderCreate
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrderForm } from './hooks/usePurchaseOrderForm';
import { useSuppliers } from './hooks/useSuppliers';
import { useTemplates } from './hooks/useTemplates';
import { useCreatePurchaseOrder } from './hooks/useCreatePurchaseOrder';
import { SupplierSelector } from './components/SupplierSelector';
import { ProductSelector } from './components/ProductSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDaysAgo } from '@/utils/date';

/**
 * Purchase Order Create Page Component với step-based flow
 */
export const PurchaseOrderCreate = () => {
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOpen] = useState(true);

  // Form state management
  const form = usePurchaseOrderForm();

  // Hooks cho data fetching
  const {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useSuppliers(isOpen);

  // Tìm supplier data từ suppliers list để lấy po_template_products
  const selectedSupplierData = suppliers.find(
    s => s.kiotviet_id === form.selectedSupplier?.kiotviet_id
  );

  const {
    templates,
    loading: templatesLoading,
    error: templatesError,
  } = useTemplates(
    isOpen && form.step === 2,
    form.selectedSupplier?.kiotviet_id,
    selectedSupplierData || null
  );

  // Hook cho create purchase order (webhook với n8n)
  const {
    createPurchaseOrder,
    isSubmitting,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    errorMessage,
  } = useCreatePurchaseOrder();

  // Auto-select all products khi templates load xong
  useEffect(() => {
    if (
      form.step === 2 &&
      templates.length > 0 &&
      Object.keys(form.selectedProducts).length === 0
    ) {
      form.autoSelectAll(templates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.step, templates.length]);

  // Không cần tính isSelectAll nữa vì đã thay bằng removeAll

  /**
   * Xử lý chọn supplier và chuyển sang step 2
   */
  const handleSupplierSelect = (supplier: typeof form.selectedSupplier) => {
    form.setSelectedSupplier(supplier);
    form.setStep(2);
  };

  /**
   * Xử lý quay lại step 1
   */
  const handleBackToStep1 = () => {
    form.setStep(1);
  };

  /**
   * Xử lý submit purchase order
   */
  const handleSubmit = async () => {
    // Validate form
    if (!form.validate()) {
      if (!form.selectedSupplier) {
        // Có thể show toast error ở đây nếu cần
        return;
      }
      if (Object.keys(form.selectedProducts).length === 0) {
        // Có thể show toast error ở đây nếu cần
        return;
      }
      return;
    }

    if (!form.selectedSupplier) {
      return;
    }

    try {
      // Build payload cho webhook n8n
      const payload = {
        branchId: form.selectedSupplier.branch_id || 0, // Fallback to 0 nếu không có
        supplier: {
          id: form.selectedSupplier.kiotviet_id,
          code: form.selectedSupplier.code,
          name: form.selectedSupplier.name,
          contactNumber: form.selectedSupplier.contact_number,
          address: form.selectedSupplier.address,
        },
        purchaseOrderDetails: form.selectedProductList.map(product => {
          // ⭐ Convert quantity từ số bao (child unit) sang kg (master unit)
          // Nếu có child_units[0]: quantity (số bao) * conversion_value = kg
          // Nếu không có child_units: quantity giữ nguyên
          const quantityInKg =
            product.child_units && product.child_units.length > 0
              ? product.quantity * product.child_units[0].conversion_value
              : product.quantity;

          return {
            productId: product.product_id,
            productCode: product.product_code,
            productName: product.product_name,
            quantity: quantityInKg, // Gửi kg (master unit)
            price: product.price,
            discount: null,
          };
        }),
        description: '',
        isDraft: false,
      };

      await createPurchaseOrder(payload);
      // Navigate về list sau khi tạo thành công
      navigate('/purchase-orders');
    } catch (error) {
      // Error đã được handle trong useCreatePurchaseOrder hook
      console.error('Error creating purchase order:', error);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tạo đơn nhập hàng mới</CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <div
              className={cn(
                'flex items-center gap-2',
                form.step >= 1 && 'text-primary'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  form.step >= 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                1
              </div>
              <span>Chọn nhà cung cấp</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <div
              className={cn(
                'flex items-center gap-2',
                form.step >= 2 && 'text-primary'
              )}
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                  form.step >= 2
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                2
              </div>
              <span>Chọn sản phẩm</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Chọn supplier */}
          {form.step === 1 && (
            <div className="space-y-6">
              <SupplierSelector
                suppliers={suppliers}
                loading={suppliersLoading}
                error={suppliersError}
                selectedSupplier={form.selectedSupplier}
                onSelect={handleSupplierSelect}
              />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate('/purchase-orders')}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Chọn products từ templates */}
          {form.step === 2 && (
            <div className="space-y-6">
              {form.selectedSupplier && (
                <div className="p-4 bg-muted rounded-md space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Nhà cung cấp đã chọn:
                    </p>
                    <p className="font-medium">
                      {form.selectedSupplier.name ||
                        form.selectedSupplier.code ||
                        'Không tên'}
                    </p>
                  </div>
                  {/* ⭐ Mới: Hiển thị last_purchase_date từ templates */}
                  {(() => {
                    // Tìm last_purchase_date mới nhất từ tất cả templates
                    if (templates.length === 0) return null;
                    const lastPurchaseDates = templates
                      .map(t => t.last_purchase_date)
                      .filter((date): date is string => Boolean(date))
                      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                    const latestDate = lastPurchaseDates[0];
                    return latestDate ? (
                      <p className="text-sm text-muted-foreground">
                        Lần cuối: {formatDate(latestDate)} ({formatDaysAgo(latestDate)})
                      </p>
                    ) : null;
                  })()}
                  {/* ⭐ Mới: Hiển thị last_master_unit_quantity để gợi ý */}
                  {form.selectedSupplier.last_master_unit_quantity && (
                    <p className="text-sm text-muted-foreground">
                      Gợi ý số lượng: {form.selectedSupplier.last_master_unit_quantity} kg
                    </p>
                  )}
                  {/* ⭐ Mới: Hiển thị tổng số lượng theo child units và master unit */}
                  {(() => {
                    const selectedProducts = form.selectedProductList;
                    if (selectedProducts.length === 0) return null;

                    // Tính tổng theo từng child unit (ví dụ: 5 bao 50kg, 3 bao 60kg)
                    const childUnitTotals = new Map<string, number>();
                    let totalMasterUnit = 0;

                    selectedProducts.forEach(product => {
                      if (
                        product.child_units &&
                        product.child_units.length > 0
                      ) {
                        const childUnit = product.child_units[0];
                        const unit = childUnit.unit;
                        const quantity = product.quantity || 0;
                        const currentTotal = childUnitTotals.get(unit) || 0;
                        childUnitTotals.set(unit, currentTotal + quantity);

                        // Tính tổng master unit (kg)
                        totalMasterUnit +=
                          quantity * childUnit.conversion_value;
                      }
                    });

                    // Lấy master unit từ product đầu tiên (nếu có)
                    const firstProduct = selectedProducts[0];
                    const masterUnit =
                      firstProduct.master_unit || 'kg';

                    // Format child units: "8 bao 50kg + 1 bao 60kg"
                    const childUnitsText = Array.from(
                      childUnitTotals.entries()
                    )
                      .map(([unit, total]) => `${total} ${unit}`)
                      .join(' + ');

                    return (
                      <div className="pt-2 border-t">
                        <p className="text-sm font-medium">
                          Tổng số lượng:{' '}
                          {totalMasterUnit > 0 ? (
                            <span className="font-normal text-muted-foreground">
                              {totalMasterUnit} {masterUnit} = {childUnitsText}
                            </span>
                          ) : (
                            <span className="font-normal text-muted-foreground">
                              {childUnitsText}
                            </span>
                          )}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <ProductSelector
                templates={templates}
                loading={templatesLoading}
                error={templatesError}
                selectedProducts={form.selectedProducts}
                selectedSupplierId={form.selectedSupplier?.kiotviet_id}
                onRemoveProduct={form.removeProduct}
                onAddProduct={form.addProduct}
                onRemoveAll={form.removeAll}
                onQuantityChange={form.updateQuantity}
              />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBackToStep1}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/purchase-orders')}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      Object.keys(form.selectedProducts).length === 0
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        Tạo đơn nhập hàng
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderCreate;
