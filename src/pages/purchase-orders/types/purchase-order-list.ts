/**
 * Purchase Order List Types
 * Type definitions cho purchase order list functionality
 */

/**
 * Purchase Order interface
 * @interface PurchaseOrder
 */
export interface PurchaseOrder {
  id: number;
  kiotviet_id: number | null;
  retailer_id: number;
  code: string | null;
  description: string | null;
  branch_id: number | null;
  branch_name: string | null;
  supplier_id: number | null;
  supplier_name: string | null;
  supplier_code: string | null;
  purchase_by_id: number | null;
  purchase_name: string | null;
  purchase_date: string | null;
  discount: number | null;
  discount_ratio: number | null;
  total: number | null;
  total_payment: number | null;
  ex_return_suppliers: number | null;
  ex_return_third_party: number | null;
  status: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_date: string | null;
}

/**
 * Purchase Order Detail interface
 * @interface PurchaseOrderDetail
 */
export interface PurchaseOrderDetail {
  id: number;
  purchase_order_id: number;
  product_id: number | null;
  product_code: string | null;
  product_name: string | null;
  quantity: number | null;
  price: number | null;
  discount: number | null;
  batch_expire_id: number | null;
  batch_name: string | null;
  batch_expire_date: string | null;
  glt_note: string | null;
  glt_status: string | null;
  glt_admin_note: string | null;
}

/**
 * Purchase Order filter interface
 * @interface PurchaseOrderFilter
 */
export interface PurchaseOrderFilter {
  field: string;
  operator: 'eq' | 'null' | 'in' | 'contains' | 'gte' | 'lte';
  value: boolean | string | number | string[] | null;
}

/**
 * Purchase Order table filters state
 * @interface PurchaseOrderTableFilters
 */
export interface PurchaseOrderTableFilters {
  selectedStatus: number | null;
  selectedSupplier: number | null;
}

/**
 * Purchase Order actions interface
 * @interface PurchaseOrderActions
 */
export interface PurchaseOrderActions {
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}

/**
 * Purchase Order list view props
 * @interface PurchaseOrderListViewProps
 */
export interface PurchaseOrderListViewProps {
  viewMode: 'list' | 'card';
  purchaseOrders: Partial<PurchaseOrder>[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  table?: unknown; // Table instance for DataTable
}

/**
 * Purchase Order data table props
 * @interface PurchaseOrderDataTableProps
 */
export interface PurchaseOrderDataTableProps {
  purchaseOrders: PurchaseOrder[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}

/**
 * Purchase Order table configuration
 * @interface PurchaseOrderTableConfig
 * @deprecated Không còn dùng Refine, giữ lại để tương thích nếu cần
 */
export interface PurchaseOrderTableConfig {
  columns: unknown[];
  // refineCoreProps đã được remove vì không còn dùng Refine
}
