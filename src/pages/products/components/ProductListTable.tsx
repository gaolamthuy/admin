import React from 'react';
import { Link } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
  Eye,
  Loader2,
  MoreHorizontal,
  Printer,
  Upload,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
  PenLine,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateProduct } from '../hooks/useProductShow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonGroup } from '@/components/ui/button-group';
import { PriceEditDialog } from './PriceEditDialog';
import type { UpdateProductPriceResult } from '../hooks/useUpdateProductPrice';
import type { CostAnalysis, PricingInfo, CalculateFromPo } from '@/types';
import { formatDate, formatDateTime, formatTimeAgo } from '@/utils/date';

interface ProductWithPriceDiff {
  id: string;
  kiotviet_id?: number;
  code?: string;
  name: string;
  full_name?: string;
  category_name?: string;
  base_price: number;
  images?: string[];
  is_active?: boolean;
  glt_labelprint_favorite?: boolean;
  order_template?: string | null;
  glt_supplier_name?: string | null;
  glt_baseprice_markup?: number | null;
  glt_extra_cost?: number | null;
  glt_baseprice_round_step?: number | null;
  child_unit_info?: Array<{
    kiotviet_id: number;
    code: string;
    full_name: string;
    unit: string;
    base_price: number;
    conversion_value: number;
    price_per_master_unit?: number | null;
  }> | null;
  modified_date?: string | null;
  cost_analysis?: CostAnalysis | null;
  pricing_info?: PricingInfo | null;
  calculate_from_po?: CalculateFromPo | null;
  kiotviet_status?: {
    cost_vs_basecost?: {
      inventory_cost?: number | null;
      basecost_price?: number | null;
      status?: string;
      difference?: number | null;
    };
  } | null;
  changelog?: Record<
    string,
    Array<{
      old: string;
      new: string;
      diff?: number;
      pct?: number;
      dir?: 'up' | 'down';
      src?: string;
      at: string;
    }>
  > | null;
}

export interface ProductTableGroup {
  key: string;
  label: string;
  products: ProductWithPriceDiff[];
  isContinued: boolean;
}

interface ProductListTableProps {
  groups: ProductTableGroup[];
  loading: boolean;
  onShow: (id: string | number) => void;
  isAdmin: boolean;
  showSupplierName?: boolean;
  onUpdatePrice?: (
    kiotvietId: number,
    params?: { targetCost?: number; targetPoPrice?: number }
  ) => Promise<UpdateProductPriceResult>;
  updatingPriceId?: number | null;
  sortByPriceDifference?: boolean;
  onTogglePriceDiffSort?: () => void;
  sortByKvStatus?: boolean;
  onToggleKvStatusSort?: () => void;
}

import { getPrintUrl } from '@/lib/windmill';

const submitPostForm = (
  url: string,
  params: Record<string, string>,
  target = '_blank'
) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = url;
  form.target = target;
  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};

/**
 * Cell inline edit cho Tên gọi NCC / nội bộ
 * Click → input, Enter/blur tự lưu, Esc hủy. Trống = dùng tên gốc.
 */
const SupplierNameCell: React.FC<{
  productId: number;
  value?: string | null;
}> = ({ productId, value }) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const cancelEditRef = React.useRef(false);
  const updateProduct = useUpdateProduct();

  const openEdit = () => {
    cancelEditRef.current = false;
    setDraft(value ?? '');
    setEditing(true);
  };

  const closeEdit = () => {
    setEditing(false);
  };

  const save = () => {
    // Guard: Esc đã hủy thì blur muộn không lưu
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }
    if (updateProduct.isPending) return;

    const next = draft.trim();
    if (next === (value ?? '').trim()) {
      closeEdit();
      return;
    }

    updateProduct.mutate(
      { id: productId, fields: { glt_supplier_name: next || null } },
      {
        onSuccess: () => {
          toast.success('Đã lưu tên NCC');
          closeEdit();
        },
        onError: (error: Error) => {
          toast.error(`Lưu tên NCC thất bại: ${error.message}`);
        },
      }
    );
  };

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        disabled={updateProduct.isPending}
        placeholder="Trống = dùng tên gốc"
        className="h-8 text-sm"
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            save();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelEditRef.current = true;
            closeEdit();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={openEdit}
      title="Click để sửa tên NCC / nội bộ"
      className="group flex w-full max-w-[200px] items-center gap-1 text-left text-sm hover:text-foreground cursor-pointer"
    >
      <span className="truncate">
        {value ? value : <span className="text-muted-foreground/50">—</span>}
      </span>
      <PenLine className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" />
      {updateProduct.isPending && (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin text-muted-foreground" />
      )}
    </button>
  );
};

const PrintModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productFullName: string;
  kiotvietId?: number;
}> = ({ isOpen, onClose, productName, productFullName, kiotvietId }) => {
  const [loading, setLoading] = React.useState(false);
  const [customQuantity, setCustomQuantity] = React.useState('');

  const handlePrint = (quantity: number) => {
    if (!kiotvietId) return;
    setLoading(true);
    try {
      submitPostForm(getPrintUrl(), {
        printType: 'label-product',
        productId: String(kiotvietId),
        quantity: String(quantity),
      });
      onClose();
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceboard = () => {
    if (!kiotvietId) return;
    setLoading(true);
    try {
      submitPostForm(getPrintUrl(), {
        printType: 'priceboard',
        kiotviet_id: String(kiotvietId),
      });
      onClose();
    } catch (error) {
      console.error('Priceboard print error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            In nhãn sản phẩm
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">Sản phẩm: </span>
            <span>{productName}</span>
            <br />
            <span className="text-sm text-muted-foreground">
              Mã: {productFullName}
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Nhập số Kg:</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePrint(1)}
                variant="outline"
                disabled={loading}
                className="h-10"
              >
                1Kg
              </Button>
              <Button
                onClick={() => handlePrint(2)}
                variant="outline"
                disabled={loading}
                className="h-10"
              >
                2Kg
              </Button>
              <ButtonGroup>
                <Input
                  placeholder="3 kg"
                  value={customQuantity}
                  onChange={e => setCustomQuantity(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const qty = parseInt(customQuantity) || 3;
                      if (qty > 0 && qty <= 100) handlePrint(qty);
                    }
                  }}
                  className="flex-1 max-w-15"
                />
                <Button
                  onClick={() => {
                    const qty = parseInt(customQuantity) || 3;
                    if (qty > 0 && qty <= 100) handlePrint(qty);
                  }}
                  disabled={loading}
                  className="px-3"
                  variant="outline"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>
          <div className="border-t" />
          <div className="space-y-3">
            <Label className="text-sm font-semibold">In bảng giá bán lẻ:</Label>
            <Button
              onClick={handlePriceboard}
              variant="outline"
              disabled={loading}
              className="w-full h-10"
            >
              In bảng giá bán lẻ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductRow: React.FC<{
  product: ProductWithPriceDiff;
  onShow: (id: string | number) => void;
  isAdmin: boolean;
  showSupplierName?: boolean;
  onUpdatePrice?: (
    kiotvietId: number,
    params?: { targetCost?: number; targetPoPrice?: number }
  ) => Promise<UpdateProductPriceResult>;
  isUpdating?: boolean;
  mode?: 'mobile' | 'desktop';
}> = ({
  product,
  onShow,
  isAdmin,
  showSupplierName,
  onUpdatePrice,
  isUpdating,
  mode = 'mobile',
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = React.useState(false);
  const imageUrl = product.images?.[0] || '/placeholder-product.png';

  // Check nếu sản phẩm được KV cập nhật trong 24h gần nhất
  const isRecentlyModified = (() => {
    if (!product.modified_date) return false;
    const modifiedTime = new Date(product.modified_date).getTime();
    const now = Date.now();
    return now - modifiedTime < 24 * 60 * 60 * 1000; // 24h
  })();

  const handleQuickPrint = (qty: number) => {
    if (!product.kiotviet_id) return;
    submitPostForm(getPrintUrl(), {
      printType: 'label-product',
      productId: String(product.kiotviet_id),
      quantity: String(qty),
    });
  };

  const renderCostDiff = () => {
    const ca = product.cost_analysis;
    if (!ca || ca.cost_diff === null || ca.cost_diff === undefined) {
      return <span className="text-muted-foreground">-</span>;
    }
    return (
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <span
            className={`flex items-center gap-0.5 font-medium justify-end cursor-help ${
              ca.cost_diff > 0
                ? 'text-green-600 dark:text-green-400'
                : ca.cost_diff < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
            }`}
          >
            {ca.cost_diff > 0 && <ArrowDown className="h-3 w-3" />}
            {ca.cost_diff < 0 && <ArrowUp className="h-3 w-3" />}
            {Math.abs(ca.cost_diff).toLocaleString()}
          </span>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-auto max-w-xs">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Cost hiện tại:</span>
              <span className="font-medium tabular-nums">
                {ca.inventory_cost?.toLocaleString()} đ
              </span>
            </div>
            <div className="border-t pt-1" />
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Giá nhập PO:</span>
              <span className="tabular-nums">
                {ca.latest_po_price?.toLocaleString()} đ
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Extra cost PO:</span>
              <span className="tabular-nums">
                {ca.latest_po_extra_cost?.toLocaleString()} đ
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Extra cost:</span>
              <span className="tabular-nums">
                {(ca.glt_extra_cost ?? 0).toLocaleString()} đ
              </span>
            </div>
            {product.calculate_from_po?.latest_purchase_date && (
              <>
                <div className="border-t pt-1" />
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Ngày nhập PO:</span>
                  <div className="text-right tabular-nums">
                    <div className="font-medium">
                      {formatDateTime(
                        product.calculate_from_po.latest_purchase_date
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatTimeAgo(
                        product.calculate_from_po.latest_purchase_date
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Mã PO:</span>
                  <span className="tabular-nums">
                    {product.calculate_from_po.latest_purchase_order_code}
                  </span>
                </div>
              </>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const renderKvStatus = () => {
    const costCheck = product.kiotviet_status?.cost_vs_basecost;
    if (!costCheck) return <span className="text-muted-foreground">-</span>;

    const status = costCheck.status;
    const difference = costCheck.difference;

    if (status === 'matched') {
      return (
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger asChild>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 cursor-help" />
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-auto">
            <p className="text-xs">Cost khớp với basecost</p>
          </HoverCardContent>
        </HoverCard>
      );
    }

    if (status === 'mismatched') {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-1 cursor-help">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {difference !== null && difference !== undefined && (
                <span
                  className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                    difference > 0
                      ? 'text-destructive'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {difference > 0 && <ArrowUp className="h-3 w-3" />}
                  {difference < 0 && <ArrowDown className="h-3 w-3" />}
                  {Math.abs(Number(difference)).toLocaleString()}
                </span>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-auto">
            <div className="space-y-1 text-xs">
              <p>Cost không khớp basecost</p>
              {costCheck.inventory_cost !== null && (
                <p>Cost: {Number(costCheck.inventory_cost).toLocaleString()}</p>
              )}
              {costCheck.basecost_price !== null && (
                <p>
                  Basecost: {Number(costCheck.basecost_price).toLocaleString()}
                </p>
              )}
              {difference !== null && difference !== undefined && (
                <p>
                  Chênh lệch: {difference > 0 ? '+' : ''}
                  {Number(difference).toLocaleString()}
                </p>
              )}
            </div>
          </HoverCardContent>
        </HoverCard>
      );
    }

    return <span className="text-muted-foreground text-xs">-</span>;
  };

  const renderPrice = () => {
    const pi = product.pricing_info;
    if (!pi) {
      return (
        <span className="font-medium">
          {Number(product.base_price).toLocaleString()} VNĐ
        </span>
      );
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-medium">
              {pi.base_price.toLocaleString()} VNĐ
            </span>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Giá bán:</span>
                <span className="font-medium tabular-nums">
                  {pi.base_price.toLocaleString()} đ
                </span>
              </div>
              {pi.glt_baseprice_markup > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Markup:</span>
                  <span className="tabular-nums">
                    +{pi.glt_baseprice_markup.toLocaleString()} đ
                  </span>
                </div>
              )}
              {pi.new_baseprice_suggestion !== null && (
                <div className="flex justify-between gap-4 border-t pt-1">
                  <span className="text-muted-foreground">Đề xuất:</span>
                  <span className="font-semibold tabular-nums">
                    {pi.new_baseprice_suggestion.toLocaleString()} đ
                  </span>
                </div>
              )}
              {pi.child_unit_prices && pi.child_unit_prices.length > 0 && (
                <div className="border-t pt-1 space-y-0.5">
                  <span className="text-muted-foreground">Đơn vị con:</span>
                  {pi.child_unit_prices.map(cu => (
                    <div key={cu.code} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">{cu.code}</span>
                      <span className="tabular-nums">
                        {cu.base_price.toLocaleString()} đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const renderChangelog = () => {
    // Chỉ theo dõi thay đổi giá vốn (cost) — hiển thị 3 lần gần nhất trong popover
    const costChanges = [...(product.changelog?.cost ?? [])].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
    );

    const fmtNum = (v: string) =>
      /^\d+$/.test(v) ? Number(v).toLocaleString('vi-VN') : v;

    const renderDir = (dir?: 'up' | 'down') =>
      // Giá vốn: tăng = đỏ (tốn thêm tiền), giảm = xanh lá (lời hơn)
      dir === 'up' ? (
        <ArrowUp className="h-3 w-3 shrink-0 text-destructive" />
      ) : dir === 'down' ? (
        <ArrowDown className="h-3 w-3 shrink-0 text-green-600" />
      ) : null;

    const diffNum = (diff?: number | null) =>
      diff === undefined || diff === null || diff === 0 ? null : (
        <span>{Math.abs(Math.round(diff)).toLocaleString('vi-VN')}</span>
      );

    if (costChanges.length === 0) {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="text-muted-foreground">
              <History className="h-4 w-4 opacity-50" />
            </span>
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-auto">
            <p className="text-xs">Chưa có thay đổi giá vốn</p>
          </HoverCardContent>
        </HoverCard>
      );
    }

    const latest = costChanges[0];

    return (
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div className="cursor-help">
            <div className="flex items-center gap-1 text-xs font-medium tabular-nums">
              {renderDir(latest.dir)}
              {diffNum(latest.diff)}
              <span className="text-muted-foreground">
                (<span className="line-through">{fmtNum(latest.old)}</span> →{' '}
                <span className="font-bold">{fmtNum(latest.new)}</span>)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {formatDate(latest.at, 'DD/MM')} · {formatTimeAgo(latest.at)}
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="top" className="w-80">
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Giá vốn — 3 lần thay đổi gần nhất
            </p>
            <div className="space-y-1.5 text-xs">
              {costChanges.slice(0, 3).map((change, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-1 tabular-nums">
                    {renderDir(change.dir)}
                    {diffNum(change.diff)}
                    <span className="text-muted-foreground">
                      (
                      <span className="line-through">{fmtNum(change.old)}</span>{' '}
                      → <span className="font-bold">{fmtNum(change.new)}</span>)
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] text-muted-foreground">
                    {change.src && (
                      <div>
                        {change.src === 'webhook'
                          ? 'KiotViet'
                          : change.src === 'po_update'
                            ? 'Đơn nhập'
                            : change.src === 'admin_manual'
                              ? 'Admin'
                              : change.src === 'sync'
                                ? 'Sync'
                                : change.src}
                      </div>
                    )}
                    {formatDateTime(change.at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  const showUpdatePrice =
    isAdmin &&
    onUpdatePrice &&
    product.kiotviet_id &&
    product.cost_analysis?.cost_diff !== null &&
    product.cost_analysis?.cost_diff !== undefined &&
    product.cost_analysis?.cost_diff !== 0;
  // Dialog chỉnh giá dùng chung cho mobile + desktop
  const priceDialog = (
    <PriceEditDialog
      isOpen={isPriceDialogOpen}
      onClose={() => setIsPriceDialogOpen(false)}
      onUpdatePrice={async (kiotvietId, params) => {
        if (!onUpdatePrice) {
          throw new Error('Chức năng cập nhật giá chưa sẵn sàng');
        }
        return await onUpdatePrice(kiotvietId, params);
      }}
      productName={product.name}
      productCode={product.code}
      kiotvietId={product.kiotviet_id ?? 0}
      basePrice={product.base_price}
      currentCost={product.cost_analysis?.inventory_cost ?? null}
      markup={product.glt_baseprice_markup ?? 0}
      roundStep={product.glt_baseprice_round_step ?? 1000}
      extraCost={product.glt_extra_cost ?? 0}
      childUnits={(product.child_unit_info ?? []).map(cu => ({
        kiotviet_id: cu.kiotviet_id,
        code: cu.code,
        full_name: cu.full_name,
        unit: cu.unit,
        conversion_value: cu.conversion_value,
        base_price: cu.base_price,
      }))}
      calculateFromPo={product.calculate_from_po}
      orderTemplate={product.order_template ?? null}
    />
  );

  if (mode === 'mobile') {
    return (
      <>
        <div className="border rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-3">
            <img
              src={imageUrl}
              alt={product.full_name || product.name}
              className="w-12 h-12 rounded object-cover shrink-0"
              loading="lazy"
              onError={e => {
                (e.target as HTMLImageElement).src = '/placeholder-product.png';
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-1 flex items-center gap-1.5">
                {product.full_name || product.name}
                {isRecentlyModified && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-1.5 py-0.5 rounded-full shrink-0">
                    <Upload className="h-2.5 w-2.5" />
                    Mới
                  </span>
                )}
              </div>
              {product.order_template ? (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {product.order_template}
                </div>
              ) : (
                product.code && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {product.code}
                  </div>
                )
              )}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1.5 shrink-0">
                {renderCostDiff()}
                {renderKvStatus()}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t">
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs flex-1"
              onClick={() => handleQuickPrint(10)}
            >
              10Kg
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs flex-1"
              onClick={() => handleQuickPrint(5)}
            >
              5Kg
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 px-0"
              onClick={() => setIsPrintModalOpen(true)}
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 w-7 px-0"
                onClick={() => onShow(product.id)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
            )}
            {showUpdatePrice && (
              <Button
                size="sm"
                variant="secondary"
                className="h-7 w-7 px-0"
                disabled={isUpdating}
                onClick={() => setIsPriceDialogOpen(true)}
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </div>
        <PrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          productName={product.name}
          productFullName={product.full_name || ''}
          kiotvietId={product.kiotviet_id}
        />
        {priceDialog}
      </>
    );
  }

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <Link
            to={`/products/show/${product.id}`}
            className="block shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={product.full_name || product.name}
              className="w-10 h-10 rounded object-cover hover:ring-2 hover:ring-primary/40 transition-shadow"
              loading="lazy"
              onError={e => {
                (e.target as HTMLImageElement).src = '/placeholder-product.png';
              }}
            />
          </Link>
        </TableCell>
        <TableCell className="group/name max-w-[320px]">
          <div className="flex items-center gap-1">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-1 flex items-center gap-1.5">
                <Link
                  to={`/products/show/${product.id}`}
                  className="hover:underline underline-offset-2"
                  onClick={e => e.stopPropagation()}
                >
                  {product.full_name || product.name}
                </Link>
                {isRecentlyModified && (
                  <Badge variant="outline">
                    <Upload className="h-2.5 w-2.5" />
                    Recently updated
                  </Badge>
                )}
              </div>
              {product.order_template ? (
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {product.order_template}
                </div>
              ) : (
                product.code && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {product.code}
                  </div>
                )
              )}
            </div>
            {isAdmin && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 transition-opacity group-hover/name:opacity-100 focus-within:opacity-100">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 px-0 cursor-pointer"
                        disabled={!product.kiotviet_id}
                        onClick={() => {
                          submitPostForm(getPrintUrl(), {
                            printType: 'priceboard',
                            kiotviet_id: String(product.kiotviet_id),
                          });
                        }}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">In bảng giá bán lẻ</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 px-0 cursor-pointer"
                        disabled={!product.kiotviet_id}
                        onClick={() => setIsPriceDialogOpen(true)}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">Chỉnh sửa giá</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        </TableCell>
        {isAdmin && (
          <>
            <TableCell className="text-right tabular-nums">
              {renderCostDiff()}
            </TableCell>
            <TableCell>{renderKvStatus()}</TableCell>
            <TableCell>{renderChangelog()}</TableCell>
            {showSupplierName && (
              <TableCell>
                <SupplierNameCell
                  productId={Number(product.id)}
                  value={product.glt_supplier_name}
                />
              </TableCell>
            )}
          </>
        )}
      </TableRow>
      {isAdmin && priceDialog}
    </>
  );
};

const ProductRowMemo = React.memo(ProductRow);
ProductRowMemo.displayName = 'ProductRow';

export const ProductListTable: React.FC<ProductListTableProps> = ({
  groups,
  loading,
  onShow,
  isAdmin,
  showSupplierName,
  onUpdatePrice,
  updatingPriceId,
  sortByPriceDifference,
  onTogglePriceDiffSort,
  sortByKvStatus,
  onToggleKvStatusSort,
}) => {
  const totalProducts = groups.reduce((sum, g) => sum + g.products.length, 0);

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Sản phẩm</TableHead>
              {isAdmin && (
                <>
                  <TableHead className="text-right">
                    <button
                      onClick={onTogglePriceDiffSort}
                      className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors cursor-pointer"
                    >
                      Chênh lệch cost
                      <ArrowUpDown
                        className={`h-3 w-3 ${sortByPriceDifference ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={onToggleKvStatusSort}
                      className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      KV Status
                      <ArrowUpDown
                        className={`h-3 w-3 ${sortByKvStatus ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>Changelog</TableHead>
                  {showSupplierName && <TableHead>Tên NCC</TableHead>}
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="w-10 h-10 rounded" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-40" />
                </TableCell>
                {isAdmin && (
                  <>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    {showSupplierName && (
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                    )}
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (totalProducts === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-500 text-lg">Không có sản phẩm nào</p>
          <p className="text-gray-400 text-sm mt-2">
            Hãy thêm sản phẩm mới để bắt đầu
          </p>
        </div>
      </div>
    );
  }

  // Số cột table: ảnh + tên (+3 cột admin, +1 tên NCC khi bật)
  const tableColSpan = isAdmin ? (showSupplierName ? 6 : 5) : 2;

  const renderRow = (
    product: ProductWithPriceDiff,
    mode: 'mobile' | 'desktop'
  ) => (
    <ProductRowMemo
      key={product.id}
      product={product}
      onShow={onShow}
      isAdmin={isAdmin}
      showSupplierName={showSupplierName}
      onUpdatePrice={onUpdatePrice}
      isUpdating={updatingPriceId === product.kiotviet_id}
      mode={mode}
    />
  );

  return (
    <div>
      {/* Mobile: card list theo nhóm */}
      <div className="sm:hidden space-y-2">
        {groups.map(group => (
          <div key={group.key} className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.label} · {group.products.length} SP
              {group.isContinued && (
                <span className="ml-1 font-normal normal-case text-muted-foreground/60">
                  (tiếp)
                </span>
              )}
            </p>
            {group.products.map(p => renderRow(p, 'mobile'))}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden sm:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Sản phẩm</TableHead>
              {isAdmin && (
                <>
                  <TableHead className="text-right">
                    <button
                      onClick={onTogglePriceDiffSort}
                      className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors cursor-pointer"
                    >
                      Chênh lệch cost
                      <ArrowUpDown
                        className={`h-3 w-3 ${sortByPriceDifference ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={onToggleKvStatusSort}
                      className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      KV Status
                      <ArrowUpDown
                        className={`h-3 w-3 ${sortByKvStatus ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </TableHead>
                  <TableHead>Changelog</TableHead>
                  {showSupplierName && <TableHead>Tên NCC</TableHead>}
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(group => (
              <React.Fragment key={group.key}>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableCell colSpan={tableColSpan} className="border-b py-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label} · {group.products.length} SP
                      {group.isContinued && (
                        <span className="ml-1 font-normal normal-case text-muted-foreground/60">
                          (tiếp)
                        </span>
                      )}
                    </span>
                  </TableCell>
                </TableRow>
                {group.products.map(p => renderRow(p, 'desktop'))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductListTable;
