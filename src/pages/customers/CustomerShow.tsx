/**
 * Customer Show Page
 * Hiển thị chi tiết khách hàng: thông tin liên hệ, công nợ, nhóm khách,
 * sản phẩm mua gần đây + in bảng giá
 *
 * @module pages/customers/CustomerShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer } from '@/hooks/useCustomers';
import { CustomerPrintActions } from './components/CustomerPrintActions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime, formatTimeAgo } from '@/utils/date';

/**
 * Customer Show Page Component
 */
export const CustomerShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Query customer data (bao gồm recently_purchased_products)
  const { data: customer, isLoading, error } = useCustomer(id || '');

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Error state - Không có data
  if (error || !customer) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Không tìm thấy khách hàng</CardTitle>
            <CardDescription>
              Khách hàng không tồn tại hoặc đã bị xóa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fullAddress = [
    customer.address,
    customer.ward_name,
    customer.location_name,
  ]
    .filter(Boolean)
    .join(', ');

  const recentProducts = customer.recently_purchased_products ?? [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header với badges */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div>
              <CardTitle>{customer.name || '-'}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge
                    variant={customer.glt_is_active ? 'default' : 'secondary'}
                  >
                    {customer.glt_is_active
                      ? 'Đang hoạt động'
                      : 'Ngừng hoạt động'}
                  </Badge>
                  {customer.groups && (
                    <Badge variant="outline">{customer.groups}</Badge>
                  )}
                  {customer.glt_customer_group_name && (
                    <Badge variant="outline">
                      {customer.glt_customer_group_name}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Mã: {customer.code || `#${customer.id}`}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    KiotViet ID: {customer.kiotviet_id}
                  </span>
                </div>
              </CardDescription>
            </div>
            {/* Cùng rule với list: chỉ khách có groups (bán sỉ) mới in được bảng giá */}
            {customer.groups !== null && (
              <CustomerPrintActions
                kiotvietId={customer.kiotviet_id}
                customerName={customer.name}
                variant="default"
              />
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Thông tin khách hàng - Read-only */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin khách hàng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">
                  Số điện thoại:
                </span>
                <p className="font-medium">{customer.contact_number || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Địa chỉ:</span>
                <p className="font-medium">{fullAddress || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Công nợ:</span>
                <p
                  className={`font-medium ${
                    customer.debt && customer.debt > 0 ? 'text-destructive' : ''
                  }`}
                >
                  {customer.debt !== null
                    ? `${Number(customer.debt).toLocaleString()} VNĐ`
                    : '-'}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">
                  Ngày tạo (KiotViet):
                </span>
                <p className="font-medium">
                  {customer.created_date
                    ? formatDateTime(customer.created_date)
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Cập nhật (KiotViet):
                </span>
                <p className="font-medium">
                  {customer.modified_date
                    ? formatDateTime(customer.modified_date)
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Sync gần nhất:
                </span>
                <p className="font-medium">
                  {customer.synced_at
                    ? formatDateTime(customer.synced_at)
                    : '-'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Search priority:
                </span>
                <p className="font-medium">{customer.search_priority}</p>
              </div>
            </div>
          </div>

          {customer.comments && (
            <div>
              <span className="text-sm text-muted-foreground">
                Ghi chú (KV):
              </span>
              <p className="font-medium whitespace-pre-wrap">
                {customer.comments}
              </p>
            </div>
          )}

          {customer.glt_notes && (
            <div>
              <span className="text-sm text-muted-foreground">
                Ghi chú nội bộ (GLT):
              </span>
              <p className="font-medium whitespace-pre-wrap">
                {customer.glt_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sản phẩm mua gần đây */}
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm mua gần đây</CardTitle>
          <CardDescription>
            Tổng hợp từ 5 hóa đơn gần nhất
            {customer.latest_invoice_datetime && (
              <>
                {' · Giao dịch gần nhất: '}
                {formatDateTime(customer.latest_invoice_datetime)} (
                {formatTimeAgo(customer.latest_invoice_datetime)})
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentProducts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Chưa có dữ liệu mua hàng
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã SP</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead className="text-right">Tổng số lượng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProducts.map(product => (
                    <TableRow key={product.product_code}>
                      <TableCell className="font-mono text-xs">
                        {product.product_code || '-'}
                      </TableCell>
                      <TableCell>{product.product_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        {Number(product.total_quantity).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default CustomerShow;
