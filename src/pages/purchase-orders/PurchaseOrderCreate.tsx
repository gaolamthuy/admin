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
import { useSuppliers, SupplierOption } from './hooks/useSuppliers';
import { useTemplates } from './hooks/useTemplates';
import { useCreatePurchaseOrder } from './hooks/useCreatePurchaseOrder';
import {
  useSupplierCostDefaults,
  useUpsertSupplierCostDefault,
  useSupplierSurchargeHistory,
  useInsertSurchargeHistory,
} from './hooks/useSupplierCostDefaults';
import { useIsAdmin } from '@/hooks/useAuth';
import {
  useSupplierFavorites,
  useToggleSupplierFavorite,
} from './hooks/useSupplierFavorites';
import { SupplierSelector } from './components/SupplierSelector';
import { ProductSelector } from './components/ProductSelector';
import { ProductSearchDialog } from './components/ProductSearchDialog';
import { SupplierTemplateDialog } from './components/SupplierTemplateDialog';
import { useSupplierPoTemplateCounts } from './hooks/useSupplierPoTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  History,
  Loader2,
  Pencil,
  X,
  Plus,
} from 'lucide-react';
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
  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const enrichedSuppliers = useMemo(() => {
    return suppliers
      .map(s => ({ ...s, is_favorite: favoriteSet.has(s.kiotviet_id) }))
      .sort(
        (a, b) =>
          Number(Boolean(b.is_favorite)) - Number(Boolean(a.is_favorite))
      );
  }, [suppliers, favoriteSet]);

  const toggleFavorite = useToggleSupplierFavorite();

  // Số SP template theo NCC (badge trên card) — từ glt_supplier_po_templates
  const { data: templateCounts = {} } = useSupplierPoTemplateCounts();

  // Dialog soạn template (admin) + dialog thêm SP one-off vào đơn
  const [templateDialogSupplier, setTemplateDialogSupplier] =
    useState<SupplierOption | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);

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
  const insertHistory = useInsertSurchargeHistory();
  const { data: surchargeHistory = {} } = useSupplierSurchargeHistory(
    form.selectedSupplier?.kiotviet_id
  );

  // State giá trị surcharge (editable) — prefill từ defaults khi supplier đổi
  const [surchargeValues, setSurchargeValues] = useState<
    Record<string, number>
  >({});
  const [surchargeNotes, setSurchargeNotes] = useState<Record<string, string>>(
    {}
  );
  const [editingSurcharges, setEditingSurcharges] = useState(false);
  const [isTestSwitch, setIsTestSwitch] = useState(false);

  // Phụ thuộc vào nội dung (string key) thay vì ref array để tránh render loop
  const costDefaultsKey = costDefaults
    .map(
      d =>
        `${d.cost_type_code}:${d.default_value}:${d.note ?? ''}:${d.updated_at ?? ''}`
    )
    .join('|');

  useEffect(() => {
    const next: Record<string, number> = {};
    const nextNotes: Record<string, string> = {};
    SURCHARGE_TYPES.forEach(t => {
      const def = costDefaults.find(d => d.cost_type_code === t.code);
      next[t.code] = def ? Number(def.default_value) || 0 : 0;
      nextNotes[t.code] = def?.note ?? '';
    });
    setSurchargeValues(next);
    setSurchargeNotes(nextNotes);
    setEditingSurcharges(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [costDefaultsKey]);

  const totalSurcharges = Object.values(surchargeValues).reduce(
    (sum, v) => sum + (Number(v) || 0),
    0
  );

  // Auto-capture khi tạo đơn thành công:
  // 1. Upsert "lần gần nhất" (prefill cho lần sau)
  // 2. Append vào lịch sử (kèm po_code) — click-to-fill tham chiếu từ đây
  // Lỗi capture không chặn việc tạo đơn — chỉ cảnh báo.
  const captureSurcharges = async (poCode: string | null) => {
    const supplierId = form.selectedSupplier?.kiotviet_id;
    if (!supplierId) return;
    try {
      const historyRows = SURCHARGE_TYPES.filter(
        t => (Number(surchargeValues[t.code]) || 0) > 0
      ).map(t => ({
        supplier_kiotviet_id: supplierId,
        cost_type_code: t.code,
        value: Number(surchargeValues[t.code]) || 0,
        note: surchargeNotes[t.code]?.trim() || null,
        po_code: poCode,
      }));

      await Promise.all([
        ...SURCHARGE_TYPES.map(t =>
          upsertDefault.mutateAsync({
            supplier_kiotviet_id: supplierId,
            cost_type_code: t.code,
            default_value: Number(surchargeValues[t.code]) || 0,
            note: surchargeNotes[t.code]?.trim() || null,
          })
        ),
        ...(historyRows.length > 0
          ? [insertHistory.mutateAsync(historyRows)]
          : []),
      ]);
    } catch (e) {
      console.warn('[PO] Capture surcharges failed:', e);
      toast.warning('Đã tạo đơn nhưng chưa ghi lại chi phí lần này');
    }
  };

  // Hủy edit — revert về giá trị từ DB
  const handleCancelEditSurcharges = () => {
    const next: Record<string, number> = {};
    const nextNotes: Record<string, string> = {};
    SURCHARGE_TYPES.forEach(t => {
      const def = costDefaults.find(d => d.cost_type_code === t.code);
      next[t.code] = def ? Number(def.default_value) || 0 : 0;
      nextNotes[t.code] = def?.note ?? '';
    });
    setSurchargeValues(next);
    setSurchargeNotes(nextNotes);
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

  // Danh sách hiển thị = template + SP thêm one-off đã chọn (không có trong template)
  const displayTemplates = useMemo(() => {
    const extra = Object.values(form.selectedProducts).filter(
      p => !templates.some(t => t.product_id === p.product_id)
    );
    return [...templates, ...extra];
  }, [templates, form.selectedProducts]);

  // Ids đã hiển thị (exclude khỏi dialog search)
  const displayedIds = useMemo(
    () => displayTemplates.map(t => t.product_id),
    [displayTemplates]
  );

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

      const result = await createPurchaseOrder(payload);
      // Ghi lại chi phí vừa dùng: "lần gần nhất" + lịch sử (kèm po_code)
      // (await để chắc chắn persist trước khi navigate; lỗi bên trong tự warn, không chặn)
      await captureSurcharges(result?.po_code ?? null);
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
                templateCounts={templateCounts}
                {...(isAdmin
                  ? { onEditTemplate: s => setTemplateDialogSupplier(s) }
                  : {})}
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
                  {/* Lần cuối nhập hàng của NCC */}
                  {form.selectedSupplier.last_purchase_date && (
                    <p className="text-sm text-muted-foreground">
                      Lần cuối:{' '}
                      {formatDate(form.selectedSupplier.last_purchase_date)} (
                      {formatDaysAgo(form.selectedSupplier.last_purchase_date)})
                    </p>
                  )}
                  {/* ⭐ Mới: Hiển thị last_master_unit_quantity để gợi ý */}
                  {form.selectedSupplier.last_master_unit_quantity && (
                    <p className="text-sm text-muted-foreground">
                      Gợi ý số lượng:{' '}
                      {form.selectedSupplier.last_master_unit_quantity} kg
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddProductOpen(true)}
                  disabled={isSubmitting}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Thêm sản phẩm
                </Button>
              </div>

              <ProductSelector
                templates={displayTemplates}
                loading={templatesLoading}
                error={templatesError}
                selectedProducts={form.selectedProducts}
                selectedSupplierId={form.selectedSupplier?.kiotviet_id}
                onRemoveProduct={form.removeProduct}
                onAddProduct={form.addProduct}
                onRemoveAll={form.removeAll}
                onQuantityChange={form.updateQuantity}
                isAdminHint={isAdmin}
              />

              {(() => {
                const selectedProducts = form.selectedProductList;
                if (selectedProducts.length === 0) return null;

                const childUnitTotals = new Map<string, number>();
                let totalMasterUnit = 0;

                selectedProducts.forEach(product => {
                  if (product.child_units && product.child_units.length > 0) {
                    const childUnit = product.child_units[0];
                    const unit = childUnit.unit;
                    const quantity = product.quantity || 0;
                    const currentTotal = childUnitTotals.get(unit) || 0;
                    childUnitTotals.set(unit, currentTotal + quantity);
                    totalMasterUnit += quantity * childUnit.conversion_value;
                  }
                });

                const firstProduct = selectedProducts[0];
                const masterUnit = firstProduct.master_unit || 'kg';

                const childUnitsText = Array.from(childUnitTotals.entries())
                  .map(([unit, total]) => `${total} ${unit}`)
                  .join(' + ');

                return (
                  <div className="rounded-lg border bg-primary/5 p-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-primary">
                      Tổng số lượng
                    </span>
                    <div className="text-right">
                      {totalMasterUnit > 0 ? (
                        <p className="text-lg font-semibold">
                          {totalMasterUnit.toLocaleString('vi-VN')} {masterUnit}
                        </p>
                      ) : null}
                      {childUnitsText && (
                        <p className="text-sm text-muted-foreground">
                          {childUnitsText}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

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
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground"
                        onClick={handleCancelEditSurcharges}
                        title="Hủy"
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
                  {SURCHARGE_TYPES.map(t => {
                    const def = costDefaults.find(
                      d => d.cost_type_code === t.code
                    );
                    return (
                      <div key={t.code} className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <Label
                            htmlFor={`surcharge-${t.code}`}
                            className="text-xs"
                          >
                            {t.label}
                          </Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-5 text-muted-foreground hover:text-foreground"
                                title="Các lần gần nhất — bấm để điền nhanh"
                              >
                                <History className="size-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="start">
                              <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                                {t.label} — các lần gần nhất
                              </p>
                              {(surchargeHistory[t.code]?.length ?? 0) === 0 ? (
                                <p className="py-3 text-center text-xs text-muted-foreground">
                                  Chưa có lịch sử
                                </p>
                              ) : (
                                <div className="space-y-0.5">
                                  {surchargeHistory[t.code]!.map(h => (
                                    <button
                                      key={h.id}
                                      type="button"
                                      onClick={() =>
                                        setSurchargeValues(prev => ({
                                          ...prev,
                                          [t.code]: h.value,
                                        }))
                                      }
                                      className="flex w-full flex-col rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
                                      title="Bấm để điền giá trị này"
                                    >
                                      <span className="text-sm font-medium tabular-nums">
                                        {h.value.toLocaleString('vi-VN')}đ
                                        {h.po_code && (
                                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                            {h.po_code}
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(
                                          h.created_at
                                        ).toLocaleDateString('vi-VN')}
                                        {h.note ? ` · ${h.note}` : ''}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
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
                            !editingSurcharges
                              ? 'bg-transparent border-none focus-visible:ring-0 cursor-default'
                              : ''
                          }
                        />
                        {/* Note + thời gian — hiện dạng text, nhập được khi admin edit */}
                        {editingSurcharges && isAdmin ? (
                          <Input
                            value={surchargeNotes[t.code] ?? ''}
                            onChange={e =>
                              setSurchargeNotes(prev => ({
                                ...prev,
                                [t.code]: e.target.value,
                              }))
                            }
                            placeholder="Ghi chú (vd: tăng giá xăng)"
                            disabled={isSubmitting}
                            className="h-7 text-xs"
                          />
                        ) : (
                          <p className="text-xs text-muted-foreground min-h-4">
                            {def?.note ? (
                              <>
                                {def.note}
                                {def.updated_at && (
                                  <span className="text-muted-foreground/70">
                                    {' '}
                                    · lần trước{' '}
                                    {new Date(
                                      def.updated_at
                                    ).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </>
                            ) : def?.updated_at ? (
                              <span className="text-muted-foreground/70">
                                lần trước{' '}
                                {new Date(def.updated_at).toLocaleDateString(
                                  'vi-VN'
                                )}
                              </span>
                            ) : null}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Theo chi phí của đơn nhập gần nhất — tự ghi lại mỗi khi tạo
                  đơn. Bấm bút chì để sửa cho đơn hôm nay
                  {isAdmin ? ' (kèm ghi chú nếu thay đổi)' : ''}. Số 0 = không
                  áp dụng.
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
                          <Label
                            htmlFor="po-test-switch"
                            className="text-sm font-medium cursor-pointer"
                          >
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

      {/* Dialog soạn template NCC (admin) */}
      <SupplierTemplateDialog
        open={!!templateDialogSupplier}
        onOpenChange={open => {
          if (!open) setTemplateDialogSupplier(null);
        }}
        supplier={templateDialogSupplier}
      />

      {/* Dialog thêm SP one-off vào đơn hôm nay (mọi user) */}
      <ProductSearchDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        excludeIds={displayedIds}
        title="Thêm sản phẩm vào đơn"
        onConfirm={products => {
          products.forEach(p => form.addProduct(p));
          toast.success(`Đã thêm ${products.length} sản phẩm vào đơn`);
        }}
      />
    </div>
  );
};

export default PurchaseOrderCreate;
