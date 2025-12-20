import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent, CardFooter, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// import { cn } from '@/lib/utils';
import { Eye, MoreHorizontal, Printer } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { ProductCard as ProductCardType, ProductCardProps } from '@/types';

/**
 * Interface mở rộng cho ProductCard với price difference data
 */
interface ProductWithPriceDifference extends ProductCardType {
  priceDifference?: number | null;
  priceDifferencePercent?: number | null;
  inventoryCost?: number | null;
  latestPurchaseCost?: number | null;
  latestPriceDifference?: number | null;
  latestPriceDifferencePercent?: number | null;
  costDiffFromLatestPo?: number | null; // inventory_cost - latest_total_cost_per_unit
}

/**
 * Helper function to generate N8N print URL
 */
const generatePrintUrl = (code: string, quantity: number): string => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return `${webhookUrl}/print?printType=label-product&code=${code}&quantity=${quantity}`;
};

/**
 * Helper function to generate priceboard URL
 */
const generatePriceboardUrl = (kiotvietId: number): string => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return `${webhookUrl}/print?printType=priceboard&kiotviet_id=${kiotvietId}`;
};

/**
 * Print Modal Component
 */
interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  productCode: string;
  productName: string;
  productFullName: string;
  kiotvietId?: number;
}

