/**
 * API-related types and interfaces
 * Centralized API type definitions for Supabase and other services
 */

/**
 * Supabase response type
 * @interface SupabaseResponse
 * @template T - Response data type
 * @property {T | null} data - Response data
 * @property {Error | null} error - Error object
 */
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Supabase list response type
 * @interface SupabaseListResponse
 * @template T - Response data type
 * @property {T[]} data - Array of response data
 * @property {Error | null} error - Error object
 * @property {number} count - Total count
 */
export interface SupabaseListResponse<T> {
  data: T[];
  error: Error | null;
  count: number;
}

/**
 * Table query parameters
 * @interface TableQuery
 * @property {string} select - Select clause
 * @property {Record<string, unknown>} where - Where clause
 * @property {Record<string, unknown>} order - Order clause
 * @property {number} limit - Limit clause
 * @property {number} offset - Offset clause
 */
export interface TableQuery {
  select?: string;
  where?: Record<string, unknown>;
  order?: Record<string, unknown>;
  limit?: number;
  offset?: number;
}

/**
 * Table filter
 * @interface TableFilter
 * @property {string} column - Column name
 * @property {string} operator - Filter operator
 * @property {unknown} value - Filter value
 */
export interface TableFilter {
  column: string;
  operator: string;
  value: unknown;
}

/**
 * Create parameters type
 * @type CreateParams
 * @template T - Entity type
 */
export type CreateParams<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

/**
 * Update parameters type
 * @type UpdateParams
 * @template T - Entity type
 */
export type UpdateParams<T> = Partial<
  Omit<T, 'id' | 'created_at' | 'updated_at'>
>;

/**
 * Delete parameters
 * @interface DeleteParams
 * @property {string | number} id - Item ID to delete
 */
export interface DeleteParams {
  id: string | number;
}
