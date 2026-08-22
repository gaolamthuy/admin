/**
 * Dialog tìm kiếm sản phẩm (toàn bộ master products từ kv_products)
 * Multi-select → trả về TemplateProduct[] cho caller.
 * Dùng chung: thêm SP vào template NCC (admin) + thêm SP one-off vào đơn nhập.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ChildUnit, TemplateProduct } from '../hooks/useTemplates';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Check, PackageSearch } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasterProductRow {
  kiotviet_id: number;
  product_code: string | null;
  product_name: string | null;
  category_name: string | null;
  order_template: string | null;
  child_unit_info: Array<{ unit: string }> | null;
}

/**
 * Enrich danh sách product_id → TemplateProduct đầy đủ (child_units, master_unit).
 * Query kv_products 1 lần cho cả master + children.
 */
async function buildTemplateProducts(
  productIds: number[]
): Promise<TemplateProduct[]> {
  if (productIds.length === 0) return [];

  const { data, error } = await supabase
    .from('kv_products')
    .select(
      'kiotviet_id, code, full_name, unit, order_template, master_unit_id, base_price, conversion_value'
    )
    .or(
      `kiotviet_id.in.(${productIds.join(',')}),master_unit_id.in.(${productIds.join(',')})`
    );

  if (error) throw error;

  const rows = (data || []) as Array<{
    kiotviet_id: number;
    code: string | null;
    full_name: string | null;
    unit: string | null;
    order_template: string | null;
    master_unit_id: number | null;
    base_price: number | null;
    conversion_value: number | null;
  }>;

  const childUnitMap = new Map<number, ChildUnit[]>();
  const masterMap = new Map<number, (typeof rows)[number]>();

  rows.forEach(r => {
    if (r.master_unit_id !== null) {
      const list = childUnitMap.get(r.master_unit_id) ?? [];
      list.push({
        code: r.code ?? '',
        name: r.full_name ?? '',
        unit: r.unit ?? '',
        full_name: r.full_name ?? '',
        base_price: Number(r.base_price) || 0,
        kiotviet_id: r.kiotviet_id,
        conversion_value: Number(r.conversion_value) || 0,
        base_price_per_masterunit:
          r.conversion_value && Number(r.conversion_value) > 0
            ? Math.round(
                (Number(r.base_price) || 0) / Number(r.conversion_value)
              )
            : 0,
      });
      childUnitMap.set(r.master_unit_id, list);
    } else {
      masterMap.set(r.kiotviet_id, r);
    }
  });

  return productIds
    .filter(id => masterMap.has(id))
    .map(id => {
      const m = masterMap.get(id)!;
      return {
        product_id: m.kiotviet_id,
        product_code: m.code,
        product_name: (m.full_name || '').replace(/\s*\(kg\)\s*$/i, ''),
        last_purchase_date: null,
        order_template: m.order_template || null,
        images: null,
        child_units: childUnitMap.get(id) ?? null,
        master_unit: m.unit || null,
      };
    });
}

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Gọi khi bấm Thêm — nhận danh sách SP đã chọn (đã enrich) */
  onConfirm: (products: TemplateProduct[]) => void;
  /** Ẩn các SP đã có (VD: đã trong template / đã trong đơn) */
  excludeIds?: number[];
  title?: string;
}

export const ProductSearchDialog = ({
  open,
  onOpenChange,
  onConfirm,
  excludeIds = [],
  title = 'Thêm sản phẩm',
}: ProductSearchDialogProps) => {
  const [selected, setSelected] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['po-searchable-products'],
    queryFn: async (): Promise<MasterProductRow[]> => {
      // v_products_admin: đã filter master products; thêm is_active như trang sản phẩm
      const { data, error } = await supabase
        .from('v_products_admin')
        .select(
          'kiotviet_id, product_code, product_name, category_name, order_template, child_unit_info'
        )
        .eq('is_active', true)
        .order('category_name')
        .order('product_name');
      if (error) throw error;
      return (data || []) as MasterProductRow[];
    },
    staleTime: 5 * 60_000,
    enabled: open,
  });

  const excludeSet = useMemo(() => new Set(excludeIds), [excludeIds]);
  const visible = useMemo(
    () => products.filter(p => !excludeSet.has(p.kiotviet_id)),
    [products, excludeSet]
  );

  // Group theo category (giữ thứ tự alphabet theo tên category)
  const grouped = useMemo(() => {
    const map = new Map<string, MasterProductRow[]>();
    visible.forEach(p => {
      const key = p.category_name || 'Khác';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], 'vi')
    );
  }, [visible]);

  const toggle = (id: number) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const enriched = await buildTemplateProducts(selected);
      onConfirm(enriched);
      setSelected([]);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) setSelected([]);
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageSearch className="size-4 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Tìm theo tên hoặc mã sản phẩm, chọn rồi bấm Thêm
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-lg border">
          <CommandInput placeholder="Tên hoặc mã sản phẩm..." />
          <CommandList>
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <CommandEmpty>Không tìm thấy sản phẩm.</CommandEmpty>
                  {grouped.map(([category, items]) => (
                    <CommandGroup
                      key={category}
                      heading={category}
                      className="[&_[cmdk-group-heading]]:text-foreground"
                    >
                      {items.map(p => {
                        const isSelected = selected.includes(p.kiotviet_id);
                        const childUnits = p.child_unit_info
                          ?.map(c => c.unit)
                          .filter(Boolean)
                          .join(', ');
                        return (
                          <CommandItem
                            key={p.kiotviet_id}
                            value={`${p.product_name ?? ''} ${p.product_code ?? ''}`}
                            onSelect={() => toggle(p.kiotviet_id)}
                          >
                            <div
                              className={cn(
                                'mr-2 flex size-4 shrink-0 items-center justify-center rounded border',
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/40'
                              )}
                            >
                              {isSelected && <Check className="size-3" />}
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate">
                                {(p.product_name || '').replace(
                                  /\s*\(kg\)\s*$/i,
                                  ''
                                )}
                                {childUnits && (
                                  <span className="text-muted-foreground">
                                    {' '}
                                    ({childUnits})
                                  </span>
                                )}
                              </span>
                              {p.order_template && (
                                <span className="truncate text-xs text-muted-foreground">
                                  {p.order_template}
                                </span>
                              )}
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>

        <DialogFooter className="items-center sm:justify-between">
          <span className="text-sm text-muted-foreground">
            Đã chọn {selected.length} SP
          </span>
          <Button
            onClick={handleConfirm}
            disabled={selected.length === 0 || submitting}
          >
            Thêm {selected.length > 0 ? `(${selected.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
