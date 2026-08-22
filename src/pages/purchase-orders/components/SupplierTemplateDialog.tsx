/**
 * Dialog soạn template SP nhập hàng cho 1 NCC (chỉ admin)
 * - Xem list SP hiện có + xóa từng SP
 * - Thêm SP qua ProductSearchDialog
 * Mọi thay đổi lưu Supabase tức thì (không nút Save chung).
 */
import { useMemo, useState } from 'react';
import { SupplierOption } from '../hooks/useSuppliers';
import { useSupplierPoTemplate } from '../hooks/useSupplierPoTemplate';
import { ProductSearchDialog } from './ProductSearchDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { ListChecks, Loader2, Plus, Trash2 } from 'lucide-react';

interface SupplierTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: SupplierOption | null;
}

export const SupplierTemplateDialog = ({
  open,
  onOpenChange,
  supplier,
}: SupplierTemplateDialogProps) => {
  const [searchOpen, setSearchOpen] = useState(false);

  const supplierId = open ? (supplier?.kiotviet_id ?? null) : null;

  const { templates, loading, addProducts, removeProduct } =
    useSupplierPoTemplate(supplierId, supplier?.po_template_products);

  const templateIds = useMemo(
    () => templates.map(t => t.product_id),
    [templates]
  );

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="size-4 text-primary" />
            Template nhập hàng
          </DialogTitle>
          <DialogDescription>
            {supplier.name || supplier.code} — danh sách SP chuẩn khi tạo đơn
            nhập
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{templates.length} SP</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSearchOpen(true)}
            disabled={addProducts.isPending}
          >
            <Plus className="mr-1.5 size-3.5" />
            Thêm sản phẩm
          </Button>
        </div>

        <ScrollArea className="h-72 rounded-md border">
          {loading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : templates.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Template trống. Bấm "Thêm sản phẩm" để soạn danh sách chuẩn cho
              nhà cung cấp này.
            </p>
          ) : (
            <div className="divide-y">
              {templates.map(t => (
                <div
                  key={t.product_id}
                  className="flex items-center gap-2 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {t.product_name || 'Không tên'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.product_code}
                      {t.child_units && t.child_units.length > 0
                        ? ` · ${t.child_units[0].unit}`
                        : t.master_unit
                          ? ` · ${t.master_unit}`
                          : ''}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeProduct.mutate(t.product_id)}
                    disabled={removeProduct.isPending}
                    title="Xóa khỏi template"
                  >
                    {removeProduct.isPending &&
                    removeProduct.variables === t.product_id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <ProductSearchDialog
          open={searchOpen}
          onOpenChange={setSearchOpen}
          excludeIds={templateIds}
          title={`Thêm SP vào template ${supplier.name || supplier.code || ''}`}
          onConfirm={products => {
            addProducts.mutate(products.map(p => p.product_id));
          }}
        />
      </DialogContent>
    </Dialog>
  );
};
