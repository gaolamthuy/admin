/**
 * usePaymentRealtime Hook
 * Hook để listen realtime changes từ table glt_payment trên Supabase
 *
 * Sử dụng Supabase Realtime để tự động cập nhật UI khi có thay đổi trong database
 *
 * @module hooks/usePaymentRealtime
 *
 * @example
 * ```tsx
 * // Listen tất cả payments
 * const { payments, isConnected, error } = usePaymentRealtime();
 *
 * // Listen một payment cụ thể
 * const { payments, isConnected } = usePaymentRealtime({
 *   paymentId: 123
 * });
 *
 * // Chỉ listen INSERT và UPDATE events
 * const { payments } = usePaymentRealtime({
 *   eventTypes: ['INSERT', 'UPDATE']
 * });
 * ```
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type {
  Payment,
  RealtimeEventType,
  RealtimePayload,
  UsePaymentRealtimeOptions,
} from '@/types/payment';

/**
 * Return type cho usePaymentRealtime hook
 *
 * @interface UsePaymentRealtimeReturn
 */
export interface UsePaymentRealtimeReturn {
  /**
   * Danh sách payments hiện tại
   * Tự động cập nhật khi có thay đổi từ database
   */
  payments: Payment[];

  /**
   * Trạng thái kết nối WebSocket
   * true = đã kết nối, false = chưa kết nối hoặc đã disconnect
   */
  isConnected: boolean;

  /**
   * Error nếu có lỗi xảy ra
   */
  error: Error | null;

  /**
   * Số lượng payments hiện tại
   */
  count: number;

  /**
   * Function để manually refetch payments từ database
   * Hữu ích khi muốn sync lại data sau khi mất kết nối
   */
  refetch: () => Promise<void>;

  /**
   * Function để manually subscribe lại
   * Hữu ích khi muốn reconnect sau khi disconnect
   */
  reconnect: () => void;
}

/**
 * Hook để listen realtime changes từ table glt_payment
 *
 * @param options - Options để configure realtime subscription
 * @returns Object chứa payments data, connection status, và helper functions
 *
 * @remarks
 * - Hook này tự động subscribe khi component mount và unsubscribe khi unmount
 * - Khi có thay đổi trong database, payments array sẽ tự động cập nhật
 * - Nếu mất kết nối, hook sẽ tự động thử reconnect (với exponential backoff)
 * - Cần đảm bảo Supabase Realtime đã được enable cho table glt_payment
 */
export function usePaymentRealtime(
  options: UsePaymentRealtimeOptions = {}
): UsePaymentRealtimeReturn {
  const {
    paymentId,
    eventTypes = ['INSERT', 'UPDATE', 'DELETE'],
    enabled = true,
  } = options;

  // State management
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs để track subscription và prevent memory leaks
  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  /**
   * Fetch initial payments từ database
   * Được gọi khi component mount hoặc khi refetch manually
   */
  const fetchPayments = useCallback(async () => {
    try {
      let query = supabase
        .from('glt_payment')
        .select('*')
        .order('created_at', { ascending: false });

      // Nếu có paymentId, filter theo ID
      if (paymentId) {
        query = query.eq('id', paymentId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      if (isMountedRef.current) {
        setPayments((data || []) as Payment[]);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error ? err : new Error('Failed to fetch payments')
        );
        console.error('Error fetching payments:', err);
      }
    }
  }, [paymentId]);

  /**
   * Xử lý khi nhận được realtime event từ Supabase
   *
   * @param payload - Realtime payload từ Supabase
   */
  const handleRealtimeEvent = useCallback(
    (payload: {
      eventType: RealtimeEventType;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      setPayments(currentPayments => {
        const updatedPayments = [...currentPayments];

        switch (eventType) {
          case 'INSERT':
            // Thêm payment mới vào đầu danh sách
            if (newRecord) {
              // Nếu có paymentId filter, chỉ thêm nếu match
              if (!paymentId || (newRecord.id as number) === paymentId) {
                updatedPayments.unshift(newRecord as Payment);
              }
            }
            break;

          case 'UPDATE':
            // Cập nhật payment existing
            if (newRecord) {
              const index = updatedPayments.findIndex(
                p => p.id === (newRecord.id as number)
              );
              if (index !== -1) {
                updatedPayments[index] = newRecord as Payment;
              } else if (!paymentId || (newRecord.id as number) === paymentId) {
                // Nếu không tìm thấy trong list hiện tại, thêm vào
                updatedPayments.unshift(newRecord as Payment);
              }
            }
            break;

          case 'DELETE':
            // Xóa payment khỏi danh sách
            if (oldRecord) {
              const index = updatedPayments.findIndex(
                p => p.id === (oldRecord.id as number)
              );
              if (index !== -1) {
                updatedPayments.splice(index, 1);
              }
            }
            break;
        }

        return updatedPayments;
      });
    },
    [paymentId]
  );

  /**
   * Subscribe vào Supabase Realtime channel
   *
   * @returns Channel instance để có thể unsubscribe sau
   */
  const subscribe = useCallback(() => {
    // Cleanup subscription cũ nếu có
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Tạo channel name dựa trên options
    const channelName = paymentId
      ? `glt_payment:${paymentId}`
      : 'glt_payment:all';

    // Tạo Realtime channel
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen tất cả events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'glt_payment',
          ...(paymentId && { filter: `id=eq.${paymentId}` }),
        },
        payload => {
          const eventType = payload.eventType as RealtimeEventType;

          // Chỉ xử lý nếu event type nằm trong danh sách muốn listen
          if (eventTypes.includes(eventType)) {
            handleRealtimeEvent({
              eventType,
              new: payload.new as Record<string, unknown> | undefined,
              old: payload.old as Record<string, unknown> | undefined,
            });
          }
        }
      )
      .subscribe(status => {
        if (isMountedRef.current) {
          setIsConnected(status === 'SUBSCRIBED');

          if (status === 'SUBSCRIBED') {
            // Reset reconnect attempts khi đã connect thành công
            reconnectAttemptsRef.current = 0;
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            // Thử reconnect nếu có lỗi
            scheduleReconnect();
          }
        }
      });

    channelRef.current = channel;
    return channel;
  }, [paymentId, eventTypes, handleRealtimeEvent]);

  /**
   * Schedule reconnect với exponential backoff
   * Tránh reconnect quá nhiều lần liên tiếp
   */
  const scheduleReconnect = useCallback(() => {
    // Clear timeout cũ nếu có
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Tính delay với exponential backoff (max 30 giây)
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      30000
    );
    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current && enabled) {
        console.log(
          `🔄 Attempting to reconnect... (attempt ${reconnectAttemptsRef.current})`
        );
        subscribe();
      }
    }, delay);
  }, [enabled, subscribe]);

  /**
   * Manually refetch payments từ database
   */
  const refetch = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  /**
   * Manually reconnect realtime subscription
   */
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0; // Reset attempts
    subscribe();
  }, [subscribe]);

  // Effect để setup subscription khi component mount
  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setIsConnected(false);
      return;
    }

    // Fetch initial data
    fetchPayments();

    // Subscribe vào realtime
    subscribe();

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      // Clear reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Unsubscribe từ channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setIsConnected(false);
    };
  }, [enabled, fetchPayments, subscribe]);

  return {
    payments,
    isConnected,
    error,
    count: payments.length,
    refetch,
    reconnect,
  };
}
