import React, { useMemo, useState } from 'react';
import { SupplierOption } from '../hooks/useSuppliers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDaysAgo, formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';
import { Package, CalendarClock, Star } from 'lucide-react';

interface SupplierSelectorProps {
  suppliers: SupplierOption[];
  loading: boolean;
  error: string | null;
  selectedSupplier: SupplierOption | null;
  onSelect: (supplier: SupplierOption) => void;
  onToggleFavorite?: (supplier: SupplierOption) => void;
}

/**
 * Component hiển thị suppliers dạng card grid để chọn
 */
export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  suppliers,
  loading,
  error,
  selectedSupplier,
  onSelect,
  onToggleFavorite,
}) => {
  const [onlyFavorites, setOnlyFavorites] = useState(true);

  const hasAnyFavorite = suppliers.some(s => s.is_favorite);
  const showFavoritesOnly = onlyFavorites && hasAnyFavorite;
  const filtered = useMemo(
    () => (showFavoritesOnly ? suppliers.filter(s => s.is_favorite) : suppliers),
    [suppliers, showFavoritesOnly]
  );

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button
          variant={showFavoritesOnly ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => setOnlyFavorites(v => !v)}
          disabled={!hasAnyFavorite}
        >
          <Star
            className={cn(
              'h-4 w-4',
              showFavoritesOnly && 'fill-current'
            )}
          />
          Yêu thích
        </Button>
      </div>

      <ScrollArea className="h-[28rem] rounded-md border p-3">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(supplier => {
              const isActive =
                selectedSupplier?.kiotviet_id === supplier.kiotviet_id;
              const templateCount = supplier.po_template_products?.length ?? 0;
              return (
                <div
                  key={supplier.kiotviet_id}
                  className={cn(
                    'group relative flex flex-col gap-2 rounded-lg border p-4 transition-all hover:shadow-md hover:border-primary/40',
                    isActive
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'bg-card'
                  )}
                >
                  {/* Nút star toggle */}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      className="absolute right-2 top-2 z-10 rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-amber-500"
                      onClick={e => {
                        e.stopPropagation();
                        onToggleFavorite(supplier);
                      }}
                      title={
                        supplier.is_favorite
                          ? 'Bỏ yêu thích'
                          : 'Thêm yêu thích'
                      }
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          supplier.is_favorite &&
                            'fill-amber-400 text-amber-400'
                        )}
                      />
                    </button>
                  )}

                  <button
                    type="button"
                    className="flex flex-1 flex-col gap-2 text-left"
                    onClick={() => onSelect(supplier)}
                  >
                    <div className="flex items-start justify-between gap-2 pr-6">
                      <p className="font-medium leading-tight line-clamp-2">
                        {supplier.name || supplier.code || 'Không tên'}
                      </p>
                    </div>

                    {templateCount > 0 && (
                      <Badge variant="secondary" className="w-fit gap-1">
                        <Package className="h-3 w-3" />
                        {templateCount} SP
                      </Badge>
                    )}

                    {supplier.code && supplier.name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {supplier.code}
                      </p>
                    )}

                    <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                      {supplier.last_purchase_date ? (
                        <span>
                          {formatDate(supplier.last_purchase_date)}{' '}
                          <span className="text-foreground/60">
                            ({formatDaysAgo(supplier.last_purchase_date)})
                          </span>
                        </span>
                      ) : (
                        <span>Chưa có đơn nhập</span>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}

            {!loading && filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                {showFavoritesOnly
                  ? 'Chưa có supplier yêu thích nào.'
                  : 'Không có nhà cung cấp nào.'}
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
