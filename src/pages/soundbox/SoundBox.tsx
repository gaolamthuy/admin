import { useCallback, useState, useRef } from 'react';
import {
  Inbox,
  TrendingUp,
  Receipt,
  CalendarDays,
  LayoutList,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import { usePaymentRealtime } from '@/hooks/usePaymentRealtime';
import { usePaymentAnnouncer } from '@/hooks/usePaymentAnnouncer';
import { useIsAdmin } from '@/hooks/useAuth';
import { Clock } from './components/Clock';
import { isMuted } from './components/MuteToggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Payment } from '@/types/payment';
import { formatVND } from '@/lib/format';
import { formatDateTimeWithSeconds, formatTimeAgo } from '@/utils/date';
import { cn } from '@/lib/utils';

function SoundBox() {
  const [filterToday, setFilterToday] = useState(true);
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [muted, setMuted] = useState(isMuted());
  const highlightTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const { announcePayment } = usePaymentAnnouncer();
  const { isAdmin } = useIsAdmin();

  const handleNewPayment = useCallback(
    (payment: Payment) => {
      announcePayment(payment);

      setHighlightedIds((prev) => new Set(prev).add(payment.id));
      const existing = highlightTimeouts.current.get(payment.id);
      if (existing) clearTimeout(existing);
      highlightTimeouts.current.set(
        payment.id,
        setTimeout(() => {
          setHighlightedIds((prev) => {
            const next = new Set(prev);
            next.delete(payment.id);
            return next;
          });
          highlightTimeouts.current.delete(payment.id);
        }, 4000)
      );
    },
    [announcePayment]
  );

  const { payments, isConnected } = usePaymentRealtime({
    enabled: true,
    onNewPayment: handleNewPayment,
    showTestPayments: isAdmin,
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) =>
    p.received_at?.startsWith(todayStr)
  );
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const displayedPayments = filterToday ? todayPayments : payments;

  const handleTestVoice = () => {
    announcePayment({
      id: 'test',
      provider: 'TCB',
      account_number: null,
      amount: 1500000,
      currency: 'VND',
      transaction_type: 'credit',
      balance: null,
      ref: 'TEST123',
      momo_ref: null,
      received_at: new Date().toISOString(),
      raw_body: {},
      created_at: new Date().toISOString(),
      test_trans: true,
      handle_status: 'pending',
      handle_ref: null,
      handle_note: null,
      momo_extrafield: null,
    });
  };

  const handleToggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem('soundbox-muted', String(next));
    window.dispatchEvent(new Event('mute-change'));
  };

  return (
    <div className="vietnamese-text flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">SoundBox</h1>
          <span className="text-sm text-muted-foreground">
            Payment Notifier
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleTestVoice}
            title="Test âm thanh"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleMute}
            title={muted ? 'Bật tiếng' : 'Tắt tiếng'}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            title="Tổng tiền hôm nay"
            value={formatVND(todayTotal)}
          />
          <SummaryCard
            icon={<Receipt className="h-5 w-5 text-primary" />}
            title="Giao dịch hôm nay"
            value={String(todayPayments.length)}
          />
          <StatusCard isConnected={isConnected} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chuyển khoản gần đây</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md border border-border bg-muted/50 p-1">
                  <Button
                    variant={filterToday ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setFilterToday(true)}
                  >
                    <CalendarDays className="h-3.5 w-3.5 mr-2" />
                    Hôm nay
                  </Button>
                  <Button
                    variant={!filterToday ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => setFilterToday(false)}
                  >
                    <LayoutList className="h-3.5 w-3.5 mr-2" />
                    Tất cả
                  </Button>
                </div>
                <CardDescription>
                  {displayedPayments.length} giao dịch
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {displayedPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-3 opacity-50" />
                  <p>
                    {filterToday
                      ? 'Chưa có giao dịch nào hôm nay. Đang chờ Realtime...'
                      : 'Chưa có chuyển khoản nào. Đang chờ Realtime...'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[320px] pl-6">Số tiền</TableHead>
                      <TableHead className="w-[200px]">Mã giao dịch</TableHead>
                      <TableHead>Thời gian</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedPayments.slice(0, 50).map((payment) => (
                      <PaymentRow
                        key={payment.id}
                        payment={payment}
                        highlighted={highlightedIds.has(payment.id)}
                      />
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {icon}
            <span>{title}</span>
          </div>
          <div className="text-2xl font-bold tabular-nums text-foreground">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCard({ isConnected }: { isConnected: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isConnected ? (
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <div className="h-2.5 w-2.5 bg-primary-foreground rounded-full animate-pulse" />
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                <div className="h-2.5 w-2.5 bg-destructive-foreground rounded-full" />
              </div>
            )}
            <span>Trạng thái</span>
          </div>
          <div
            className={cn(
              'text-2xl font-bold tabular-nums',
              isConnected ? 'text-primary' : 'text-destructive'
            )}
          >
            {isConnected ? 'Đã kết nối' : 'Ngắt kết nối'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentRow({
  payment,
  highlighted,
}: {
  payment: Payment;
  highlighted: boolean;
}) {
  const timeAgo = payment.received_at ? formatTimeAgo(payment.received_at) : '';
  const fullTime = payment.received_at
    ? formatDateTimeWithSeconds(payment.received_at)
    : '';
  const isNew = payment.received_at
    ? Date.now() - new Date(payment.received_at).getTime() < 10 * 60 * 1000
    : false;

  return (
    <TableRow
      className={cn(
        'transition-colors hover:bg-muted/50',
        highlighted && 'animate-highlight bg-primary/10'
      )}
    >
      <TableCell className="w-[320px] pl-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary tabular-nums">
            {payment.amount != null ? formatVND(payment.amount) : '—'}
          </span>
          {isNew && (
            <Badge variant="default">mới</Badge>
          )}
          {payment.test_trans && (
            <Badge variant="outline">TEST</Badge>
          )}
        </div>
      </TableCell>

      <TableCell className="w-[200px] font-mono text-sm text-muted-foreground">
        {payment.ref || '—'}
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <div className="space-y-0.5">
            <div className="text-sm font-medium" title={fullTime}>
              {fullTime}
            </div>
            {timeAgo && (
              <div className="text-xs text-muted-foreground">{timeAgo}</div>
            )}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default SoundBox;