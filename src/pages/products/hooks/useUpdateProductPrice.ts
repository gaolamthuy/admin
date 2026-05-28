import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import {
  getWindmillJobRunUrl,
  getWindmillJobResultUrl,
} from '@/lib/windmill';

interface UpdateProductPriceResult {
  master: {
    new_cost: number;
    old_cost: number;
    cost_changed: boolean;
    new_baseprice: number;
    old_baseprice: number;
    baseprice_changed: boolean;
  };
  status: string;
  changes: string[];
  children: Array<{
    name: string;
    status: string;
    kiotviet_id: number;
    new_baseprice: number;
    old_baseprice: number;
  }>;
  po_source: {
    purchase_date: string;
    supplier_name: string;
    purchase_order_code: string;
    total_cost_per_unit: number;
  };
  kiotviet_id: number;
  product_name: string;
  changelog_count: number;
}

async function callUpdateProductPrice(
  kiotvietId: number
): Promise<UpdateProductPriceResult> {
  const windmillToken = env.VITE_BACKEND_TOKEN;

  if (!windmillToken) {
    throw new Error('VITE_BACKEND_TOKEN is not configured');
  }

  const apiUrl = getWindmillJobRunUrl('p/f/frontend_admin/update_product_price_from_po');
  if (!apiUrl) {
    throw new Error('VITE_BACKEND_URL is not configured');
  }

  const runRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${windmillToken}`,
    },
    body: JSON.stringify({ kiotviet_id: kiotvietId }),
  });

  if (!runRes.ok) {
    throw new Error(`Windmill API error: ${runRes.status}`);
  }

  const jobId = await runRes.text();

  const resultUrl = getWindmillJobResultUrl(jobId);

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000));

    const res = await fetch(resultUrl, {
      headers: { Authorization: `Bearer ${windmillToken}` },
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
    onSuccess: result => {
      if (result.status !== 'ok') {
        toast.error(`Cập nhật giá thất bại: ${result.status}`);
        return;
      }
      const { master, product_name, children } = result;
      const childInfo =
        children.length > 0
          ? ` | Children: ${children.map(c => `${c.name} ${Number(c.old_baseprice).toLocaleString()}→${Number(c.new_baseprice).toLocaleString()}`).join(', ')}`
          : '';
      toast.success(
        `Đã cập nhật giá: ${product_name} — basePrice ${Number(master.old_baseprice).toLocaleString()} → ${Number(master.new_baseprice).toLocaleString()}, cost ${Number(master.old_cost).toLocaleString()} → ${Number(master.new_cost).toLocaleString()}${childInfo}`
      );
    },
    onError: (error: Error) => {
      toast.error(`Cập nhật giá thất bại: ${error.message}`);
    },
  });
};

export type { UpdateProductPriceResult };
