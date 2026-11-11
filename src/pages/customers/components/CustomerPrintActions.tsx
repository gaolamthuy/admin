/**
 * Customer Print Actions
 * Dropdown in bảng giá cho customer (Đầy đủ / Giản lược / Giản lược có cập nhật)
 * Dùng chung ở CustomersList và CustomerShow
 *
 * @module pages/customers/components/CustomerPrintActions
 */

import { ChevronDown, Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { usePrintPriceTable } from '../hooks/usePrintPriceTable';

interface CustomerPrintActionsProps {
  kiotvietId?: number | null;
  customerName?: string | null;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
}

/**
 * Dropdown in bảng giá cho 1 khách hàng
 * Chỉ render khi customer có kiotviet_id; caller quyết định điều kiện hiển thị (vd: groups !== null)
 */
export const CustomerPrintActions = ({
  kiotvietId,
  customerName,
  variant = 'ghost',
}: CustomerPrintActionsProps) => {
  const { printPriceTable, isLoading } = usePrintPriceTable();

  /**
   * In bảng giá cho customer
   * @param simplified - Bảng giá giản lược (ẩn cột giá bao)
   * @param withChangelog - Kèm cập nhật giá hôm nay
   */
  const handlePrint = async (simplified?: boolean, withChangelog?: boolean) => {
    if (!kiotvietId) {
      toast.error('Không tìm thấy thông tin khách hàng');
      return;
    }

    try {
      await printPriceTable(kiotvietId, {
        simplified,
        withChangelog,
      });
      const label = withChangelog
        ? ' giản lược (có cập nhật)'
        : simplified
          ? ' giản lược'
          : '';
      toast.success('Đang mở bảng giá để in', {
        description: `Bảng giá${label} cho ${customerName || 'khách hàng'}`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Có lỗi xảy ra khi in bảng giá';
      toast.error('In bảng giá thất bại', {
        description: message,
      });
    }
  };

  if (!kiotvietId) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Printer className="mr-1 h-4 w-4" />
          )}
          {isLoading ? 'Đang xử lý...' : 'In bảng giá'}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handlePrint(false)}>
          <Printer className="mr-2 h-4 w-4" />
          Đầy đủ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint(true)}>
          <Printer className="mr-2 h-4 w-4" />
          Giản lược
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handlePrint(false, true)}>
          <Printer className="mr-2 h-4 w-4" />
          Giản lược (có cập nhật)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CustomerPrintActions;
