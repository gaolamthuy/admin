/**
 * Purchase Order List Page
 * Sử dụng TanStack Query
 *
 * @module pages/purchase-orders/PurchaseOrderList
 */

import { useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
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
import { Loader2, Plus } from 'lucide-react';
import { formatDate } from '@/utils/date';

/**
 * Purchase Order List Page Component
 */
export const PurchaseOrderList = () => {
  const navigate = useNavigate();
  const { data: purchaseOrders = [], isLoading } = usePurchaseOrders();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Danh sách đơn mua hàng</CardTitle>
          <Button onClick={() => navigate('/purchase-orders/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn mua hàng
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Chưa có đơn mua hàng nào</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã đơn</TableHead>
                  <TableHead>Nhà cung cấp</TableHead>
                  <TableHead>Ngày mua</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.code || `#${order.id}`}
                    </TableCell>
                    <TableCell>{order.supplier_name || '-'}</TableCell>
                    <TableCell>
                      {order.purchase_date
                        ? formatDate(order.purchase_date)
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {order.total
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: 'VND',
                          }).format(Number(order.total))
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {order.status === 0 ? 'Đã hoàn thành' : 'Đang xử lý'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/purchase-orders/show/${order.id}`)
                        }
                      >
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderList;
