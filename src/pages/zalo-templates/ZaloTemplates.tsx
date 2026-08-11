import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Send, Loader2, MessageSquare, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getWindmillApiUrl } from '@/lib/windmill';
import { useSession } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const GROUP_ID = '7224557580274371426';
const SUPABASE_URL = 'https://wvckxasjbydyvqgwgdhg.supabase.co';
const STORAGE_BUCKET = 'product-images';

function getPricetableUrl(title: string): string | null {
  const match = title.match(/(\d+)/);
  if (!match) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/pricetables/${match[1]}.webp`;
}

export function ZaloTemplates() {
  const { data: session } = useSession();
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
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
    onSuccess: () => toast.success('Đã gửi bảng giá vào nhóm Zalo'),
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định';
      toast.error('Gửi bảng giá thất bại', { description: msg });
      const minMatch = msg.match(/(\d+)\s*phút/);
      if (minMatch) setCooldownEnd(Date.now() + parseInt(minMatch[1], 10) * 60 * 1000);
    },
  });

  const pricetables = data ?? [];
  const cover = pricetables[0];
  const moreCount = Math.max(0, pricetables.length - 1);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-blue-500" />
              <CardTitle className="text-base">Gửi bảng giá lẻ</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {pricetables.length} ảnh
              </Badge>
            </div>
            <CooldownButton
              disabled={sendMutation.isPending || !!cooldownEnd}
              isSending={sendMutation.isPending}
              cooldownEnd={cooldownEnd}
              onCooldownEnd={() => setCooldownEnd(null)}
              onSend={() => sendMutation.mutate()}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Nhóm <span className="font-medium text-foreground">[GLT] Nội bộ mới</span>
          </p>
        </CardHeader>
        <CardContent className="pb-4">
          {isLoading ? (
            <div className="aspect-[3/4] max-w-[160px] rounded-md bg-muted animate-pulse" />
          ) : cover ? (
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative aspect-[3/4] max-w-[160px] overflow-hidden rounded-md border bg-muted cursor-pointer group">
                  {cover.imageUrl ? (
                    <img
                      src={cover.imageUrl}
                      alt={cover.label}
                      className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="size-4 text-muted-foreground" />
                    </div>
                  )}
                  {moreCount > 0 && (
                    <Badge className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 text-xs">
                      +{moreCount}
                    </Badge>
                  )}
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Preview bảng giá lẻ</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3">
                  {pricetables.map((pt) => (
                    <div key={pt.id} className="space-y-1">
                      <div className="aspect-[3/4] overflow-hidden rounded-md border bg-muted">
                        {pt.imageUrl ? (
                          <img src={pt.imageUrl} alt={pt.label} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="size-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground text-center line-clamp-1">{pt.label}</p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <p className="text-sm text-muted-foreground">Không có ảnh bảng giá</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CooldownButton({ disabled, isSending, cooldownEnd, onCooldownEnd, onSend }: {
  disabled: boolean; isSending: boolean; cooldownEnd: number | null;
  onCooldownEnd: () => void; onSend: () => void;
}) {
  return (
    <Button size="sm" onClick={onSend} disabled={disabled}>
      {isSending ? (
        <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang gửi...</>
      ) : cooldownEnd ? (
        <CooldownTimer endTime={cooldownEnd} onDone={onCooldownEnd} />
      ) : (
        <><Send className="mr-1.5 h-3.5 w-3.5" /> Gửi ngay</>
      )}
    </Button>
  );
}

function CooldownTimer({ endTime, onDone }: { endTime: number; onDone: () => void }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
  );

  useEffect(() => {
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) { clearInterval(id); onDone(); }
    }, 1000);
    return () => clearInterval(id);
  }, [endTime, onDone]);

  if (remaining <= 0) return null;
  const min = Math.floor(remaining / 60);
  const sec = remaining % 60;
  return <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{min > 0 ? `${min}p${sec}s` : `${sec}s`}</>;
}
