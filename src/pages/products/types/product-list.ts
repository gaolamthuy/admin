/**
 * Product List Types
 * Type definitions cho product list functionality
 */

import { Product } from '@/types';

/**
 * Product filter interface
 * @interface ProductFilter
 */
export interface ProductFilter {
  field: string;
  operator: 'eq' | 'null' | 'in' | 'contains' | 'gte' | 'lte';
  value: boolean | string | number | string[] | null;
}

/**
 * Product table filters state
 * @interface ProductTableFilters
 */
export interface ProductTableFilters {
  selectedCategory: string | null;
  isFavorite: boolean;
  isActive: boolean;
}

/**
 * Product actions interface
 * @interface ProductActions
 */
export interface ProductActions {
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}

/**
 * Product list view props
 * @interface ProductListViewProps
 */
export interface ProductListViewProps {
  viewMode: 'list' | 'card';
  products: Partial<Product>[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
  table?: unknown; // Table instance for DataTable
}

/**
 * Product data table props
 * @interface ProductDataTableProps
 */
export interface ProductDataTableProps {
  products: Product[];
  loading: boolean;
  isAdmin: boolean;
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}

/**
 * Product card grid props
 * @interface ProductCardGridProps
 */
export interface ProductCardGridProps {
  products: Product[];
  loading: boolean;
  onEdit: (id: string | number) => void;
  onShow: (id: string | number) => void;
  onDelete: (id: string | number) => void;
}

/**
 * Product table configuration
 * @interface ProductTableConfig
 * @deprecated Không còn dùng Refine, giữ lại để tương thích nếu cần
 */
export interface ProductTableConfig {
  columns: unknown[];
  // refineCoreProps đã được remove vì không còn dùng Refine
}
