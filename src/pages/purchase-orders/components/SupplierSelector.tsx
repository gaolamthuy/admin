import React from 'react';
import { SupplierOption } from '../hooks/useSuppliers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatDaysAgo, formatDate } from '@/utils/date';
import { cn } from '@/lib/utils';

interface SupplierSelectorProps {
  suppliers: SupplierOption[];
  loading: boolean;
  error: string | null;
  selectedSupplier: SupplierOption | null;
  onSelect: (supplier: SupplierOption) => void;
}

/**
 * Component hiển thị danh sách suppliers để chọn
 */
export const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  suppliers,
  loading,
  error,
  selectedSupplier,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollArea className="h-96 rounded-md border">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {suppliers.map(supplier => {
              const isActive =
                selectedSupplier?.kiotviet_id === supplier.kiotviet_id;
              return (
                <button
                  key={supplier.kiotviet_id}
                  type="button"
                  className={cn(
                    'w-full p-4 text-left hover:bg-muted transition-colors',
                    isActive && 'bg-primary/5'
                  )}
                  onClick={() => onSelect(supplier)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {supplier.name || supplier.code || 'Không tên'}
                      </p>
                      {supplier.last_purchase_date ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          Lần cuối: {formatDate(supplier.last_purchase_date)} (
                          {formatDaysAgo(supplier.last_purchase_date)})
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          Chưa có đơn mua hàng
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {!loading && suppliers.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">
                Không có nhà cung cấp nào.
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
