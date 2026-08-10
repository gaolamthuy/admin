import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getWindmillApiUrl } from '@/lib/windmill';
import { useSession } from '@/hooks/useAuth';

const GROUP_ID = '7224557580274371426'; // [GLT] Nội bộ mới
const SEND_SCRIPT = 'zalo/zca_send_pricetables';
const PREVIEW_SCRIPT = 'zalo/zca_get_pricetables_preview';

interface PricetablePreview {
  id: string;
  label: string;
  imageUrl: string | null;
}

export function ZaloTemplates() {
  const { data: session } = useSession();
  const [isSending, setIsSending] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  const { data, isLoading } = useQuery<{ pricetables: PricetablePreview[] }>({
    queryKey: ['zalo-pricetables-preview'],
    queryFn: async () => {
      const url = getWindmillApiUrl('w', `jobs/run/${PREVIEW_SCRIPT}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  const isDisabled = isSending || !!cooldownEnd;

  const handleSend = async () => {
    setIsSending(true);
    try {
      const url = getWindmillApiUrl('w', `jobs/run/${SEND_SCRIPT}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: GROUP_ID,
          text: 'Bảng giá lẻ Gạo Lâm Thúy hôm nay:',
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body.slice(0, 200) || `HTTP ${res.status}`);
      }
      toast.success('Đã gửi bảng giá vào nhóm Zalo');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error('Gửi bảng giá thất bại', { description: msg });
      // If rate limited, start cooldown
      const minMatch = msg.match(/(\d+)\s*phút/);
      if (minMatch) {
        const minutes = parseInt(minMatch[1], 10);
        setCooldownEnd(Date.now() + minutes * 60 * 1000);
      }
    } finally {
      setIsSending(false);
    }
  };

  const pricetables = data?.pricetables ?? [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-blue-500/10">
              <MessageSquare className="size-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Gửi bảng giá lẻ</CardTitle>
              <CardDescription>
                Gửi 6 ảnh bảng giá lẻ vào nhóm{' '}
                <span className="font-medium text-foreground">[GLT] Nội bộ mới</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-lg bg-muted animate-pulse"
                  />
                ))
              : pricetables.map((pt) => (
                  <div key={pt.id} className="space-y-1">
                    <div className="aspect-[3/4] overflow-hidden rounded-lg border bg-muted">
                      {pt.imageUrl ? (
                        <img
                          src={pt.imageUrl}
                          alt={pt.label}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                          No image
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-center line-clamp-1">
                      {pt.label}
                    </p>
                  </div>
                ))}
          </div>
          <CooldownButton
            disabled={isDisabled}
            isSending={isSending}
            cooldownEnd={cooldownEnd}
            onCooldownEnd={() => setCooldownEnd(null)}
            onSend={handleSend}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CooldownButton({
  disabled,
  isSending,
  cooldownEnd,
  onCooldownEnd,
  onSend,
}: {
  disabled: boolean;
  isSending: boolean;
  cooldownEnd: number | null;
  onCooldownEnd: () => void;
  onSend: () => void;
}) {
  return (
    <Button onClick={onSend} disabled={disabled}>
      {isSending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang gửi...
        </>
      ) : cooldownEnd ? (
        <CooldownTimer endTime={cooldownEnd} onDone={onCooldownEnd} />
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Gửi ngay
        </>
      )}
    </Button>
  );
}

function CooldownTimer({ endTime, onDone }: { endTime: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.ceil((endTime - Date.now()) / 1000)));

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearInterval(id);
        onDone();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime, onDone]);

  if (remaining <= 0) return null;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  return (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {min > 0 ? `${min}p ${sec}s` : `${sec}s`}
    </>
  );
}
