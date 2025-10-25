/**
 * Common types and interfaces
 * Shared types used across the application
 */

/**
 * Base entity interface
 * @interface BaseEntity
 * @property {string | number} id - Unique identifier
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */
export interface BaseEntity {
  id: string | number;
  created_at: string;
  updated_at: string;
}

/**
 * Pagination parameters
 * @interface PaginationParams
 * @property {number} page - Current page number
 * @property {number} limit - Items per page
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Pagination metadata
 * @interface PaginationMeta
 * @property {number} total - Total items count
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
}

/**
 * Generic API response
 * @interface ApiResponse
 * @template T - Response data type
 * @property {T} data - Response data
 * @property {boolean} success - Success status
 * @property {string} message - Response message
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * API error response
 * @interface ApiError
 * @property {string} error - Error message
 * @property {number} code - Error code
 * @property {any} details - Error details
 */
export interface ApiError {
  error: string;
  code: number;
  details?: unknown;
}

/**
 * View mode type
 * @type ViewMode
 */
export type ViewMode = 'list' | 'card';

/**
 * Sort order type
 * @type SortOrder
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Filter parameters
 * @interface FilterParams
 */
export interface FilterParams {
  [key: string]: unknown;
}

/**
 * Search parameters
 * @interface SearchParams
 * @property {string} query - Search query
 * @property {FilterParams} filters - Filter parameters
 */
export interface SearchParams {
  query: string;
  filters: FilterParams;
}
