import { Grid, List } from 'lucide-react';
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Props cho PurchaseOrderListView component
 */
interface PurchaseOrderListViewProps {
  viewMode: 'list' | 'card';
  onViewModeChange: (value: string) => void;
  children: React.ReactNode;
  selectedStatus: number | null;
  onStatusChange: (status: number | null) => void;
  selectedSupplier: number | null;
  onSupplierChange: (supplier: number | null) => void;
  isAdmin?: boolean;
}

/**
 * PurchaseOrderListView Component
 * Header với view mode toggle (List/Grid)
 */
export const PurchaseOrderListView: React.FC<PurchaseOrderListViewProps> = ({
  viewMode,
  onViewModeChange,
  children,
  selectedStatus: _selectedStatus, // eslint-disable-line @typescript-eslint/no-unused-vars
  onStatusChange: _onStatusChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  selectedSupplier: _selectedSupplier, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSupplierChange: _onSupplierChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  isAdmin = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Header với View Mode Toggle và Filter */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Danh sách đơn mua hàng</h2>

        {/* Right side: Filter + View Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Status Filter - Có thể thêm Select component sau */}
          {/* Supplier Filter - Có thể thêm Select component sau */}

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={onViewModeChange}>
            <TabsList
              className={`grid w-full ${isAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                <div className="hidden sm:block">Danh sách</div>
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="card" className="gap-2">
                  <Grid className="h-4 w-4" />
                  <div className="hidden sm:block">Thẻ</div>
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="mt-6">{children}</div>
    </div>
  );
};

export default PurchaseOrderListView;
