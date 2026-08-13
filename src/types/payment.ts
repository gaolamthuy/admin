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
  id: string;
  provider: string;
  account_number: string | null;
  amount: number | null;
  currency: string | null;
  transaction_type: string | null;
  balance: number | null;
  ref: string | null;
  momo_ref: string | null;
  received_at: string | null;
  raw_body: unknown;
  created_at: string | null;
  test_trans: boolean | null;
  handle_status: string;
  handle_ref: string | null;
  handle_note: string | null;
  momo_extrafield: Record<string, unknown> | null;
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
  paymentId?: string;

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

  /**
   * Callback khi có INSERT event mới
   */
  onNewPayment?: (payment: Payment) => void;

  /**
   * Có hiển thị giao dịch test (test_trans = true) không
   * Mặc định: false
   * Admin có thể bật toggle để xem
   */
  showTestPayments?: boolean;
}
