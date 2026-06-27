import React from 'react';
import { TemplateProduct, SelectedProduct } from '../hooks/useTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

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
            Chưa có đơn nhập hàng nào để đề xuất sản phẩm. Bạn vẫn có thể tạo
            đơn mới ngay trong KiotViet sau khi chọn nhà cung cấp.
          </div>
        ) : (
          <div className="divide-y">
            {templates.map((template, index) => {
              const selected = template.product_id
                ? selectedProducts[template.product_id]
                : undefined;
              const isSelected = !!selected;
              const uniqueKey = template.product_id
                ? `${selectedSupplierId}-${template.product_id}`
                : `template-${index}`;

              return (
                <div
                  key={uniqueKey}
                  className={cn(
                    'p-4 transition-opacity',
                    !isSelected && 'opacity-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {isSelected ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemoveProduct(template)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={() => onAddProduct(template)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}

                    {template.images && template.images.length > 0 && (
                      <div className="relative h-16 w-16 flex-shrink-0 rounded-md border overflow-hidden bg-muted">
                        <img
                          src={template.images[0]}
                          alt={template.product_name || 'Product'}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          onError={e => {
                            (e.target as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        {template.product_name || 'Không tên'}
                        {template.child_units &&
                          template.child_units.length > 0 && (
                            <span className="text-muted-foreground font-normal">
                              {' '}
                              ({template.child_units[0].unit})
                            </span>
                          )}
                      </p>
                      {template.order_template && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {template.order_template}
                        </p>
                      )}

                      {isSelected && selected && (
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            max={100}
                            value={selected.quantity}
                            onChange={event =>
                              onQuantityChange(
                                template.product_id,
                                Number(event.target.value)
                              )
                            }
                            placeholder="1"
                            className="h-8 w-16"
                          />
                          {template.master_unit &&
                            template.child_units &&
                            template.child_units.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ={' '}
                                {template.child_units[0].conversion_value *
                                  selected.quantity}{' '}
                                {template.master_unit}
                              </span>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
