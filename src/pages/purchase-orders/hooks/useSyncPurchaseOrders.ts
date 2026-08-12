import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import {
  getWindmillJobRunUrl,
  getWindmillJobResultUrl,
} from '@/lib/windmill';

interface SyncPurchaseOrdersResult {
  purchase_orders: number;
  details: number;
  days_back: number;
  from: string;
  to: string;
  [key: string]: unknown;
}

async function callSyncPurchaseOrders(): Promise<SyncPurchaseOrdersResult> {
  const backendUrl = env.VITE_BACKEND_URL;
  const windmillToken = env.VITE_BACKEND_TOKEN;

  if (!backendUrl) {
    throw new Error('VITE_BACKEND_URL is not configured');
  }

  if (!windmillToken) {
    throw new Error('VITE_BACKEND_TOKEN is not configured');
  }

  // Gọi trực tiếp script sync_purchase_orders, không qua flow
  const runUrl = getWindmillJobRunUrl('f/f/kiotviet/sync_purchase_orders');

  const runRes = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${windmillToken}`,
    },
    body: JSON.stringify({ daysBack: 30 }),
  });

  if (!runRes.ok) {
    throw new Error(`Windmill API error: ${runRes.status}`);
  }

  const jobId = await runRes.text();

  const resultUrl = getWindmillJobResultUrl(jobId);

  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const res = await fetch(resultUrl, {
      headers: { Authorization: `Bearer ${windmillToken}` },
    });

    if (!res.ok) continue;

    const data = await res.json();

    if (data.completed) {
      if (data.result?.error) {
        throw new Error(data.result.error);
      }
      return data.result as SyncPurchaseOrdersResult;
    }
  }

  throw new Error('Timeout: Đồng bộ nhập hàng không hoàn thành trong 2 phút');
}

export const useSyncPurchaseOrders = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: callSyncPurchaseOrders,
    onSuccess: result => {
      const { purchase_orders, details } = result;
      toast.success(
        `Download thành công: ${purchase_orders} đơn, ${details} chi tiết`
      );
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (error: Error) => {
      toast.error(`Download nhập hàng thất bại: ${error.message}`);
    },
  });
};
