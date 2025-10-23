/**
 * Product related types and interfaces
 * Các types và interfaces liên quan đến sản phẩm
 */

import { Database } from "../lib/supabase";

// ===== DATABASE TYPES =====

/**
 * Product type từ database
 */
export type Product = Database["public"]["Tables"]["kv_products"]["Row"];

/**
 * Product category type từ database
 */
export type ProductCategory =
  Database["public"]["Tables"]["kv_product_categories"]["Row"];

// ===== COMPONENT PROPS TYPES =====

/**
 * Props cho ProductCard component
 */
export interface ProductCardProps {
  product: Product & {
    images?: string[];
    kv_product_categories?: ProductCategory;
  };
  loading?: boolean;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  imagePlaceholder: string;
  formatPrice: (price?: number) => string;
}

/**
 * Props cho ProductDataView component
 */
export interface ProductDataViewProps {
  viewMode: "table" | "card";
  tableProps: {
    dataSource?: any[];
    loading?: boolean;
    [key: string]: any;
  };
  imagePlaceholder: string;
  formatPrice: (price?: number) => string;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Props cho ProductCategoryFilter component
 */
export interface ProductCategoryFilterProps {
  value?: string | null;
  onChange?: (categoryId: string | null) => void;
  style?: React.CSSProperties;
  allowClear?: boolean;
  placeholder?: string;
}

// ===== UTILITY TYPES =====

/**
 * Category option cho dropdown
 */
export interface CategoryOption {
  id: string;
  name?: string | null;
}

/**
 * Table column configuration
 */
export interface TableColumn {
  title: string;
  dataIndex: string;
  key: string;
  render?: (value: any, record: any) => React.ReactNode;
}
