/**
 * Purchase Order Create Page
 * Sử dụng step-based flow với usePurchaseOrderForm
 * Step 1: Chọn supplier
 * Step 2: Chọn products từ templates
 *
 * @module pages/purchase-orders/PurchaseOrderCreate
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrderForm } from './hooks/usePurchaseOrderForm';
import { useSuppliers } from './hooks/useSuppliers';
import { useTemplates } from './hooks/useTemplates';
import { useCreatePurchaseOrder } from './hooks/useCreatePurchaseOrder';
import { useSupplierCostDefaults, useUpsertSupplierCostDefault } from './hooks/useSupplierCostDefaults';
import { useIsAdmin } from '@/hooks/useAuth';
import {
  useSupplierFavorites,
  useToggleSupplierFavorite,
} from './hooks/useSupplierFavorites';
import { SupplierSelector } from './components/SupplierSelector';
import { ProductSelector } from './components/ProductSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate, formatDaysAgo } from '@/utils/date';

// Các loại chi phí nhập hàng (mã CHK* từ KiotViet — route vào ex_return_third_party)
const SURCHARGE_TYPES = [
  { code: 'CHK000002', label: 'Cước xe' },
  { code: 'CHK000001', label: 'Xuống gạo' },
] as const;

/**
 * Purchase Order Create Page Component với step-based flow
 */
