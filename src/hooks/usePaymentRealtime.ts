/**
 * usePaymentRealtime Hook
 * Listen realtime changes từ table glt_payment trên Supabase
 *
 * @module hooks/usePaymentRealtime
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type {
  Payment,
  RealtimeEventType,
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

const DEFAULT_EVENT_TYPES: RealtimeEventType[] = ['INSERT', 'UPDATE', 'DELETE'];

export function usePaymentRealtime(
  options: UsePaymentRealtimeOptions = {}
): UsePaymentRealtimeReturn {
  const {
    paymentId,
    eventTypes = DEFAULT_EVENT_TYPES,
    enabled = true,
    onNewPayment,
    showTestPayments = true,
  } = options;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  const onNewPaymentRef = useRef(onNewPayment);
  const eventTypesRef = useRef(eventTypes);
  const paymentIdRef = useRef(paymentId);
  const enabledRef = useRef(enabled);
  const showTestPaymentsRef = useRef(showTestPayments);

  useEffect(() => {
    onNewPaymentRef.current = onNewPayment;
  }, [onNewPayment]);

  useEffect(() => {
    eventTypesRef.current = eventTypes;
  }, [eventTypes]);

  useEffect(() => {
    showTestPaymentsRef.current = showTestPayments;
  }, [showTestPayments]);

  const fetchPayments = useCallback(async () => {
    try {
      let query = supabase
        .from('glt_payment')
        .select('*')
        .order('received_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (paymentIdRef.current) {
        query = query.eq('id', paymentIdRef.current);
      }

      if (!showTestPaymentsRef.current) {
        query = query.eq('test_trans', false);
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
  }, []);

  const handleRealtimeEvent = useCallback(
    (payload: {
      eventType: RealtimeEventType;
      new?: Record<string, unknown>;
      old?: Record<string, unknown>;
    }) => {
      const { eventType, new: newRecord } = payload;

      if (
        !showTestPaymentsRef.current &&
        newRecord &&
        (newRecord as Record<string, unknown>).test_trans === true
      ) {
        return;
      }

      if (eventType === 'INSERT' && newRecord && onNewPaymentRef.current) {
        onNewPaymentRef.current(newRecord as unknown as Payment);
      }

      setPayments(currentPayments => {
        const updatedPayments = [...currentPayments];

        switch (eventType) {
          case 'INSERT':
            if (newRecord) {
              updatedPayments.unshift(newRecord as unknown as Payment);
            }
            break;

          case 'UPDATE':
            if (newRecord) {
              const index = updatedPayments.findIndex(
                p => p.id === newRecord.id
              );
              if (index !== -1) {
                updatedPayments[index] = newRecord as unknown as Payment;
              } else {
                updatedPayments.unshift(newRecord as unknown as Payment);
              }
            }
            break;

          case 'DELETE':
            if (payload.old) {
              const index = updatedPayments.findIndex(
                p => p.id === (payload.old?.id as string)
              );
              if (index !== -1) {
                updatedPayments.splice(index, 1);
              }
            }
            break;
        }

        return updatedPayments.slice(0, 50);
      });
    },
    []
  );

  const subscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel('glt_payment:soundbox')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'glt_payment',
        },
        payload => {
          const eventType = payload.eventType as RealtimeEventType;

          if (eventTypesRef.current.includes(eventType)) {
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
            reconnectAttemptsRef.current = 0;
            setError(null);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            scheduleReconnect();
          }
        }
      });

    channelRef.current = channel;
    return channel;
  }, [handleRealtimeEvent]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      30000
    );
    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = window.setTimeout(() => {
      if (isMountedRef.current && enabledRef.current) {
        console.log(
          `🔄 Reconnecting... (attempt ${reconnectAttemptsRef.current})`
        );
        subscribe();
      }
    }, delay);
  }, [subscribe]);

  const refetch = useCallback(async () => {
    await fetchPayments();
  }, [fetchPayments]);

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    subscribe();
  }, [subscribe]);

  useEffect(() => {
    isMountedRef.current = true;
    enabledRef.current = enabled;
    paymentIdRef.current = paymentId;

    if (!enabled) {
      setIsConnected(false);
      return;
    }

    fetchPayments();
    subscribe();

    return () => {
      isMountedRef.current = false;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      setIsConnected(false);
    };
  }, [enabled, paymentId, showTestPayments, fetchPayments, subscribe]);

  return {
    payments,
    isConnected,
    error,
    count: payments.length,
    refetch,
    reconnect,
  };
}
