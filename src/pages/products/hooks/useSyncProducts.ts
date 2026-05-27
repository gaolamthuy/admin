import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/lib/env';

interface SyncProductsResult {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

async function callSyncProducts(): Promise<SyncProductsResult> {
  const backendUrl = env.VITE_BACKEND_URL;
  const windmillToken = env.VITE_BACKEND_TOKEN;

  if (!backendUrl) {
    throw new Error('VITE_BACKEND_URL is not configured');
  }

  if (!windmillToken) {
    throw new Error('VITE_BACKEND_TOKEN is not configured');
  }

  const baseUrl = backendUrl.replace(/\/$/, '');
  const rootUrl = baseUrl.split('/api/')[0];
  const runUrl = `${rootUrl}/api/w/main/jobs/run/f/f/kiotviet/sync_data`;

  const runRes = await fetch(runUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${windmillToken}`,
    },
    body: JSON.stringify({ sync_types: 'products' }),
  });

  if (!runRes.ok) {
    throw new Error(`Windmill API error: ${runRes.status}`);
  }

  const jobId = await runRes.text();

  const resultUrl = `${rootUrl}/api/w/main/jobs_u/completed/get_result_maybe/${jobId}`;

  for (let i = 0; i < 120; i++) {
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
      return data.result as SyncProductsResult;
    }
  }

  throw new Error('Timeout: Đồng bộ sản phẩm không hoàn thành trong 4 phút');
}

export const useSyncProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: callSyncProducts,
    onSuccess: result => {
      toast.success(
        result.message || 'Đồng bộ sản phẩm thành công'
      );
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`Đồng bộ sản phẩm thất bại: ${error.message}`);
    },
  });
};
