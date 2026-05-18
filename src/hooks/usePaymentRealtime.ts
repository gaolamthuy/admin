/**
 * usePaymentRealtime Hook
 * Hook để listen changes từ table glt_payment trên Neon
 *
 * Sử dụng polling để tự động cập nhật UI khi có thay đổi trong database
 * TODO: Implement WebSocket realtime khi Neon hỗ trợ postgres_changes
 *
 * @module hooks/usePaymentRealtime
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { client } from '@/lib/neon';
import type {
  Payment,
  UsePaymentRealtimeOptions,
} from '@/types/payment';

export interface UsePaymentRealtimeReturn {
  payments: Payment[];
  isConnected: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
  reconnect: () => void;
}

const POLL_INTERVAL = 10_000;

export function usePaymentRealtime(
  options: UsePaymentRealtimeOptions = {}
): UsePaymentRealtimeReturn {
  const {
    paymentId,
    enabled = true,
  } = options;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const fetchPayments = useCallback(async () => {
    try {
      let query = client
        .from('glt_payment')
        .select('*')
        .order('created_at', { ascending: false });

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
        setIsConnected(true);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch payments'));
        setIsConnected(false);
        console.error('Error fetching payments:', err);
      }
    }
  }, [paymentId]);

  const refetch = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  const reconnect = useCallback(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      setIsConnected(false);
      return;
    }

    fetchPayments();

    intervalRef.current = window.setInterval(fetchPayments, POLL_INTERVAL);

    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };
  }, [enabled, fetchPayments]);

  return {
    payments,
    isConnected,
    error,
    count: payments.length,
    refetch,
    reconnect,
  };
}