const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  productCode,
  productName,
  productFullName,
  kiotvietId,
}) => {
  const [loading, setLoading] = useState(false);
  const [customQuantity, setCustomQuantity] = useState<string>('');

  const handlePrint = async (quantity: number) => {
    setLoading(true);
    try {
      const url = generatePrintUrl(productCode, quantity);
      window.open(url, '_blank');
      onClose();
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePresetPrint = (quantity: number) => {
    handlePrint(quantity);
  };

  const handleCustomPrint = () => {
    const qty = parseInt(customQuantity) || 3; // Default to 3 if empty or invalid
    if (qty > 0 && qty <= 100) {
      handlePrint(qty);
      setCustomQuantity('');
    }
  };

  const handlePriceboard = () => {
    if (!kiotvietId) {
      console.warn('KiotViet ID is missing for priceboard print');
      return;
    }
    setLoading(true);
    try {
      const url = generatePriceboardUrl(kiotvietId);
      window.open(url, '_blank');
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
          {/* Preset Buttons và Custom Input */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Nhập số Kg:</Label>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handlePresetPrint(1)}
                variant="outline"
                disabled={loading}
                className="h-10"
              >
                1Kg
              </Button>
              <Button
                onClick={() => handlePresetPrint(2)}
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
                    if (e.key === 'Enter') handleCustomPrint();
                  }}
                  className="flex-1 max-w-15"
                />
                <Button
                  onClick={handleCustomPrint}
                  disabled={loading}
                  className="px-3"
                  variant="outline"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              </ButtonGroup>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Priceboard Section */}
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

/**
 * ProductCard Component
 * Advanced product card with dark theme, print functionality, and admin features
 * Optimized với React.memo để tránh re-render không cần thiết
 */
const ProductCardComponent: React.FC<
  ProductCardProps & { isAdmin?: boolean }
> = ({ product: productData, onShow, isAdmin = false }) => {
  const product = productData as ProductCardType;
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Memoize imageUrl và formattedPrice để tránh recalculate mỗi render
  const imageUrl = useMemo(
    () => product.images?.[0] || '/placeholder-product.png',
    [product.images]
  );
  const formattedPrice = useMemo(
    () =>
      new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
      }).format(product.base_price || 0),
    [product.base_price]
  );

  // Product với price difference data
  const productWithPrice = product as ProductWithPriceDifference;

  const handleQuickPrint = (quantity: number) => {
    if (!product.code) {
      console.warn('Product code is missing:', product);
      return;
    }
    const url = generatePrintUrl(product.code, quantity);
    window.open(url, '_blank');
  };

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 will-change-[shadow]">
        {/* Image Container with Overlay */}
        <div className="relative aspect-square overflow-hidden">
          {/* Product Image - Optimized loading */}
          <img
            src={imageUrl}
            alt={product.full_name || product.name || 'Product'}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            onError={e => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />

          {/* Overlay Labels - Đã bỏ badge chênh lệch giá */}
        </div>

        {/* Card Content */}
        <CardContent className="p-4 space-y-3">
          {/* Product Info */}
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm line-clamp-1">
              {product.full_name || product.name}
            </CardTitle>
            <span className="text-primary font-bold text-sm">
              {formattedPrice}
            </span>
          </div>

          {/* Admin Stats - Nằm dưới full_name (cost_diff_from_latest_po) */}
          {isAdmin && (
            <div className="text-xs pt-2 border-t">
              <div className="flex justify-between text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help underline decoration-dotted underline-offset-2">
                        Chênh lệch giá:
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Chênh lệch giá với đơn nhập gần nhất</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span
                  className={`font-medium ${
                    productWithPrice.costDiffFromLatestPo === null ||
                    productWithPrice.costDiffFromLatestPo === undefined
                      ? 'text-muted-foreground'
                      : productWithPrice.costDiffFromLatestPo > 0
                        ? 'text-green-600 dark:text-green-400'
                        : productWithPrice.costDiffFromLatestPo < 0
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                  }`}
                >
                  {productWithPrice.costDiffFromLatestPo === null ||
                  productWithPrice.costDiffFromLatestPo === undefined
                    ? '-'
                    : productWithPrice.costDiffFromLatestPo > 0
                      ? '+'
                      : ''}
                  {productWithPrice.costDiffFromLatestPo !== null &&
                    productWithPrice.costDiffFromLatestPo !== undefined &&
                    Number(
                      productWithPrice.costDiffFromLatestPo
                    ).toLocaleString()}{' '}
                  {productWithPrice.costDiffFromLatestPo !== null &&
                    productWithPrice.costDiffFromLatestPo !== undefined &&
                    'VNĐ'}
                </span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="p-4 pt-0 flex flex-col gap-3">
          {/* Line 1: Print Buttons - Tất cả users (In 10Kg, In 5Kg, ...) */}
          <div className="flex gap-2 justify-end w-full">
            {/* 10Kg Button */}
            <Button
              onClick={() => handleQuickPrint(10)}
              variant="default"
              size="sm"
            >
              In 10Kg
            </Button>

            {/* 5Kg Button */}
            <Button
              onClick={() => handleQuickPrint(5)}
              variant="outline"
              size="sm"
            >
              In 5Kg
            </Button>

            {/* Custom Print Button */}
            <Button
              onClick={() => setIsPrintModalOpen(true)}
              variant="ghost"
              size="sm"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Line 2: Admin Buttons - Chỉ admin thấy (Xem) */}
          {isAdmin && (
            <div className="flex gap-2 justify-end w-full pt-2 border-t border-border">
              {/* View Button */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShow?.(product.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Xem
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* Print Modal */}
      <PrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        productCode={product.code || ''}
        productName={product.name}
        productFullName={product.full_name || ''}
        kiotvietId={product.kiotviet_id}
      />
    </>
  );
};

/**
 * Memoized ProductCard để tránh re-render không cần thiết
 * Chỉ re-render khi product data hoặc onShow callback thay đổi
 */
export const ProductCard = React.memo(
  ProductCardComponent,
  (prevProps, nextProps) => {
    // Custom comparison: chỉ re-render nếu product data hoặc isAdmin thay đổi
    const prevProduct = prevProps.product;
    const nextProduct = nextProps.product;

    // So sánh các fields quan trọng
    return (
      prevProduct.id === nextProduct.id &&
      prevProduct.kiotviet_id === nextProduct.kiotviet_id &&
      prevProduct.base_price === nextProduct.base_price &&
      prevProduct.images?.[0] === nextProduct.images?.[0] &&
      prevProduct.full_name === nextProduct.full_name &&
      prevProduct.name === nextProduct.name &&
      prevProduct.glt_labelprint_favorite ===
        nextProduct.glt_labelprint_favorite &&
      prevProps.onShow === nextProps.onShow &&
      prevProps.isAdmin === nextProps.isAdmin
    );
  }
);

ProductCard.displayName = 'ProductCard';

export default ProductCard;
