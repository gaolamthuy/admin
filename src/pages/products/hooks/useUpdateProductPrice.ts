import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import { getWindmillJobRunUrl, getWindmillJobResultUrl } from '@/lib/windmill';

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
  } | null;
  mode?: 'po' | 'manual_cost' | 'manual_po';
  kiotviet_id: number;
  product_name: string;
  changelog_count: number;
}

interface UpdatePriceParams {
  targetCost?: number;
  targetPoPrice?: number;
}

/** Windmill trả error dạng string hoặc object lồng nhau — rút message sâu nhất */
function extractErrorString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    for (const key of ['message', 'error', 'detail']) {
      if (obj[key] != null) {
        const msg = extractErrorString(obj[key]);
        if (msg) return msg;
      }
    }
    return JSON.stringify(value);
  }
  return String(value);
}

async function callUpdateProductPrice(
  kiotvietId: number,
  params?: UpdatePriceParams
): Promise<UpdateProductPriceResult> {
  const windmillToken = env.VITE_BACKEND_TOKEN;

  if (!windmillToken) {
    throw new Error('VITE_BACKEND_TOKEN is not configured');
  }

  const apiUrl = getWindmillJobRunUrl(
    'p/f/frontend_admin/update_product_price_from_po'
  );
  if (!apiUrl) {
    throw new Error('VITE_BACKEND_URL is not configured');
  }

  const runRes = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${windmillToken}`,
    },
    body: JSON.stringify({
      kiotviet_id: kiotvietId,
      ...(params?.targetCost != null && { target_cost: params.targetCost }),
      ...(params?.targetPoPrice != null && {
        target_po_price: params.targetPoPrice,
      }),
    }),
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
        throw new Error(extractErrorString(data.result.error));
      }
      return data.result as UpdateProductPriceResult;
    }
  }

  throw new Error('Timeout: Windmill job did not complete in 30s');
}

export const useUpdateProductPrice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      kiotvietId,
      params,
    }: {
      kiotvietId: number;
      params?: UpdatePriceParams;
    }) => callUpdateProductPrice(kiotvietId, params),
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
      // Reload danh sách sản phẩm để cập nhật badge recently updated
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`Cập nhật giá thất bại: ${error.message}`);
    },
  });
};

export type { UpdateProductPriceResult };
