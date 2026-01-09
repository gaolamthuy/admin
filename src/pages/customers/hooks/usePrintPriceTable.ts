/**
 * Hook để in bảng giá cho customer
 * Gọi n8n workflow để generate HTML template bảng giá
 *
 * @module pages/customers/hooks/usePrintPriceTable
 */

import { useState } from 'react';
import { useSession } from '@/hooks/useAuth';

/**
 * Hook để print price table cho customer
 * @returns Function để gọi workflow và state loading/error
 */
export const usePrintPriceTable = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Build webhook URL từ environment variable
   */
  const buildWebhookUrl = (baseUrl?: string) => {
    if (!baseUrl) return null;
    return `${baseUrl.replace(/\/$/, '')}/print`;
  };

  /**
   * Encode Basic Auth token
   */
  const encodeBasicAuth = (value?: string) => {
    if (!value) return undefined;
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(value);
    }
    return value;
  };

  const webhookUrl = buildWebhookUrl(import.meta.env.VITE_N8N_WEBHOOK_URL);
  const basicAuthToken = encodeBasicAuth(
    import.meta.env.VITE_N8N_WEBHOOK_BASIC_AUTH
  );
  const customHeaderKey = import.meta.env.VITE_N8N_WEBHOOK_HEADER_KEY;
  const customHeaderValue = import.meta.env.VITE_N8N_WEBHOOK_HEADER_VALUE;

  /**
   * Build auth headers
   */
  const buildAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (basicAuthToken) {
      headers.Authorization = `Basic ${basicAuthToken}`;
    }
    if (customHeaderKey && customHeaderValue) {
      headers[customHeaderKey] = customHeaderValue;
    }
    return headers;
  };

  /**
   * Gọi workflow để print price table
   * @param customerKiotvietId - KiotViet ID của customer
   * @param categoryId - Optional category ID để filter products
   */
  const printPriceTable = async (
    customerKiotvietId: number,
    categoryId?: number
  ) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    if (!webhookUrl) {
      throw new Error(
        'VITE_N8N_WEBHOOK_URL chưa được cấu hình. Vui lòng kiểm tra file .env.local.'
      );
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build query params theo format: printType=pricetable&outputType=html&pricetableType=whole&customer_kiotviet_id={kiotviet_id}
      const params = new URLSearchParams({
        printType: 'pricetable',
        outputType: 'html',
        pricetableType: 'whole',
        customer_kiotviet_id: customerKiotvietId.toString(),
      });

      if (categoryId) {
        params.append('categoryId', categoryId.toString());
      }

      const url = `${webhookUrl}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html',
          ...buildAuthHeaders(),
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text ||
            'Không thể tạo bảng giá. Vui lòng thử lại hoặc kiểm tra log trong n8n.'
        );
      }

      // Lấy HTML response
      const html = await response.text();

      // Mở HTML trong window mới để print
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.');
      }

      printWindow.document.write(html);
      printWindow.document.close();

      // Tự động trigger print dialog sau khi load xong
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi in bảng giá';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    printPriceTable,
    isLoading,
    error,
  };
};

