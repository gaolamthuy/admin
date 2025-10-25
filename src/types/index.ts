/**
 * Centralized type exports
 * Main barrel export for all types in the application
 */

// Environment types
export type { Environment } from '@/lib/env';

// Product types
export type { Product, ProductCard, Category, CategoryOption } from './product';

// Component prop types
export type {
  ProductCardProps,
  ProductCardGridProps,
  ProductListViewProps,
  ProductCategoryFilterProps,
} from './components';

// Filter types
export type {
  ProductFavoriteFilterProps,
  FavoriteFilterOption,
} from './filters';

// Common types
export type {
  BaseEntity,
  PaginationParams,
  PaginationMeta,
  ApiResponse,
  ApiError,
  ViewMode,
  SortOrder,
  FilterParams,
  SearchParams,
} from './common';

// Auth types
export { UserRole } from './auth';
export type { User, AuthState, LoginForm, RegisterForm } from './auth';

// API types
export type {
  SupabaseResponse,
  SupabaseListResponse,
  TableQuery,
  TableFilter,
  CreateParams,
  UpdateParams,
  DeleteParams,
} from './api';
