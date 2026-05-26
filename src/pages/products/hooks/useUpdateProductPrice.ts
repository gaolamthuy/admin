import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface UpdateProductPriceResult {
  product_code: string;
  kiotviet_id: number;
  old_base_price: number;
  new_base_price: number;
  old_cost: number;
  new_cost: number;
  dry_run: boolean;
  updated: boolean;
  child_updates?: Array<{
    kiotviet_id: number;
    code: string;
    old_base_price: number;
    new_base_price: number;
  }>;
  message?: string;
  error?: string;
}

async function callUpdateProductPrice(
  kiotvietId: number
): Promise<UpdateProductPriceResult> {
  if (!BACKEND_URL) {
    throw new Error('VITE_BACKEND_URL is not configured');
  }

  const baseUrl = BACKEND_URL.replace(/\/$/, '');
  const tokenUrl = `${baseUrl.split('/api/')[0]}`;
  const apiUrl = `${tokenUrl}/api/w/wm-fork-dev/jobs/run/p/f/frontend_admin/update_product_price_from_po`;

  const WINDMILL_TOKEN = 'env.VITE_BACKEND_TOKEN';

  const runRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WINDMILL_TOKEN}`,
    },
    body: JSON.stringify({ kiotviet_id: kiotvietId }),
  });

  if (!runRes.ok) {
    throw new Error(`Windmill API error: ${runRes.status}`);
  }

  const { id: jobId } = await runRes.json();

  const resultUrl = `${tokenUrl}/api/w/wm-fork-dev/jobs_u/completed/get_result_maybe/${jobId}`;

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));

    const res = await fetch(resultUrl, {
      headers: { Authorization: `Bearer ${WINDMILL_TOKEN}` },
    });

    if (!res.ok) continue;

    const data = await res.json();

    if (data.completed) {
      if (data.result?.error) {
        throw new Error(data.result.error);
      }
      return data.result as UpdateProductPriceResult;
    }
  }

  throw new Error('Timeout: Windmill job did not complete in 30s');
}

export const useUpdateProductPrice = () => {
  return useMutation({
    mutationFn: callUpdateProductPrice,
    onSuccess: (result) => {
      if (result.message && !result.updated) {
        toast.info(result.message);
      } else {
        toast.success(
          `Đã cập nhật giá: ${result.product_code} — basePrice ${Number(result.old_base_price).toLocaleString()} → ${Number(result.new_base_price).toLocaleString()}, cost ${Number(result.old_cost).toLocaleString()} → ${Number(result.new_cost).toLocaleString()}`
        );
      }
    },
    onError: (error: Error) => {
      toast.error(`Cập nhật giá thất bại: ${error.message}`);
    },
  });
};

export type { UpdateProductPriceResult };
