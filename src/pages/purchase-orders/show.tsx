import React from 'react';
import { useOne } from '@refinedev/core';
import { useParams, useNavigate } from 'react-router';
import { Printer } from 'lucide-react';

import { ShowView } from '@/components/refine-ui/views/show-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { supabaseClient } from '@/utility';
import type { PurchaseOrderDetail } from '@/pages/purchase-orders/types/purchase-order-list';
import { formatDate, formatDaysAgo } from '@/utils/date';

/**
 * Map status code sang label tiếng Việt
 * @param status - Status code
 * @returns Status label
 */
const getStatusLabel = (status: number | null): string => {
  if (status === null) return 'Chưa xác định';
  const statusMap: Record<number, string> = {
    0: 'Nháp',
    1: 'Đã duyệt',
    2: 'Đã hủy',
    3: 'Hoàn thành',
  };
  return statusMap[status] || `Trạng thái ${status}`;
};

/**
 * Map status code sang variant cho Badge
 * @param status - Status code
 * @returns Badge variant
 */
const getStatusVariant = (
  status: number | null
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === null) return 'outline';
  const variantMap: Record<
    number,
    'default' | 'secondary' | 'destructive' | 'outline'
  > = {
    0: 'secondary',
    1: 'default',
    2: 'destructive',
    3: 'default',
  };
  return variantMap[status] || 'outline';
};

/**
 * Helper function để generate URL in label cho Purchase Order
 * @param poKiotvietId - KiotViet ID của purchase order
 * @returns URL để in tất cả labels của PO
 */
const generatePOLabelUrl = (poKiotvietId: number | string): string => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return `${webhookUrl}/print?printType=label-purchaseorder&glt_purchaseorder_id=${poKiotvietId}`;
};

/**
 * Helper function để generate URL in label cho Purchase Order Detail
 * @param detailId - ID của purchase order detail
 * @returns URL để in label của 1 detail
 */
const generatePODetailLabelUrl = (detailId: number | string): string => {
  const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
  return `${webhookUrl}/print?printType=label-purchaseorder-detail&glt_purchaseorder_detail_id=${detailId}`;
};

/**
 * Component hiển thị chi tiết đơn mua hàng
 * Hiển thị thông tin đơn mua hàng và danh sách chi tiết
 */
