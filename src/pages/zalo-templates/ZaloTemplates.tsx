import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getWindmillApiUrl } from '@/lib/windmill';
import { useSession } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const GROUP_ID = '7224557580274371426'; // [GLT] Nội bộ mới
const SUPABASE_URL = 'https://wvckxasjbydyvqgwgdhg.supabase.co';
const STORAGE_BUCKET = 'product-images';

interface PricetablePreview {
  id: string;
  label: string;
  imageUrl: string | null;
}

function getPricetableUrl(title: string): string | null {
  const match = title.match(/(\d+)/);
  if (!match) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/pricetables/${match[1]}.webp`;
}

export function ZaloTemplates() {
  const { data: session } = useSession();
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  const { data, isLoading } = useQuery<PricetablePreview[]>({
    queryKey: ['zalo-pricetables-preview'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('glt_media')
        .select('id, title, title_public')
        .eq('type', 'pricetable-retail')
        .eq('is_test', false)
        .order('rank', { nullsFirst: false })
        .limit(6);

      if (error) throw error;
      return (rows ?? []).map((row: any) => ({
        id: String(row.id),
        label: row.title_public || row.id,
        imageUrl: getPricetableUrl(row.title),
      }));
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const url = getWindmillApiUrl('r', 'zalo');
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'send-pricetables',
          groupId: GROUP_ID,
          text: 'Bảng giá lẻ Gạo Lâm Thúy hôm nay:',
        }),
      });
      const body = await res.json();
      if (body?.error) throw new Error(body.error);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return body;
    },
    onSuccess: () => {
      toast.success('Đã gửi bảng giá vào nhóm Zalo');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error('Gửi bảng giá thất bại', { description: msg });
      const minMatch = msg.match(/(\d+)\s*phút/);
      if (minMatch) {
        const minutes = parseInt(minMatch[1], 10);
        setCooldownEnd(Date.now() + minutes * 60 * 1000);
      }
    },
  });

  const isDisabled = sendMutation.isPending || !!cooldownEnd;
  const pricetables = data ?? [];

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
            isSending={sendMutation.isPending}
            cooldownEnd={cooldownEnd}
            onCooldownEnd={() => setCooldownEnd(null)}
            onSend={() => sendMutation.mutate()}
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
