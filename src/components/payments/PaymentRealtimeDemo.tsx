/**
 * PaymentRealtimeDemo Component
 * Component demo để minh họa cách sử dụng usePaymentRealtime hook
 * 
 * @module components/payments/PaymentRealtimeDemo
 * 
 * @example
 * ```tsx
 * import { PaymentRealtimeDemo } from '@/components/payments/PaymentRealtimeDemo';
 * 
 * function App() {
 *   return <PaymentRealtimeDemo />;
 * }
 * ```
 */

import { useState } from 'react';
import { usePaymentRealtime } from '@/hooks/usePaymentRealtime';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

/**
 * Component demo realtime payments
 * Hiển thị danh sách payments và tự động cập nhật khi có thay đổi
 */
export function PaymentRealtimeDemo() {
  const [filterId, setFilterId] = useState<number | undefined>(undefined);
  const [eventTypes, setEventTypes] = useState<Array<'INSERT' | 'UPDATE' | 'DELETE'>>([
    'INSERT',
    'UPDATE',
    'DELETE',
  ]);

  const { payments, isConnected, error, count, refetch, reconnect } = usePaymentRealtime({
    paymentId: filterId,
    eventTypes,
    enabled: true,
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Realtime Demo</CardTitle>
              <CardDescription>
                Demo realtime updates từ table glt_payment
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isConnected ? 'default' : 'destructive'}>
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    Disconnected
                  </>
                )}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {count} payments
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refetch
            </Button>
            {!isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => reconnect()}
              >
                Reconnect
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterId(undefined)}
            >
              Show All
            </Button>
          </div>

          {/* Filter by ID */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Filter by ID:</label>
            <input
              type="number"
              className="w-32 px-3 py-1 border rounded-md"
              placeholder="Payment ID"
              value={filterId || ''}
              onChange={(e) =>
                setFilterId(
                  e.target.value ? parseInt(e.target.value, 10) : undefined
                )
              }
            />
          </div>

          {/* Event Types Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Listen to events:</label>
            <div className="flex gap-4">
              {(['INSERT', 'UPDATE', 'DELETE'] as const).map((eventType) => (
                <label key={eventType} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={eventTypes.includes(eventType)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEventTypes([...eventTypes, eventType]);
                      } else {
                        setEventTypes(
                          eventTypes.filter((et) => et !== eventType)
                        );
                      }
                    }}
                  />
                  <span className="text-sm">{eventType}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Payments ({count})</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments found. Try creating a payment in the database.
              </p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <Card key={payment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Payment #{payment.id}</p>
                        <pre className="text-sm text-muted-foreground overflow-auto">
                          {JSON.stringify(payment, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