export const PurchaseOrderCreate = () => {
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
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

  // Favorites — merge is_favorite + sort favorites lên đầu
  const { data: favoriteIds = [] } = useSupplierFavorites();
  const favoriteSet = useMemo(
    () => new Set(favoriteIds),
    [favoriteIds]
  );
  const enrichedSuppliers = useMemo(() => {
    return suppliers
      .map(s => ({ ...s, is_favorite: favoriteSet.has(s.kiotviet_id) }))
      .sort(
        (a, b) =>
          Number(Boolean(b.is_favorite)) - Number(Boolean(a.is_favorite))
      );
  }, [suppliers, favoriteSet]);

  const toggleFavorite = useToggleSupplierFavorite();

  const handleToggleFavorite = (supplier: typeof form.selectedSupplier) => {
    if (!supplier) return;
    toggleFavorite.mutate(
      {
        supplierKiotvietId: supplier.kiotviet_id,
        favorite: !supplier.is_favorite,
      },
      {
        onError: e =>
          toast.error('Không cập nhật được yêu thích', {
            description: String(e),
          }),
      }
    );
  };

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

  // Default surcharges của supplier đã chọn (cước xe, xuống gạo...)
  const { data: costDefaults = [] } = useSupplierCostDefaults(
    form.selectedSupplier?.kiotviet_id
  );
  const upsertDefault = useUpsertSupplierCostDefault();

  // State giá trị surcharge (editable) — prefill từ defaults khi supplier đổi
  const [surchargeValues, setSurchargeValues] = useState<
    Record<string, number>
  >({});
  const [editingSurcharges, setEditingSurcharges] = useState(false);
  const [savingSurcharges, setSavingSurcharges] = useState(false);
  const [isTestSwitch, setIsTestSwitch] = useState(false);

  // Phụ thuộc vào nội dung (string key) thay vì ref array để tránh render loop
  const costDefaultsKey = costDefaults
    .map(d => `${d.cost_type_code}:${d.default_value}`)
    .join('|');

  useEffect(() => {
    const next: Record<string, number> = {};
    SURCHARGE_TYPES.forEach(t => {
      const def = costDefaults.find(d => d.cost_type_code === t.code);
      next[t.code] = def ? Number(def.default_value) || 0 : 0;
    });
    setSurchargeValues(next);
    setEditingSurcharges(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costDefaultsKey]);

  const totalSurcharges = Object.values(surchargeValues).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  // Lưu giá trị surcharge về Supabase (trở thành default cho supplier)
  const handleSaveSurcharges = async () => {
    if (!form.selectedSupplier?.kiotviet_id) return;
    setSavingSurcharges(true);
    try {
      await Promise.all(
        SURCHARGE_TYPES.map(t =>
          upsertDefault.mutateAsync({
            supplier_kiotviet_id: form.selectedSupplier!.kiotviet_id!,
            cost_type_code: t.code,
            default_value: Number(surchargeValues[t.code]) || 0,
          })
        )
      );
      toast.success('Đã lưu chi phí nhập mặc định cho supplier');
      setEditingSurcharges(false);
    } catch (e) {
      toast.error('Lưu chi phí thất bại', { description: String(e) });
    } finally {
      setSavingSurcharges(false);
    }
  };

  // Hủy edit — revert về giá trị từ DB
  const handleCancelEditSurcharges = () => {
    const next: Record<string, number> = {};
    SURCHARGE_TYPES.forEach(t => {
      const def = costDefaults.find(d => d.cost_type_code === t.code);
      next[t.code] = def ? Number(def.default_value) || 0 : 0;
    });
    setSurchargeValues(next);
    setEditingSurcharges(false);
  };

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
   * Clear selectedProducts để tránh sót items của supplier trước đó
   */
  const handleSupplierSelect = (supplier: typeof form.selectedSupplier) => {
    form.removeAll();
    form.setSelectedSupplier(supplier);
    form.setStep(2);
  };

  /**
   * Xử lý quay lại step 1
   * Clear selectedProducts để khi chọn supplier mới không sót items cũ
   */
  const handleBackToStep1 = () => {
    form.removeAll();
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
      // Build payload cho Windmill flow create_purchase_order
      // Giá nhập KHÔNG gửi — script tự lấy latest PO price phía server.
      // is_draft luôn = 1 (nháp) — admin duyệt trên KiotViet portal.
      const surcharges = SURCHARGE_TYPES.map(t => ({
        code: t.code,
        name: t.label,
        value: Number(surchargeValues[t.code]) || 0,
        isSupplierExpense: false,
      })).filter(s => s.value > 0);

      const payload = {
        supplier_code: form.selectedSupplier.code ?? '',
        items: form.selectedProductList.map(product => {
          // Convert quantity từ số bao (child unit) sang kg (master unit)
          // Nếu có child_units[0]: quantity (số bao) * conversion_value = kg
          // Nếu không có child_units: quantity giữ nguyên
          const quantityInKg =
            product.child_units && product.child_units.length > 0
              ? product.quantity * product.child_units[0].conversion_value
              : product.quantity;

          return {
            kiotviet_id: product.product_id,
            quantity: quantityInKg, // Gửi kg (master unit)
          };
        }),
        branch_id: form.selectedSupplier.branch_id ?? undefined,
        ...(surcharges.length > 0 ? { surcharges } : {}),
        ...(isTestSwitch ? { is_test: true } : {}),
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
                suppliers={enrichedSuppliers}
                loading={suppliersLoading}
                error={suppliersError}
                selectedSupplier={form.selectedSupplier}
                onSelect={handleSupplierSelect}
                onToggleFavorite={handleToggleFavorite}
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
                      .sort(
                        (a, b) => new Date(b).getTime() - new Date(a).getTime()
                      );
                    const latestDate = lastPurchaseDates[0];
                    return latestDate ? (
                      <p className="text-sm text-muted-foreground">
                        Lần cuối: {formatDate(latestDate)} (
                        {formatDaysAgo(latestDate)})
                      </p>
                    ) : null;
                  })()}
                  {/* ⭐ Mới: Hiển thị last_master_unit_quantity để gợi ý */}
                  {form.selectedSupplier.last_master_unit_quantity && (
                    <p className="text-sm text-muted-foreground">
                      Gợi ý số lượng:{' '}
                      {form.selectedSupplier.last_master_unit_quantity} kg
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
                    const masterUnit = firstProduct.master_unit || 'kg';

                    // Format child units: "8 bao 50kg + 1 bao 60kg"
                    const childUnitsText = Array.from(childUnitTotals.entries())
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

              {/* Chi phí nhập hàng (surcharges) — prefill từ default, cho override */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">Chi phí nhập hàng</p>
                  <div className="flex items-center gap-3">
                    {totalSurcharges > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Tổng:{' '}
                        <span className="font-medium text-foreground">
                          {totalSurcharges.toLocaleString('vi-VN')}đ
                        </span>
                      </span>
                    )}
                    {editingSurcharges ? (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-green-600"
                          onClick={handleSaveSurcharges}
                          disabled={savingSurcharges}
                          title="Lưu làm mặc định"
                        >
                          {savingSurcharges ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={handleCancelEditSurcharges}
                          disabled={savingSurcharges}
                          title="Hủy"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => setEditingSurcharges(true)}
                        disabled={isSubmitting}
                        title="Chỉnh sửa chi phí"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SURCHARGE_TYPES.map(t => (
                    <div key={t.code} className="space-y-1">
                      <Label htmlFor={`surcharge-${t.code}`} className="text-xs">
                        {t.label}
                      </Label>
                      <CurrencyInput
                        id={`surcharge-${t.code}`}
                        value={surchargeValues[t.code] ?? 0}
                        onValueChange={n =>
                          setSurchargeValues(prev => ({
                            ...prev,
                            [t.code]: n,
                          }))
                        }
                        disabled={isSubmitting || !editingSurcharges}
                        readOnly={!editingSurcharges}
                        className={
                          !editingSurcharges ? 'bg-transparent border-none focus-visible:ring-0 cursor-default' : ''
                        }
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bấm bút chì để sửa. Check để lưu làm mặc định cho supplier. Số 0
                  = không áp dụng.
                </p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleBackToStep1}
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Quay lại
                  </Button>
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="po-test-switch"
                            checked={isTestSwitch}
                            onCheckedChange={setIsTestSwitch}
                            disabled={isSubmitting}
                          />
                          <Label htmlFor="po-test-switch" className="text-sm font-medium cursor-pointer">
                            PO test
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        Bật khi test — không gửi thông báo Zalo
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
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
