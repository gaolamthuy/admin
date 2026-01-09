import React from 'react';
import { TemplateProduct, SelectedProduct } from '../hooks/useTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProductSelectorProps {
  templates: TemplateProduct[];
  loading: boolean;
  error: string | null;
  selectedProducts: Record<number, SelectedProduct>;
  selectedSupplierId: number | null | undefined;
  onRemoveProduct: (product: TemplateProduct) => void;
  onAddProduct: (product: TemplateProduct) => void;
  onRemoveAll: () => void;
  onQuantityChange: (productId: number, value: number) => void;
}

/**
 * Component hiển thị danh sách products để chọn từ templates
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  templates,
  loading,
  error,
  selectedProducts,
  selectedSupplierId,
  onRemoveProduct,
  onAddProduct,
  onRemoveAll,
  onQuantityChange,
}) => {
  // Tính số lượng products đã chọn
  const selectedCount = Object.keys(selectedProducts).length;
  const hasSelectedProducts = selectedCount > 0;
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {templates.length > 0 && hasSelectedProducts && (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRemoveAll}
              className="text-destructive hover:text-destructive"
            >
              <X className="mr-2 h-4 w-4" />
              Xóa tất cả ({selectedCount} sản phẩm)
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="rounded-md border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Chưa có đơn mua hàng nào để đề xuất sản phẩm. Bạn vẫn có thể tạo đơn
            mới ngay trong KiotViet sau khi chọn nhà cung cấp.
          </div>
        ) : (
          <div className="divide-y">
            {templates.map((template, index) => {
              const selected = template.product_id
                ? selectedProducts[template.product_id]
                : undefined;
              const isSelected = !!selected;
              // Use combination of supplier_id and product_id for unique key
              // Fallback to index if product_id is missing
              const uniqueKey = template.product_id
                ? `${selectedSupplierId}-${template.product_id}`
                : `template-${index}`;
              return (
                <div
                  key={uniqueKey}
                  className={cn(
                    'flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between transition-opacity',
                    !isSelected && 'opacity-50'
                  )}
                >
                  <div className="flex flex-1 items-start gap-3">
                    {/* ⭐ Mới: Nút X để xóa hoặc nút Thêm lại */}
                    {isSelected ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveProduct(template)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => onAddProduct(template)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    {/* ⭐ Mới: Hiển thị product image với hover để hiện ảnh to 300x300 */}
                    {template.images && template.images.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="relative h-16 w-16 flex-shrink-0 rounded-md border overflow-hidden bg-muted cursor-pointer">
                              <img
                                src={template.images[0]}
                                alt={template.product_name || 'Product'}
                                className="h-full w-full object-cover"
                                loading="lazy"
                                onError={e => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="w-[300px] h-[300px] p-0 border-0 bg-transparent shadow-none">
                            <img
                              src={template.images[0]}
                              alt={template.product_name || 'Product'}
                              className="w-[300px] h-[300px] object-cover rounded-md border shadow-lg"
                              loading="lazy"
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <div className="flex-1 max-w-md">
                      <p className="font-medium">
                        {template.product_name || 'Không tên'}
                      </p>
                      {/* ⭐ Mới: Hiển thị order_template */}
                      {template.order_template && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {template.order_template}
                        </p>
                      )}
                      {template.child_units &&
                        template.child_units.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {template.child_units.map((childUnit, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="text-xs"
                              >
                                {childUnit.unit}
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  {isSelected && selected && (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <div className="space-y-1">
                        <Label>
                          Số lượng{' '}
                          {template.child_units && template.child_units.length > 0
                            ? template.child_units[0].unit
                            : ''}
                        </Label>
                        <Input
                          type="number"
                          min={1}
                          value={selected.quantity}
                          onChange={event =>
                            onQuantityChange(
                              template.product_id,
                              Number(event.target.value)
                            )
                          }
                          placeholder="1"
                          className="w-32"
                        />
                        {/* ⭐ Mới: Hiển thị subtext = conversion_value * quantity (kg) */}
                        {template.master_unit &&
                          template.child_units &&
                          template.child_units.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              ={' '}
                              {template.child_units[0].conversion_value *
                                selected.quantity}{' '}
                              {template.master_unit}
                            </p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
