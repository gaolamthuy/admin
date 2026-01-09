/**
 * Payment Types
 * Type definitions cho payment data structure
 * 
 * @module types/payment
 */

/**
 * Payment interface
 * Đại diện cho một payment record trong table glt_payment
 * 
 * @interface Payment
 */
export interface Payment {
  id: number;
  // Thêm các fields khác của table glt_payment ở đây
  // Ví dụ:
  // order_id?: number | null;
  // amount?: number | null;
  // status?: string | null;
  // payment_method?: string | null;
  // created_at?: string | null;
  // updated_at?: string | null;
  [key: string]: unknown; // Tạm thời dùng unknown cho các fields chưa biết
}

/**
 * Realtime event types từ Supabase
 * 
 * @type RealtimeEventType
 */
export type RealtimeEventType = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Realtime payload từ Supabase
 * 
 * @interface RealtimePayload
 */
export interface RealtimePayload<T = Payment> {
  eventType: RealtimeEventType;
  new?: T;
  old?: T;
  timestamp: string;
}

/**
 * Options cho usePaymentRealtime hook
 * 
 * @interface UsePaymentRealtimeOptions
 */
export interface UsePaymentRealtimeOptions {
  /**
   * Filter theo payment ID cụ thể
   * Nếu không có, sẽ listen tất cả payments
   */
  paymentId?: number;
  
  /**
   * Filter theo các event types muốn listen
   * Mặc định listen tất cả: INSERT, UPDATE, DELETE
   */
  eventTypes?: RealtimeEventType[];
  
  /**
   * Enable/disable realtime subscription
   * Mặc định: true
   */
  enabled?: boolean;
}


