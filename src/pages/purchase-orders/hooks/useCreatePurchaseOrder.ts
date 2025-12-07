import { useCallback, useMemo, useState } from 'react';
import { useNotification } from '@refinedev/core';

export interface PurchaseOrderDetailPayload {
  productId: number;
  productCode?: string | null;
  productName?: string | null;
  quantity: number;
  price?: number | null;
  discount?: number | null;
}

export interface CreatePurchaseOrderPayload {
  branchId: number;
  supplier: {
    id?: number;
    code?: string | null;
    name?: string | null;
    contactNumber?: string | null;
    address?: string | null;
  };
  purchaseOrderDetails: PurchaseOrderDetailPayload[];
  note?: string;
  description?: string;
  isDraft?: boolean;
}

const DEFAULT_ERROR_MESSAGE =
  'Không thể tạo đơn mua hàng. Vui lòng thử lại hoặc kiểm tra log trong n8n.';

const buildWebhookUrl = (baseUrl?: string) => {
  if (!baseUrl) return null;
  return `${baseUrl.replace(/\/$/, '')}/handle-frontend`;
};

const encodeBasicAuth = (value?: string) => {
  if (!value) return undefined;
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(value);
  }
  return value;
};

export const useCreatePurchaseOrder = () => {
  const { open } = useNotification();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const webhookUrl = useMemo(
    () => buildWebhookUrl(import.meta.env.VITE_N8N_WEBHOOK_URL),
    []
  );

  const basicAuthToken = useMemo(
    () => encodeBasicAuth(import.meta.env.VITE_N8N_WEBHOOK_BASIC_AUTH),
    []
  );

  const customHeaderKey = import.meta.env.VITE_N8N_WEBHOOK_HEADER_KEY;
  const customHeaderValue = import.meta.env.VITE_N8N_WEBHOOK_HEADER_VALUE;

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {};

    if (basicAuthToken) {
      headers.Authorization = `Basic ${basicAuthToken}`;
    }

    if (customHeaderKey && customHeaderValue) {
      headers[customHeaderKey] = customHeaderValue;
    }

    return headers;
  }, [basicAuthToken, customHeaderKey, customHeaderValue]);

  const createPurchaseOrder = useCallback(
    async (payload: CreatePurchaseOrderPayload) => {
      if (!webhookUrl) {
        throw new Error(
          'VITE_N8N_WEBHOOK_URL chưa được cấu hình. Vui lòng kiểm tra file .env.local.'
        );
      }

      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || DEFAULT_ERROR_MESSAGE);
        }

        open?.({
          type: 'success',
          message: 'Đơn mua hàng đã được tạo',
          description: 'KiotViet đang xử lý đơn nháp mới.',
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE;
        setErrorMessage(message);
        open?.({
          type: 'error',
          message: 'Tạo đơn mua hàng thất bại',
          description: message,
        });
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [authHeaders, open, webhookUrl]
  );

  const resetError = useCallback(() => setErrorMessage(null), []);

  return {
    createPurchaseOrder,
    isSubmitting,
    errorMessage,
    resetError,
  };
};
