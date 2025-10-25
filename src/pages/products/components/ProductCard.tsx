import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Edit, MoreHorizontal, Printer } from 'lucide-react';
import React, { useState } from 'react';
import { ProductCard as ProductCardType, ProductCardProps } from '@/types';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { CanAccess } from '@/components/auth/CanAccess';

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
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  product: productData,
  onEdit,
}) => {
  const product = productData as ProductCardType;
  const { isAdmin } = useIsAdmin();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const imageUrl = product.images?.[0] || '/placeholder-product.png';
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.base_price || 0);

  const handleQuickPrint = (quantity: number) => {
    if (!product.code) {
      console.warn('Product code is missing:', product);
      return;
    }
    const url = generatePrintUrl(product.code, quantity);
    console.log(
      'Print URL:',
      url,
      'Product Code:',
      product.code,
      'Product:',
      product
    );
    window.open(url, '_blank');
  };

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Image Container with Overlay */}
        <div className="relative aspect-square overflow-hidden">
          {/* Product Image */}
          <img
            src={imageUrl}
            alt={product.full_name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={e => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />

          {/* Overlay Labels */}
          <div className="absolute inset-0 flex flex-col justify-between p-3">
            {/* Top Label - Rice Type */}
            <div className="flex justify-between items-start">
              {/* Admin Edit Button */}
              <CanAccess requireAdmin>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onEdit?.(product.id)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </CanAccess>
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

export default ProductCard;
