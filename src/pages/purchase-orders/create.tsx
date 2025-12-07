import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router';

import { CreateView } from '@/components/refine-ui/views/create-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import { SupplierSelector } from './components/SupplierSelector';
import { ProductSelector } from './components/ProductSelector';
import { useCreatePurchaseOrder } from './hooks/useCreatePurchaseOrder';
import {
  usePurchaseOrderForm,
  useSuppliers,
  useTemplates,
  type ChildUnit,
} from './hooks';

const DEFAULT_BRANCH_ID = 15132;

/**
 * Trang tạo đơn mua hàng dạng full page (thay thế dialog)
 */
export const PurchaseOrderCreate = () => {
  const navigate = useNavigate();

  const {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
  } = useSuppliers(true);

  const {
    step,
    selectedSupplier,
    selectedProducts,
    selectedProductList,
    setStep,
    setSelectedSupplier,
    setSelectedProducts,
    reset,
    validate,
    toggleProduct,
    selectAll,
    updateQuantity,
    autoSelectAll,
  } = usePurchaseOrderForm();

  const { createPurchaseOrder, isSubmitting, errorMessage, resetError } =
    useCreatePurchaseOrder();

  const {
    templates: supplierTemplates,
    loading: supplierTemplatesLoading,
    error: supplierTemplatesError,
  } = useTemplates(true, selectedSupplier?.kiotviet_id);

  const isSelectAll = useMemo(() => {
    if (supplierTemplates.length === 0) return false;
    return supplierTemplates.every(
      t => t.product_id && selectedProducts[t.product_id]
    );
  }, [supplierTemplates, selectedProducts]);

  const autoSelectedSupplierRef = useRef<number | null>(null);
  const templatesLength = supplierTemplates.length;
  const selectedProductsCount = Object.keys(selectedProducts).length;
  const supplierId = selectedSupplier?.kiotviet_id;

  useEffect(() => {
    if (
      templatesLength > 0 &&
      selectedSupplier &&
      supplierId &&
      selectedProductsCount === 0 &&
      !supplierTemplatesLoading &&
      autoSelectedSupplierRef.current !== supplierId
    ) {
      autoSelectAll(supplierTemplates);
      autoSelectedSupplierRef.current = supplierId;
    }
    if (!selectedSupplier) {
      autoSelectedSupplierRef.current = null;
    }
  }, [
    templatesLength,
    supplierId,
    selectedProductsCount,
    supplierTemplatesLoading,
    selectedSupplier,
    autoSelectAll,
    supplierTemplates,
  ]);

  useEffect(() => {
    return () => {
      reset();
      resetError();
      autoSelectedSupplierRef.current = null;
    };
  }, [reset, resetError]);

  const handleSupplierSelect = (supplier: (typeof suppliers)[0]) => {
    setSelectedProducts({});
    setSelectedSupplier(supplier);
    setStep(2);
  };

  const totals = useMemo(() => {
    let totalQuantity = 0;
    const childUnitTotals: Record<string, number> = {};

    selectedProductList.forEach(product => {
      totalQuantity += product.quantity || 0;
      if (product.child_units && product.child_units.length > 0) {
        product.child_units.forEach((childUnit: ChildUnit) => {
          const convertedQuantity =
            (product.quantity || 0) / childUnit.conversion_value;
          const unitKey = childUnit.unit;
          if (!childUnitTotals[unitKey]) {
            childUnitTotals[unitKey] = 0;
          }
          childUnitTotals[unitKey] += convertedQuantity;
        });
      }
    });

    return {
      totalQuantity,
      childUnitTotals,
    };
  }, [selectedProductList]);

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!selectedSupplier) return;
    if (selectedProductList.length === 0) return;

    try {
      await createPurchaseOrder({
        branchId: selectedSupplier.branch_id || DEFAULT_BRANCH_ID,
        supplier: {
          id: selectedSupplier.kiotviet_id,
          code: selectedSupplier.code,
          name: selectedSupplier.name,
          contactNumber: selectedSupplier.contact_number,
          address: selectedSupplier.address,
        },
        purchaseOrderDetails: selectedProductList.map(item => ({
          productId: item.product_id,
          productCode: item.product_code,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price,
        })),
        isDraft: true,
      });

      navigate('/purchase-orders');
    } catch (error) {
      console.error('[PurchaseOrderCreate] Submit error:', error);
    }
  };

  const disableSubmit =
    !selectedSupplier || selectedProductList.length === 0 || isSubmitting;

  return (
    <CreateView>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Tạo đơn mua hàng mới</CardTitle>
            <p className="text-sm text-muted-foreground">
              Quy trình gồm 2 bước: chọn nhà cung cấp và chọn sản phẩm mẫu.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <StepIndicator currentStep={step} />

            {step === 1 && (
              <SupplierSelector
                suppliers={suppliers}
                loading={suppliersLoading}
                error={suppliersError}
                selectedSupplier={selectedSupplier}
                onSelect={handleSupplierSelect}
              />
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Nhà cung cấp
                    </p>
                    <p className="font-semibold">
                      {selectedSupplier?.name || selectedSupplier?.code}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Chọn lại nhà cung cấp
                  </Button>
                </div>

                <ProductSelector
                  templates={supplierTemplates}
                  loading={supplierTemplatesLoading}
                  error={supplierTemplatesError}
                  selectedProducts={selectedProducts}
                  isSelectAll={isSelectAll}
                  selectedSupplierId={selectedSupplier?.kiotviet_id}
                  onToggleProduct={(product, checked) =>
                    toggleProduct(product, checked, supplierTemplates)
                  }
                  onSelectAll={checked => selectAll(supplierTemplates, checked)}
                  onQuantityChange={updateQuantity}
                />
              </div>
            )}

            {errorMessage && (
              <Alert variant="destructive">
                <AlertTitle>Lỗi</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center border rounded-md p-4 bg-muted/50">
              <div className="flex flex-col gap-1">
                <div className="text-sm text-muted-foreground">
                  {selectedProductList.length} sản phẩm đã chọn
                </div>
                {selectedProductList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      Tổng số lượng:{' '}
                      {totals.totalQuantity.toLocaleString('vi-VN')} kg
                    </span>
                    {Object.keys(totals.childUnitTotals).length > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-medium">
                          Tổng quy đổi:{' '}
                          {Object.entries(totals.childUnitTotals)
                            .map(([unit, total]) => {
                              const displayTotal = Number.isInteger(total)
                                ? total.toString()
                                : total.toFixed(2);
                              return `${displayTotal} ${unit}`;
                            })
                            .join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Hủy
                </Button>
                <Button onClick={handleSubmit} disabled={disableSubmit}>
                  {isSubmitting ? 'Đang tạo...' : 'Tạo đơn nháp'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </CreateView>
  );
};

const StepIndicator = ({ currentStep }: { currentStep: 1 | 2 }) => (
  <div className="flex items-center gap-4 rounded-md border bg-muted/50 p-3">
    <StepPill
      label="Bước 1"
      description="Chọn nhà cung cấp"
      active={currentStep === 1}
    />
    <StepPill
      label="Bước 2"
      description="Chọn sản phẩm đề xuất"
      active={currentStep === 2}
    />
  </div>
);

const StepPill = ({
  label,
  description,
  active,
}: {
  label: string;
  description: string;
  active: boolean;
}) => (
  <div
    className={cn(
      'flex-1 rounded-md border p-3 text-sm transition-colors',
      active
        ? 'border-primary bg-primary/5'
        : 'border-dashed text-muted-foreground'
    )}
  >
    <p className="font-semibold">{label}</p>
    <p>{description}</p>
  </div>
);
