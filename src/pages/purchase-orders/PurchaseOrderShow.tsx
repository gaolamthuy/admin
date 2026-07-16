/**
 * Purchase Order Show Page
 * Sử dụng TanStack Query — query từ v_purchase_orders view (có aggregate data)
 * Price/đơn giá chỉ hiển thị cho admin
 *
 * @module pages/purchase-orders/PurchaseOrderShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  usePurchaseOrder,
  usePurchaseOrderDetails,
  PurchaseOrderDetailItem,
} from '@/hooks/usePurchaseOrders';
import { useIsAdmin } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowLeft, Receipt, Eye, EyeOff } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { useState } from 'react';

const STATUS_MAP: Record<number, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  1: { label: 'Nháp', variant: 'secondary' },
  3: { label: 'Hoàn thành', variant: 'default' },
  4: { label: 'Đã hủy', variant: 'destructive' },
};

const formatVND = (value: number | null | undefined) =>
  value ? Number(value).toLocaleString('vi-VN') + 'đ' : '-';

/**
 * Purchase Order Show Page Component
 */
export const PurchaseOrderShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [showPrice, setShowPrice] = useState(false);
  const { data: purchaseOrder, isLoading, error } = usePurchaseOrder(id || '');
  const { data: details = [], isLoading: detailsLoading } =
    usePurchaseOrderDetails(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error
                ? error.message
                : 'Không tìm thấy đơn nhập hàng'}
            </p>
            <Button
              onClick={() => navigate('/purchase-orders')}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = purchaseOrder.status != null
    ? STATUS_MAP[purchaseOrder.status]
    : { label: 'Chưa xác định', variant: 'outline' as const };

  const totalCosts = (Number(purchaseOrder.ex_return_third_party) || 0) +
    (Number(purchaseOrder.ex_return_suppliers) || 0);

  // Dùng details từ view (JSONB aggregate) nếu có, fallback về separate query
  const detailItems = purchaseOrder.details || details;

  // Type helper: kiểm tra xem detail có phải từ view JSONB (PurchaseOrderDetailItem) không
  const isViewItem = (d: any): d is PurchaseOrderDetailItem =>
    'glt_status' in d;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrice(!showPrice)}
          >
            {showPrice ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Ẩn giá
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Hiện giá
              </>
            )}
          </Button>
        )}
      </div>

      {/* Thông tin chung */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CardTitle>
              Đơn nhập hàng #{purchaseOrder.code || purchaseOrder.id}
            </CardTitle>
            <Badge variant={statusInfo.variant}>
              {statusInfo.label}
            </Badge>
            {purchaseOrder.description?.includes('[TEST]') && (
              <Badge variant="outline" className="text-xs">
                TEST
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Thông tin đơn hàng */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Thông tin đơn hàng</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã đơn:</span>
                  <span className="font-medium">
                    {purchaseOrder.code || `#${purchaseOrder.id}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nhà cung cấp:</span>
                  <span className="font-medium">
                    {purchaseOrder.supplier_name || '-'}
                    {purchaseOrder.supplier_code && (
                      <span className="text-xs text-muted-foreground ml-1">
                        ({purchaseOrder.supplier_code})
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ngày mua:</span>
                  <span className="font-medium">
                    {purchaseOrder.purchase_date
                      ? formatDate(purchaseOrder.purchase_date)
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sản phẩm:</span>
                  <span className="font-medium">
                    {purchaseOrder.total_items || detailItems.length || 0} sản phẩm
                    {purchaseOrder.total_quantity &&
                      ` (${Number(purchaseOrder.total_quantity).toLocaleString('vi-VN')} kg)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Tổng tiền — chỉ admin */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Tổng tiền</h3>
              {isAdmin ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng hàng:</span>
                    <span className="font-medium">
                      {formatVND(purchaseOrder.total)}
                    </span>
                  </div>
                  {purchaseOrder.total_payment != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Đã thanh toán:</span>
                      <span className="font-medium">
                        {formatVND(purchaseOrder.total_payment)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Chỉ admin mới xem được thông tin giá
                </p>
              )}
            </div>

            {/* Chi phí nhập */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Chi phí nhập</h3>
              <div className="space-y-2">
                {purchaseOrder.ex_return_third_party != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chi phí nhập khác:</span>
                    <span className="font-medium text-orange-600">
                      {formatVND(purchaseOrder.ex_return_third_party)}
                    </span>
                  </div>
                )}
                {purchaseOrder.ex_return_suppliers != null && Number(purchaseOrder.ex_return_suppliers) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Chi phí NCC:</span>
                    <span className="font-medium text-orange-600">
                      {formatVND(purchaseOrder.ex_return_suppliers)}
                    </span>
                  </div>
                )}
                {totalCosts > 0 && (
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Tổng chi phí:</span>
                    <span className="font-medium text-orange-600">
                      {formatVND(totalCosts)}
                    </span>
                  </div>
                )}
                {totalCosts === 0 && (
                  <p className="text-sm text-muted-foreground">Không có chi phí nhập</p>
                )}
              </div>
            </div>
          </div>

          {/* Mô tả */}
          {purchaseOrder.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
              <p className="text-muted-foreground">
                {purchaseOrder.description}
              </p>
            </div>
          )}

          {/* Admin notes */}
          {purchaseOrder.combined_admin_notes && (
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-3">
              <h3 className="text-sm font-semibold mb-1 text-orange-700 dark:text-orange-400">Admin notes</h3>
              <p className="text-sm text-orange-600 dark:text-orange-300">
                {purchaseOrder.combined_admin_notes}
              </p>
            </div>
          )}

          {/* Notes */}
          {purchaseOrder.combined_notes && !purchaseOrder.description?.includes(purchaseOrder.combined_notes) && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Ghi chú</h3>
              <p className="text-muted-foreground">
                {purchaseOrder.combined_notes}
              </p>
            </div>
          )}

          {/* Chi tiết sản phẩm */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Chi tiết sản phẩm ({detailItems.length})
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                  onClick={() => setShowPrice(!showPrice)}
                >
                  {showPrice ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              )}
            </h3>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : detailItems.length === 0 ? (
              <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead className="text-right">Số lượng (kg)</TableHead>
                      {isAdmin && showPrice && (
                        <>
                          <TableHead className="text-right">Đơn giá</TableHead>
                          <TableHead className="text-right">Thành tiền</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailItems.map(detail => {
                      const qty = Number(detail.quantity) || 0;
                      const price = Number(detail.price) || 0;
                      const lineTotal = qty * price;
                      return (
                        <TableRow key={detail.id}>
                          <TableCell className="font-medium">
                            <div>
                              {detail.product_name || detail.product_code || '-'}
                              {isViewItem(detail) && detail.glt_status && (
                                <Badge variant="outline" className="ml-2 text-[10px]">
                                  {detail.glt_status}
                                </Badge>
                              )}
                            </div>
                            {detail.product_code && (
                              <p className="text-xs text-muted-foreground">
                                {detail.product_code}
                              </p>
                            )}
                            {isViewItem(detail) && detail.glt_note && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {detail.glt_note}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {qty.toLocaleString('vi-VN')}
                          </TableCell>
                          {isAdmin && showPrice && (
                            <>
                              <TableCell className="text-right">
                                {formatVND(price)}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatVND(lineTotal)}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                    {/* Total row */}
                    {isAdmin && showPrice && (
                      <TableRow className="font-bold">
                        <TableCell colSpan={1}>Tổng</TableCell>
                        <TableCell className="text-right">
                          {detailItems.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0).toLocaleString('vi-VN')}
                        </TableCell>
                        <TableCell />
                        <TableCell className="text-right">
                          {formatVND(detailItems.reduce((sum, d) => sum + (Number(d.quantity) || 0) * (Number(d.price) || 0), 0))}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderShow;
