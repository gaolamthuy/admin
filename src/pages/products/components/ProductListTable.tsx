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
import { Eye, Loader2, MoreHorizontal, Printer, RefreshCw, AlertTriangle, CheckCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ButtonGroup } from '@/components/ui/button-group';
import { toast } from 'sonner';

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
  priceDifference?: number | null;
  priceDifferencePercent?: number | null;
  inventoryCost?: number | null;
  latestPurchaseCost?: number | null;
  latestPriceDifference?: number | null;
  latestPriceDifferencePercent?: number | null;
  costDiffFromLatestPo?: number | null;
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
              <Button onClick={() => handlePrint(1)} variant="outline" disabled={loading} className="h-10">
                1Kg
              </Button>
              <Button onClick={() => handlePrint(2)} variant="outline" disabled={loading} className="h-10">
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
            <Button onClick={handlePriceboard} variant="outline" disabled={loading} className="w-full h-10">
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
}>(({ product, onShow, isAdmin, onUpdatePrice, isUpdating }) => {
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
          {product.code && (
            <div className="text-xs text-muted-foreground font-mono">
              {product.code}
            </div>
          )}
        </TableCell>
        <TableCell className="text-right font-medium tabular-nums">
          {Number(product.base_price).toLocaleString()} VNĐ
        </TableCell>
        {isAdmin && (
          <>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {product.inventoryCost
                ? `${Number(product.inventoryCost).toLocaleString()} VNĐ`
                : '-'}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {product.costDiffFromLatestPo !== null &&
              product.costDiffFromLatestPo !== undefined ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`flex items-center gap-0.5 font-medium ${
                          product.costDiffFromLatestPo > 0
                            ? 'text-green-600 dark:text-green-400'
                            : product.costDiffFromLatestPo < 0
                              ? 'text-destructive'
                              : 'text-muted-foreground'
                        }`}
                      >
                        {product.costDiffFromLatestPo > 0 && <ArrowDown className="h-3 w-3" />}
                        {product.costDiffFromLatestPo < 0 && <ArrowUp className="h-3 w-3" />}
                        {Math.abs(Number(product.costDiffFromLatestPo)).toLocaleString()}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cost - Giá nhập gần nhất</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </TableCell>
            <TableCell>
              {(() => {
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
                              <span className={`flex items-center gap-0.5 text-xs font-medium tabular-nums ${
                                difference > 0
                                  ? 'text-destructive'
                                  : 'text-green-600 dark:text-green-400'
                              }`}>
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
                            <p>Chênh lệch: {difference > 0 ? '+' : ''}{Number(difference).toLocaleString()}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                }

                return <span className="text-muted-foreground text-xs">-</span>;
              })()}
            </TableCell>
          </>
        )}
        <TableCell>
          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
            <Button size="sm" variant="default" onClick={() => handleQuickPrint(10)}>
              10Kg
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleQuickPrint(5)}>
              5Kg
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsPrintModalOpen(true)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => onShow(product.id)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {isAdmin && onUpdatePrice && product.kiotviet_id &&
              product.costDiffFromLatestPo !== null &&
              product.costDiffFromLatestPo !== undefined &&
              product.costDiffFromLatestPo !== 0 && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isUpdating}
                  onClick={() => onUpdatePrice(product.kiotviet_id!)}
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
}, (prev, next) =>
  prev.product.id === next.product.id &&
  prev.product.base_price === next.product.base_price &&
  prev.product.costDiffFromLatestPo === next.product.costDiffFromLatestPo &&
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
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Chênh lệch</TableHead>
                  <TableHead>KV Status</TableHead>
                </>
              )}
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="w-10 h-10 rounded" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                {isAdmin && (
                  <>
                    <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  </>
                )}
                <TableCell><Skeleton className="h-8 w-32" /></TableCell>
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
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Sản phẩm</TableHead>
            <TableHead className="text-right">Giá bán</TableHead>
            {isAdmin && (
              <>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">
                  <button
                    onClick={onTogglePriceDiffSort}
                    className="flex items-center gap-1 ml-auto hover:text-foreground transition-colors cursor-pointer"
                  >
                    Chênh lệch
                    <ArrowUpDown className={`h-3 w-3 ${sortByPriceDifference ? 'text-foreground' : 'text-muted-foreground'}`} />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={onToggleKvStatusSort}
                    className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer"
                  >
                    KV Status
                    <ArrowUpDown className={`h-3 w-3 ${sortByKvStatus ? 'text-foreground' : 'text-muted-foreground'}`} />
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
  );
};

export default ProductListTable;
