import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { getWindmillApiUrl } from '@/lib/windmill';

const GROUP_ID = '7224557580274371426'; // [GLT] Nội bộ mới
const SCRIPT_PATH = 'zalo/zca_send_pricetables';

export function ZaloTemplates() {
  const [isSending, setIsSending] = useState(false);

  const handleSendPricetable = async () => {
    setIsSending(true);
    try {
      const url = getWindmillApiUrl('w', `jobs/run/${SCRIPT_PATH}`);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId: GROUP_ID,
          text: 'Bảng giá lẻ Gạo Lâm Thúy hôm nay:',
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      const jobId = result?.job_id ?? result?.id;
      toast.success('Đã gửi bảng giá vào nhóm Zalo', {
        description: jobId ? `Job ${jobId}` : 'Thành công',
      });
    } catch (err) {
      toast.error('Gửi bảng giá thất bại', {
        description: err instanceof Error ? err.message : 'Lỗi không xác định',
      });
    } finally {
      setIsSending(false);
    }
  };

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
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={handleSendPricetable} disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Gửi ngay
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
