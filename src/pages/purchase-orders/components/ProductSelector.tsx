import React from 'react';
import { TemplateProduct, SelectedProduct } from '../hooks/useTemplates';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDaysAgo, formatDate } from '@/utils/date';

interface ProductSelectorProps {
  templates: TemplateProduct[];
  loading: boolean;
  error: string | null;
  selectedProducts: Record<number, SelectedProduct>;
  isSelectAll: boolean;
  selectedSupplierId: number | null | undefined;
  onToggleProduct: (product: TemplateProduct, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
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
  isSelectAll,
  selectedSupplierId,
  onToggleProduct,
  onSelectAll,
  onQuantityChange,
}) => {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {templates.length > 0 && (
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Checkbox checked={isSelectAll} onCheckedChange={onSelectAll} />
            <Label className="font-medium cursor-pointer">
              Chọn tất cả ({templates.length} sản phẩm)
            </Label>
          </div>
        </div>
      )}

      <ScrollArea className="h-72 rounded-md border">
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
              const isChecked = !!selected;
              // Use combination of supplier_id and product_id for unique key
              // Fallback to index if product_id is missing
              const uniqueKey = template.product_id
                ? `${selectedSupplierId}-${template.product_id}`
                : `template-${index}`;
              return (
                <div
                  key={uniqueKey}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-1 items-start gap-3">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={checked =>
                        onToggleProduct(template, Boolean(checked))
                      }
                    />
                    <div>
                      <p className="font-medium">
                        {template.product_name || 'Không tên'}
                      </p>
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
                      {template.last_purchase_date ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          Lần cuối: {formatDate(template.last_purchase_date)} (
                          {formatDaysAgo(template.last_purchase_date)})
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Chưa có lịch sử mua hàng
                        </p>
                      )}
                    </div>
                  </div>

                  {isChecked && selected && (
                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                      <div className="space-y-1">
                        <Label>Số lượng</Label>
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
                          className="w-32"
                        />
                        {/* Hiển thị quy đổi nếu có child_units */}
                        {template.child_units &&
                          template.child_units.length > 0 &&
                          template.child_units.map((childUnit, idx) => {
                            // Tính quy đổi: số lượng đơn vị chính (kg) / conversion_value = số lượng đơn vị con (bao)
                            // Ví dụ: 100 kg / 50 = 2 bao (nếu conversion_value = 50)
                            const convertedQuantity =
                              selected.quantity / childUnit.conversion_value;
                            // Hiển thị số nguyên nếu không có phần thập phân, ngược lại hiển thị 2 chữ số thập phân
                            const displayQuantity = Number.isInteger(
                              convertedQuantity
                            )
                              ? convertedQuantity.toString()
                              : convertedQuantity.toFixed(2);
                            return (
                              <p
                                key={idx}
                                className="text-xs text-muted-foreground mt-0.5"
                              >
                                = {displayQuantity} {childUnit.unit}
                              </p>
                            );
                          })}
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
