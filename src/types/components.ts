/**
 * Component prop types and interfaces
 * Centralized prop type definitions for all components
 */

import type { ProductCard, ProductCategoryFilterProps } from './product';

/**
 * ProductCard component props
 * @interface ProductCardProps
 * @property {ProductCard} product - Product data to display
 * @property {(id: string) => void} onShow - Show/View button callback
 * @property {(id: string) => void} onDelete - Delete button callback
 */
export interface ProductCardProps {
  product: ProductCard;
  onShow?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * ProductCardGrid component props
 * @interface ProductCardGridProps
 * @property {ProductCard[]} products - Array of products to display
 * @property {boolean} loading - Loading state
 * @property {(id: string) => void} onEdit - Edit button callback
 * @property {(id: string) => void} onDelete - Delete button callback
 * @property {(id: string) => void} onShow - Show/View button callback
 */
export interface ProductCardGridProps {
  products: ProductCard[];
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onShow?: (id: string) => void;
}

/**
 * ProductListView component props
 * @interface ProductListViewProps
 * @property {"list" | "card"} viewMode - Current view mode
 * @property {(value: string) => void} onViewModeChange - View mode change callback (Tabs compatible)
 * @property {React.ReactNode} children - Child components
 * @property {string | null} selectedCategory - Selected category filter
 * @property {(category: string | null) => void} onCategoryChange - Category filter change callback
 * @property {boolean} isFavorite - Favorite filter state
 * @property {(favorite: boolean) => void} onFavoriteChange - Favorite filter change callback
 * @property {boolean} isAdmin - Admin status to show/hide list view tab
 */
export interface ProductListViewProps {
  viewMode: 'list' | 'card';
  onViewModeChange: (value: string) => void;
  children: React.ReactNode;
  selectedCategory?: string | null;
  onCategoryChange?: (category: string | null) => void;
  isFavorite?: boolean;
  onFavoriteChange?: (favorite: boolean) => void;
  isAdmin?: boolean;
}

// ProductCategoryFilterProps is exported from product.ts
export type { ProductCategoryFilterProps };
