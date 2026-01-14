/**
 * Purchase Order Show Page
 * Sử dụng TanStack Query
 *
 * @module pages/purchase-orders/PurchaseOrderShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import {
  usePurchaseOrder,
  usePurchaseOrderDetails,
} from '@/hooks/usePurchaseOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/utils/date';

/**
 * Purchase Order Show Page Component
 */
export const PurchaseOrderShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/purchase-orders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Đơn nhập hàng #{purchaseOrder.code || purchaseOrder.id}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <span className="text-muted-foreground">Trạng thái:</span>
                  <span className="font-medium">
                    {purchaseOrder.status === 0
                      ? 'Đã hoàn thành'
                      : 'Đang xử lý'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Tổng tiền</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tổng tiền:</span>
                  <span className="font-medium">
                    {purchaseOrder.total
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(Number(purchaseOrder.total))
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đã thanh toán:</span>
                  <span className="font-medium">
                    {purchaseOrder.total_payment
                      ? new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(Number(purchaseOrder.total_payment))
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {purchaseOrder.description && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
              <p className="text-muted-foreground">
                {purchaseOrder.description}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold mb-4">Chi tiết sản phẩm</h3>
            {detailsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : details.length === 0 ? (
              <p className="text-muted-foreground">Chưa có sản phẩm nào</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead>Giảm giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map(detail => {
                    const total =
                      (Number(detail.quantity) || 0) *
                        (Number(detail.price) || 0) -
                      (Number(detail.discount) || 0);
                    return (
                      <TableRow key={detail.id}>
                        <TableCell className="font-medium">
                          {detail.product_name || detail.product_code || '-'}
                        </TableCell>
                        <TableCell>{detail.quantity || '-'}</TableCell>
                        <TableCell>
                          {detail.price
                            ? new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(Number(detail.price))
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {detail.discount
                            ? new Intl.NumberFormat('vi-VN', {
                                style: 'currency',
                                currency: 'VND',
                              }).format(Number(detail.discount))
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(total)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderShow;