export const PurchaseOrderShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Lấy data đơn mua hàng từ ID trong URL
  const {
    query: { data: recordData, isLoading: recordLoading },
  } = useOne({
    resource: 'kv_purchase_orders',
    id: id || '',
    meta: {
      select: '*',
    },
  });

  const record = recordData?.data;

  // State để lưu purchase order details
  const [orderDetails, setOrderDetails] = React.useState<PurchaseOrderDetail[]>(
    []
  );
  const [detailsLoading, setDetailsLoading] = React.useState(false);

  /**
   * Reset state khi id thay đổi (khi navigate giữa các purchase order)
   * Đảm bảo state được clear ngay khi chuyển sang PO khác
   */
  React.useEffect(() => {
    // Reset state ngay khi id thay đổi
    setOrderDetails([]);
    setDetailsLoading(false);
  }, [id]);

  /**
   * Query purchase order details từ bảng kv_purchase_order_details
   * Depend vào cả id (từ URL) và record?.id để đảm bảo fetch lại khi navigate
   */
  React.useEffect(() => {
    const fetchOrderDetails = async () => {
      // Kiểm tra cả id và record?.id để đảm bảo đúng PO
      if (!id || !record?.id || String(record.id) !== String(id)) {
        setOrderDetails([]);
        setDetailsLoading(false);
        return;
      }

      try {
        setDetailsLoading(true);
        const { data, error } = await supabaseClient
          .from('kv_purchase_order_details')
          .select('*')
          .eq('purchase_order_id', record.id)
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching order details:', error);
          setOrderDetails([]);
          return;
        }

        setOrderDetails((data || []) as PurchaseOrderDetail[]);
      } catch (error) {
        console.error('Error fetching order details:', error);
        setOrderDetails([]);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [id, record?.id]); // Depend vào cả id (URL) và record?.id

  // Loading state
  if (recordLoading) {
    return (
      <ShowView>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse">
                <div className="h-6 bg-gray-300 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </ShowView>
    );
  }

  // Error state - Không có data
  if (!recordLoading && !record) {
    return (
      <ShowView>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Không tìm thấy đơn mua hàng</CardTitle>
              <CardDescription>
                Đơn mua hàng không tồn tại hoặc đã bị xóa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate(-1)}>Quay lại</Button>
            </CardContent>
          </Card>
        </div>
      </ShowView>
    );
  }

  // Type guard - Đảm bảo record không undefined từ đây trở đi
  if (!record) {
    return null;
  }

  return (
    <ShowView>
      <div className="space-y-6">
        {/* Header với thông tin cơ bản */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle>
                  Đơn mua hàng: {record.code || `#${record.id}`}
                </CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={getStatusVariant(record.status)}>
                      {getStatusLabel(record.status)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ID: {record.id}
                    </span>
                    {record.kiotviet_id && (
                      <span className="text-sm text-muted-foreground">
                        KiotViet ID: {record.kiotviet_id}
                      </span>
                    )}
                  </div>
                </CardDescription>
              </div>
              {/* Button in nhãn PO */}
              {record.kiotviet_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = generatePOLabelUrl(record.kiotviet_id);
                    window.open(url, '_blank');
                  }}
                  className="ml-4"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  In nhãn PO
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Thông tin đơn mua hàng */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn mua hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Mã đơn:
                    </span>
                    <p className="font-medium">{record.code || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Nhà cung cấp:
                    </span>
                    <p className="font-medium">{record.supplier_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Người mua:
                    </span>
                    <p className="font-medium">{record.purchase_name || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Ngày mua:
                    </span>
                    {record.purchase_date ? (
                      <div>
                        <p className="font-medium">
                          {formatDate(record.purchase_date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDaysAgo(record.purchase_date)}
                        </p>
                      </div>
                    ) : (
                      <p className="font-medium">-</p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Tổng tiền:
                    </span>
                    <p className="font-medium">
                      {record.total
                        ? Number(record.total).toLocaleString('vi-VN')
                        : '-'}{' '}
                      VND
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Thanh toán:
                    </span>
                    <p className="font-medium">
                      {record.total_payment
                        ? Number(record.total_payment).toLocaleString('vi-VN')
                        : '-'}{' '}
                      VND
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {record.description && (
              <>
                <Separator />
                <div>
                  <span className="text-sm text-muted-foreground">Mô tả:</span>
                  <p className="font-medium mt-1">{record.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Chi tiết đơn mua hàng */}
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết đơn mua hàng</CardTitle>
            <CardDescription>
              Danh sách sản phẩm trong đơn mua hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            {detailsLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Đang tải chi tiết...
                </p>
              </div>
            ) : orderDetails.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Mã SP</th>
                      <th className="text-left p-2">Tên SP</th>
                      <th className="text-right p-2">Số lượng</th>
                      <th className="text-right p-2">Đơn giá</th>
                      <th className="text-right p-2">Giảm giá</th>
                      <th className="text-right p-2">Thành tiền</th>
                      <th className="text-left p-2">Trạng thái</th>
                      <th className="text-center p-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.map(detail => {
                      const quantity = Number(detail.quantity || 0);
                      const price = Number(detail.price || 0);
                      const discount = Number(detail.discount || 0);
                      const subtotal = quantity * price - discount;

                      return (
                        <tr key={detail.id} className="border-b">
                          <td className="p-2">{detail.product_code || '-'}</td>
                          <td className="p-2">{detail.product_name || '-'}</td>
                          <td className="p-2 text-right">
                            {quantity.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2 text-right">
                            {price.toLocaleString('vi-VN')} VND
                          </td>
                          <td className="p-2 text-right">
                            {discount.toLocaleString('vi-VN')} VND
                          </td>
                          <td className="p-2 text-right font-medium">
                            {subtotal.toLocaleString('vi-VN')} VND
                          </td>
                          <td className="p-2">
                            <Badge variant="outline">
                              {detail.glt_status || 'pending'}
                            </Badge>
                          </td>
                          <td className="p-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const url = generatePODetailLabelUrl(detail.id);
                                window.open(url, '_blank');
                              }}
                              title="In nhãn chi tiết"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Chưa có chi tiết đơn mua hàng
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Quay lại
          </Button>
        </div>
      </div>
    </ShowView>
  );
};
