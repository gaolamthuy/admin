/**
 * Hook để in lại hóa đơn (phiếu bán hàng kiểu KiotViet)
 * Gọi backend Windmill để generate HTML template hóa đơn
 *
 * @module pages/invoices/hooks/usePrintInvoice
 */

import { useState } from 'react';
import { useSession } from '@/hooks/useAuth';
import { getPrintUrl } from '@/lib/windmill';

export const usePrintInvoice = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const printInvoice = async (invoiceKiotvietId: number) => {
    if (!session) {
      throw new Error('Not authenticated');
    }

    const printUrl = getPrintUrl();
    if (!printUrl) {
      throw new Error(
        'VITE_BACKEND_URL chưa được cấu hình. Vui lòng kiểm tra file .env.local.'
      );
    }

    setIsLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = {
        printType: 'invoice',
        kiotviet_id: invoiceKiotvietId.toString(),
      };

      const response = await fetch(printUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Không thể tạo hóa đơn. Vui lòng thử lại.');
      }

      const html = await response.text();

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error(
          'Không thể mở cửa sổ in. Vui lòng kiểm tra popup blocker.'
        );
      }

      printWindow.document.write(html);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Có lỗi xảy ra khi in hóa đơn';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    printInvoice,
    isLoading,
    error,
  };
};
