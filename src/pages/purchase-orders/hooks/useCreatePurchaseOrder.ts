import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { env } from '@/lib/env';
import { getWindmillApiUrl } from '@/lib/windmill';

const FLOW_PATH =
  'jobs/run_wait_result/f/f/frontend_admin/create_purchase_order';

const DEFAULT_ERROR_MESSAGE =
  'Không thể tạo đơn nhập hàng. Vui lòng thử lại.';

export interface PurchaseOrderItem {
  kiotviet_id: number;
  quantity: number;
}

export interface Surcharge {
  code: string; // CHK000002 (Cước xe) / CHK000001 (Xuống gạo)
  name: string;
  value: number; // VND
  isSupplierExpense?: boolean; // KV ignore, giữ false
}

export interface CreatePurchaseOrderPayload {
  supplier_code: string;
  items: PurchaseOrderItem[];
  branch_id?: number;
  description?: string;
  surcharges?: Surcharge[];
}

export interface PurchaseOrderLine {
  kiotviet_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  price_source_po: string;
}

export interface CreatePurchaseOrderResult {
  status: string;
  po_id: number;
  po_code: string;
  supplier: { code: string; name: string };
  branch_id: number;
  total: number;
  lines: PurchaseOrderLine[];
  sync: { ok: boolean; purchase_orders: number; details: number };
  surcharges?: Surcharge[];
  total_surcharges?: number;
}

export const useCreatePurchaseOrder = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createPurchaseOrder = useCallback(
    async (
      payload: CreatePurchaseOrderPayload
    ): Promise<CreatePurchaseOrderResult> => {
      const backendUrl = env.VITE_BACKEND_URL;
      const token = env.VITE_BACKEND_TOKEN;

      if (!backendUrl) {
        throw new Error(
          'VITE_BACKEND_URL chưa được cấu hình. Vui lòng kiểm tra file .env.local.'
        );
      }
      if (!token) {
        throw new Error(
          'VITE_BACKEND_TOKEN chưa được cấu hình. Vui lòng kiểm tra file .env.local.'
        );
      }

      const url = getWindmillApiUrl('w', FLOW_PATH);

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            supplier_code: payload.supplier_code,
            items: payload.items,
            ...(payload.branch_id != null
              ? { branch_id: payload.branch_id }
              : {}),
            ...(payload.description ? { description: payload.description } : {}),
            ...(payload.surcharges && payload.surcharges.length > 0
              ? { surcharges: payload.surcharges }
              : {}),
            is_draft: 1,
            auto_sync: true,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => null);
          const message =
            (err?.error?.message as string) ||
            `Create PO failed: ${response.status}`;
          throw new Error(message);
        }

        const result = (await response.json()) as CreatePurchaseOrderResult;

        const syncNote = result.sync?.ok
          ? 'Đã đồng bộ về database.'
          : 'Đồng bộ về database đang chờ xử lý.';

        const surchargeNote =
          result.total_surcharges != null && result.total_surcharges > 0
            ? ` — Chi phí nhập: ${result.total_surcharges.toLocaleString(
                'vi-VN'
              )}đ`
            : '';

        toast.success(`Đã tạo phiếu nhập nháp ${result.po_code}`, {
          description: `Tổng tiền hàng: ${result.total.toLocaleString(
            'vi-VN'
          )}đ${surchargeNote} — ${syncNote}`,
        });

        return result;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
        setErrorMessage(message);
        toast.error('Tạo đơn nhập hàng thất bại', {
          description: message,
        });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const resetError = useCallback(() => setErrorMessage(null), []);

  return {
    createPurchaseOrder,
    isSubmitting,
    errorMessage,
    resetError,
  };
};
