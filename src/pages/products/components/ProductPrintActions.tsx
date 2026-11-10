/**
 * Product Print Actions
 * Bộ nút in nhãn nhanh (10Kg / 5Kg / số kg tùy chọn) + in bảng giá bán lẻ
 * Dùng trong header ProductShow
 *
 * @module pages/products/components/ProductPrintActions
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreHorizontal, Printer } from 'lucide-react';
import { getPrintUrl } from '@/lib/windmill';
import { submitPostForm } from '@/lib/print';

interface ProductPrintActionsProps {
  kiotvietId?: number;
  productName: string;
  productFullName?: string;
}

export const ProductPrintActions: React.FC<ProductPrintActionsProps> = ({
  kiotvietId,
  productName,
  productFullName,
}) => {
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [customQuantity, setCustomQuantity] = React.useState('');

  const handleQuickPrint = (qty: number) => {
    if (!kiotvietId) return;
    submitPostForm(getPrintUrl(), {
      printType: 'label-product',
      productId: String(kiotvietId),
      quantity: String(qty),
    });
  };

  const handlePrintCustom = (qty: number) => {
    if (!kiotvietId) return;
    setLoading(true);
    try {
      submitPostForm(getPrintUrl(), {
        printType: 'label-product',
        productId: String(kiotvietId),
        quantity: String(qty),
      });
      setIsPrintModalOpen(false);
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
      setIsPrintModalOpen(false);
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!kiotvietId) return null;

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="sm"
          variant="default"
          onClick={() => handleQuickPrint(10)}
        >
          10Kg
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleQuickPrint(5)}>
          5Kg
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="w-8 px-0"
          onClick={() => setIsPrintModalOpen(true)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              In nhãn sản phẩm
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold">Sản phẩm: </span>
              <span>{productName}</span>
              {productFullName && (
                <>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Mã: {productFullName}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Nhập số Kg:</Label>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePrintCustom(1)}
                  variant="outline"
                  disabled={loading}
                  className="h-10"
                >
                  1Kg
                </Button>
                <Button
                  onClick={() => handlePrintCustom(2)}
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
                        if (qty > 0 && qty <= 100) handlePrintCustom(qty);
                      }
                    }}
                    className="flex-1 max-w-15"
                  />
                  <Button
                    onClick={() => {
                      const qty = parseInt(customQuantity) || 3;
                      if (qty > 0 && qty <= 100) handlePrintCustom(qty);
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
              <Label className="text-sm font-semibold">
                In bảng giá bán lẻ:
              </Label>
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
    </>
  );
};

export default ProductPrintActions;
