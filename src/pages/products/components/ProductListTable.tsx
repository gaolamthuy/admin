import React from 'react';
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
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  History,
} from 'lucide-react';
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
import type { CostAnalysis, PricingInfo, CalculateFromPo } from '@/types';
import { formatDateTime, formatTimeAgo } from '@/utils/date';

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

interface ProductListTableProps {
  products: ProductWithPriceDiff[];
  loading: boolean;
  onShow: (id: string | number) => void;
  isAdmin: boolean;
  onUpdatePrice?: (kiotvietId: number) => Promise<unknown>;
  updatingPriceId?: number | null;
  sortByPriceDifference?: boolean;
  onTogglePriceDiffSort?: () => void;
  sortByKvStatus?: boolean;
  onToggleKvStatusSort?: () => void;
  sortByChangelog?: boolean;
  onToggleChangelogSort?: () => void;
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

const SyncPriceConfirmDialog: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  productName: string;
  productCode?: string;
  basePrice?: number;
  calculateFromPo?: CalculateFromPo | null;
}> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  productName,
  productCode,
  basePrice,
  calculateFromPo,
}) => {
  if (!calculateFromPo) return null;

  const fmt = (n: number | null | undefined) =>
    n != null ? Number(n).toLocaleString() : '-';
  const costDiff =
    calculateFromPo.current_inventory_cost != null
      ? calculateFromPo.new_cost - calculateFromPo.current_inventory_cost
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Xác nhận cập nhật giá
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{productName}</span>
            {productCode && (
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                {productCode}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Giá bán
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Hiện tại</span>
              <span className="font-mono font-medium">
                {fmt(basePrice)} VNĐ
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Mới</span>
              <span className="font-mono font-semibold text-primary">
                {fmt(calculateFromPo.new_baseprice)} VNĐ
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Chênh lệch</span>
              <span
                className={`font-mono font-medium ${calculateFromPo.baseprice_diff > 0 ? 'text-destructive' : calculateFromPo.baseprice_diff < 0 ? 'text-green-600 dark:text-green-400' : ''}`}
              >
                {calculateFromPo.baseprice_diff > 0
                  ? '↑ '
                  : calculateFromPo.baseprice_diff < 0
                    ? '↓ '
                    : ''}
                {calculateFromPo.baseprice_diff > 0 ? '+' : ''}
                {fmt(calculateFromPo.baseprice_diff)} VNĐ
              </span>
            </div>
          </div>

          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              Cost
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost hiện tại</span>
              <span className="font-mono font-medium">
                {fmt(calculateFromPo.current_inventory_cost)} VNĐ
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost mới</span>
              <span className="font-mono font-semibold text-primary">
                {fmt(calculateFromPo.new_cost)} VNĐ
              </span>
            </div>
            {costDiff !== null && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Chênh lệch cost</span>
                <span
                  className={`font-mono font-medium ${costDiff > 0 ? 'text-destructive' : costDiff < 0 ? 'text-green-600 dark:text-green-400' : ''}`}
                >
                  {costDiff > 0 ? '↑ ' : costDiff < 0 ? '↓ ' : ''}
                  {costDiff > 0 ? '+' : ''}
                  {fmt(costDiff)} VNĐ
                </span>
              </div>
            )}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Giá nhập PO ({calculateFromPo.latest_purchase_order_code})
                </span>
                <span className="font-mono">
                  {fmt(calculateFromPo.latest_raw_price)} VNĐ
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Extra cost/đơn vị PO</span>
                <span className="font-mono">
                  +{fmt(calculateFromPo.latest_extra_cost_per_unit)} VNĐ
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Extra cost sản phẩm</span>
                <span className="font-mono">
                  +{fmt(calculateFromPo.product_extra_cost)} VNĐ
                </span>
              </div>
            </div>
          </div>

          {calculateFromPo.child_unit_prices.length > 0 && (
            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Đơn vị con
              </div>
              {calculateFromPo.child_unit_prices.map(cu => (
                <div
                  key={cu.code}
                  className="space-y-1 pb-2 border-b last:border-b-0 last:pb-0"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {cu.full_name}
                    </span>
                    <span className="font-mono font-medium">
                      {fmt(cu.new_baseprice)} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Hiện tại</span>
                    <span className="font-mono">
                      {fmt(cu.current_baseprice)} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Chênh lệch</span>
                    <span
                      className={`font-mono ${(cu.diff || 0) > 0 ? 'text-destructive' : (cu.diff || 0) < 0 ? 'text-green-600 dark:text-green-400' : ''}`}
                    >
                      {(cu.diff || 0) > 0
                        ? '↑ '
                        : (cu.diff || 0) < 0
                          ? '↓ '
                          : ''}
                      {(cu.diff || 0) > 0 ? '+' : ''}
                      {fmt(cu.diff)} VNĐ
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Per đơn vị gốc (÷{cu.conversion_value})
                    </span>
                    <span
                      className={`font-mono ${(cu.diff_per_cv || 0) > 0 ? 'text-destructive' : (cu.diff_per_cv || 0) < 0 ? 'text-green-600 dark:text-green-400' : ''}`}
                    >
                      {(cu.diff_per_cv || 0) > 0
                        ? '↑ '
                        : (cu.diff_per_cv || 0) < 0
                          ? '↓ '
                          : ''}
                      {(cu.diff_per_cv || 0) > 0 ? '+' : ''}
                      {fmt(cu.diff_per_cv)} VNĐ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1" />
            )}
            Cập nhật giá
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ProductRow: React.FC<{
  product: ProductWithPriceDiff;
  onShow: (id: string | number) => void;
  isAdmin: boolean;
  onUpdatePrice?: (kiotvietId: number) => Promise<unknown>;
  isUpdating?: boolean;
  mode?: 'mobile' | 'desktop';
}> = ({
  product,
  onShow,
  isAdmin,
  onUpdatePrice,
  isUpdating,
  mode = 'mobile',
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [isSyncDialogOpen, setIsSyncDialogOpen] = React.useState(false);
  const imageUrl = product.images?.[0] || '/placeholder-product.png';

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
    const changelog = product.changelog;
    if (!changelog || Object.keys(changelog).length === 0) {
      return (
        <HoverCard>
          <HoverCardTrigger asChild>
            <span className="text-muted-foreground">
              <History className="h-4 w-4 opacity-50" />
            </span>
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-auto">
            <p className="text-xs">Chưa có thay đổi</p>
          </HoverCardContent>
        </HoverCard>
      );
    }

    const allChanges = Object.entries(changelog)
      .flatMap(([field, changes]) =>
        changes.map(change => ({ field, ...change }))
      )
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

    const latestChange = allChanges[0];

    const fieldLabels: Record<string, string> = {
      base_price: 'Giá bán',
      cost: 'Giá vốn',
      order_template: 'Mẫu đặt hàng',
    };

    return (
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger asChild>
          <div className="cursor-help">
            <div className="text-xs font-medium">
              {formatDateTime(latestChange.at)}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {formatTimeAgo(latestChange.at)}
            </div>
          </div>
        </HoverCardTrigger>
        <HoverCardContent side="left" className="w-auto max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold text-sm">Lịch sử thay đổi</p>
            <div className="space-y-2 text-xs">
              {Object.entries(changelog)
                .slice(0, 3)
                .map(([field, changes]) => (
                  <div key={field} className="space-y-1">
                    <div className="font-medium text-muted-foreground">
                      {fieldLabels[field] || field}
                    </div>
                    {changes.slice(0, 2).map((change, idx) => (
                      <div key={idx} className="pl-2 space-y-0.5">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Cũ:</span>
                          <span className="line-through opacity-70">
                            {change.old}
                          </span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Mới:</span>
                          <span className="font-medium">{change.new}</span>
                        </div>
                        {(change.diff !== undefined ||
                          change.pct !== undefined) && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            {change.dir === 'up' && (
                              <ArrowUp className="h-3 w-3 text-green-600" />
                            )}
                            {change.dir === 'down' && (
                              <ArrowDown className="h-3 w-3 text-destructive" />
                            )}
                            {change.pct !== undefined && (
                              <span>{change.pct}%</span>
                            )}
                            {change.diff !== undefined &&
                              change.diff !== null && (
                                <span>({change.diff.toLocaleString()})</span>
                              )}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground">
                          {change.src && <span>{change.src} • </span>}
                          {formatDateTime(change.at)} (
                          {formatTimeAgo(change.at)})
                        </div>
                      </div>
                    ))}
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
              <div className="font-medium text-sm line-clamp-1">
                {product.full_name || product.name}
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
                onClick={() => setIsSyncDialogOpen(true)}
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
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
        <SyncPriceConfirmDialog
          isOpen={isSyncDialogOpen}
          onClose={() => setIsSyncDialogOpen(false)}
          onConfirm={() => {
            onUpdatePrice!(product.kiotviet_id!);
            setIsSyncDialogOpen(false);
          }}
          isLoading={!!isUpdating}
          productName={product.name}
          productCode={product.code}
          basePrice={product.base_price}
          calculateFromPo={product.calculate_from_po}
        />
      </>
    );
  }

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <img
            src={imageUrl}
            alt={product.full_name || product.name}
            className="w-10 h-10 rounded object-cover"
            loading="lazy"
            onError={e => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
        </TableCell>
        <TableCell>
          <div className="font-medium text-sm line-clamp-1">
            {product.full_name || product.name}
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
        </TableCell>
        {isAdmin && (
          <>
            <TableCell className="text-right tabular-nums">
              {renderCostDiff()}
            </TableCell>
            <TableCell>{renderKvStatus()}</TableCell>
            <TableCell>{renderChangelog()}</TableCell>
          </>
        )}
        <TableCell>
          <div
            className="flex items-center gap-1"
            onClick={e => e.stopPropagation()}
          >
            <Button
              size="sm"
              variant="default"
              onClick={() => handleQuickPrint(10)}
            >
              10Kg
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleQuickPrint(5)}
            >
              5Kg
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsPrintModalOpen(true)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShow(product.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {showUpdatePrice && (
              <Button
                size="sm"
                variant="secondary"
                disabled={isUpdating}
                onClick={() => setIsSyncDialogOpen(true)}
              >
                {isUpdating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        productName={product.name}
        productFullName={product.full_name || ''}
        kiotvietId={product.kiotviet_id}
      />
      <SyncPriceConfirmDialog
        isOpen={isSyncDialogOpen}
        onClose={() => setIsSyncDialogOpen(false)}
        onConfirm={() => {
          onUpdatePrice!(product.kiotviet_id!);
          setIsSyncDialogOpen(false);
        }}
        isLoading={!!isUpdating}
        productName={product.name}
        productCode={product.code}
        basePrice={product.base_price}
        calculateFromPo={product.calculate_from_po}
      />
    </>
  );
};

const ProductRowMemo = React.memo(ProductRow);
ProductRowMemo.displayName = 'ProductRow';

export const ProductListTable: React.FC<ProductListTableProps> = ({
  products,
  loading,
  onShow,
  isAdmin,
  onUpdatePrice,
  updatingPriceId,
  sortByPriceDifference,
  onTogglePriceDiffSort,
  sortByKvStatus,
  onToggleKvStatusSort,
  sortByChangelog,
  onToggleChangelogSort,
}) => {
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
                  <TableHead>
                    <button
                      onClick={onToggleChangelogSort}
                      className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      Changelog
                      <ArrowUpDown
                        className={`h-3 w-3 ${sortByChangelog ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </TableHead>
                </>
              )}
              <TableHead>Thao tác</TableHead>
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
                  </>
                )}
                <TableCell>
                  <Skeleton className="h-8 w-32" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!products || products.length === 0) {
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

  return (
    <div>
      {/* Mobile: card list */}
      <div className="sm:hidden space-y-2">
        {products.map(product => (
          <ProductRowMemo
            key={product.id}
            product={product}
            onShow={onShow}
            isAdmin={isAdmin}
            onUpdatePrice={onUpdatePrice}
            isUpdating={updatingPriceId === product.kiotviet_id}
            mode="mobile"
          />
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
                  <TableHead>
                    <button
                      onClick={onToggleChangelogSort}
                      className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                    >
                      Changelog
                      <ArrowUpDown
                        className={`h-3 w-3 ${sortByChangelog ? 'text-foreground' : 'text-muted-foreground'}`}
                      />
                    </button>
                  </TableHead>
                </>
              )}
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <ProductRowMemo
                key={product.id}
                product={product}
                onShow={onShow}
                isAdmin={isAdmin}
                onUpdatePrice={onUpdatePrice}
                isUpdating={updatingPriceId === product.kiotviet_id}
                mode="desktop"
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductListTable;
