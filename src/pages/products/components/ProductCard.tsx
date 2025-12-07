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
import { Badge } from '@/components/ui/badge';
// import { cn } from '@/lib/utils';
import {
  Eye,
  MoreHorizontal,
  Printer,
  UploadCloud,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { ProductCard as ProductCardType, ProductCardProps } from '@/types';
import { uploadImageToCloudinary, validateImageFile } from '@/lib/cloudinary';
import { toast } from 'sonner';

/**
 * Interface mở rộng cho ProductCard với price difference data
 */
interface ProductWithPriceDifference extends ProductCardType {
  priceDifference?: number | null;
  priceDifferencePercent?: number | null;
  inventoryCost?: number | null;
  latestPurchaseCost?: number | null;
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!product.kiotviet_id) {
        console.warn('Thiếu kiotviet_id để tạo public_id cho Cloudinary');
        return;
      }
      try {
        validateImageFile(file);
        setUploading(true);
        const res = await uploadImageToCloudinary({
          file,
          kiotvietId: product.kiotviet_id,
          // Set useCloudflareFunction=true để dùng Cloudflare Function (an toàn hơn)
          // API_SECRET sẽ không bị expose trong client bundle
          useCloudflareFunction: import.meta.env.PROD, // Tự động dùng Function ở production
        });
        console.log('Cloudinary uploaded:', res);
        toast.success('Upload ảnh thành công', {
          description: product.full_name || product.name,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Upload thất bại';
        console.error(msg);
        toast.error('Upload ảnh thất bại', { description: String(msg) });
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [product.kiotviet_id, product.full_name, product.name]
  );

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

  // Kiểm tra có price difference data không (từ price difference filter)
  const productWithPrice = product as ProductWithPriceDifference;
  const priceDifference = productWithPrice.priceDifference;
  const priceDifferencePercent = productWithPrice.priceDifferencePercent;
  const hasPriceDifference =
    priceDifference !== null && priceDifference !== undefined;

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

          {/* Overlay Labels */}
          <div className="absolute inset-0 flex flex-col justify-between p-3">
            {/* Top Label - Rice Type */}
            <div className="flex justify-between items-start">
              {/* Price Difference Badge */}
              {hasPriceDifference && (
                <Badge
                  variant={
                    priceDifference && priceDifference > 0
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="gap-1"
                >
                  {priceDifference && priceDifference > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span className="text-xs font-bold">
                    {priceDifference && priceDifference > 0 ? '+' : ''}
                    {priceDifference
                      ? Number(priceDifference).toLocaleString()
                      : '-'}
                  </span>
                  {priceDifferencePercent !== null &&
                    priceDifferencePercent !== undefined && (
                      <span className="text-xs">
                        ({priceDifferencePercent > 0 ? '+' : ''}
                        {Number(priceDifferencePercent).toFixed(1)}%)
                      </span>
                    )}
                </Badge>
              )}

              {/* Admin Edit Button - Chỉ render nếu isAdmin để tránh CanAccess check mỗi lần */}
              {isAdmin && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 will-change-[opacity]"
                    onClick={() => onShow?.(product.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {/* Upload test button */}
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onFileSelected}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 will-change-[opacity]"
                      onClick={triggerFileSelect}
                      disabled={uploading}
                      title={uploading ? 'Đang upload...' : 'Upload ảnh tạm'}
                    >
                      <UploadCloud className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
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

          {/* Price Difference Info (nếu có) */}
          {hasPriceDifference && (
            <div className="text-xs space-y-1 pt-2 border-t">
              <div className="flex justify-between text-muted-foreground">
                <span>Cost:</span>
                <span className="font-medium">
                  {productWithPrice.inventoryCost
                    ? Number(productWithPrice.inventoryCost).toLocaleString()
                    : '-'}{' '}
                  VNĐ
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Giá nhập:</span>
                <span className="font-medium">
                  {productWithPrice.latestPurchaseCost
                    ? Number(
                        productWithPrice.latestPurchaseCost
                      ).toLocaleString()
                    : '-'}{' '}
                  VNĐ
                </span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="p-4 pt-0">
          {/* Action Buttons */}
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
              variant="secondary"
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
