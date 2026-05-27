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
import type { CostAnalysis, PricingInfo } from '@/types';

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
  cost_analysis?: CostAnalysis | null;
  pricing_info?: PricingInfo | null;
  kiotviet_status?: {
    cost_vs_basecost?: {
      inventory_cost?: number | null;
      basecost_price?: number | null;
      status?: string;
      difference?: number | null;
    };
  } | null;
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
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getPrintUrl = () => {
  if (!BACKEND_URL) return '';
  return `${BACKEND_URL.replace(/\/$/, '')}/api/r/main/print`;
};

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

const ProductRow = React.memo<{
  product: ProductWithPriceDiff;
  onShow: (id: string | number) => void;
  isAdmin: boolean;
  onUpdatePrice?: (kiotvietId: number) => Promise<unknown>;
  isUpdating?: boolean;
}>(
  ({ product, onShow, isAdmin, onUpdatePrice, isUpdating }) => {
    const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`flex items-center gap-0.5 font-medium justify-end ${
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
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
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
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    };

    const renderKvStatus = () => {
      const costCheck = product.kiotviet_status?.cost_vs_basecost;
      if (!costCheck) return <span className="text-muted-foreground">-</span>;

      const status = costCheck.status;
      const difference = costCheck.difference;

      if (status === 'matched') {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cost khớp với basecost</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }

      if (status === 'mismatched') {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Cost không khớp basecost</p>
                {costCheck.inventory_cost !== null && (
                  <p>Cost: {Number(costCheck.inventory_cost).toLocaleString()}</p>
                )}
                {costCheck.basecost_price !== null && (
                  <p>Basecost: {Number(costCheck.basecost_price).toLocaleString()}</p>
                )}
                {difference !== null && difference !== undefined && (
                  <p>
                    Chênh lệch: {difference > 0 ? '+' : ''}
                    {Number(difference).toLocaleString()}
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
                      <div
                        key={cu.code}
                        className="flex justify-between gap-4"
                      >
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

    const showUpdatePrice =
      isAdmin &&
      onUpdatePrice &&
      product.kiotviet_id &&
      product.cost_analysis?.cost_diff !== null &&
      product.cost_analysis?.cost_diff !== undefined &&
      product.cost_analysis?.cost_diff !== 0;

    return (
      <>
        {/* Mobile: Card layout */}
        <div className="sm:hidden border rounded-lg p-3 space-y-2">
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
              {product.code && (
                <div className="text-xs text-muted-foreground font-mono">
                  {product.code}
                </div>
              )}
              <div className="text-sm font-medium mt-0.5">
                {Number(product.base_price).toLocaleString()} VNĐ
              </div>
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
                onClick={() => onUpdatePrice!(product.kiotviet_id!)}
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

        {/* Desktop: Table row */}
        <TableRow className="hover:bg-muted/50 hidden sm:table-row">
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
            {product.code && (
              <div className="text-xs text-muted-foreground font-mono">
                {product.code}
              </div>
            )}
          </TableCell>
          <TableCell className="text-right tabular-nums">{renderPrice()}</TableCell>
          {isAdmin && (
            <>
              <TableCell className="text-right tabular-nums">
                {renderCostDiff()}
              </TableCell>
              <TableCell>{renderKvStatus()}</TableCell>
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
                  onClick={() => onUpdatePrice!(product.kiotviet_id!)}
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
      </>
    );
  },
  (prev, next) =>
    prev.product.id === next.product.id &&
    prev.product.base_price === next.product.base_price &&
    prev.product.cost_analysis?.cost_diff ===
      next.product.cost_analysis?.cost_diff &&
    prev.isAdmin === next.isAdmin &&
    prev.onShow === next.onShow
);

ProductRow.displayName = 'ProductRow';

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
}) => {
  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="text-right">Giá bán</TableHead>
              {isAdmin && (
                <>
                  <TableHead className="text-right">Chênh lệch cost</TableHead>
                  <TableHead>KV Status</TableHead>
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
                <TableCell>
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                {isAdmin && (
                  <>
                    <TableCell>
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
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
          <ProductRow
            key={product.id}
            product={product}
            onShow={onShow}
            isAdmin={isAdmin}
            onUpdatePrice={onUpdatePrice}
            isUpdating={updatingPriceId === product.kiotviet_id}
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
              <TableHead className="text-right">Giá bán</TableHead>
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
                </>
              )}
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                onShow={onShow}
                isAdmin={isAdmin}
                onUpdatePrice={onUpdatePrice}
                isUpdating={updatingPriceId === product.kiotviet_id}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ProductListTable;
