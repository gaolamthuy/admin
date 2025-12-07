import { useForm } from '@refinedev/react-hook-form';
import { useNavigate } from 'react-router';

import { EditView } from '@/components/refine-ui/views/edit-view';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Component chỉnh sửa đơn mua hàng
 * Load dữ liệu hiện tại và cho phép cập nhật
 */
export const PurchaseOrderEdit = () => {
  const navigate = useNavigate();

  const {
    refineCore: { onFinish, query },
    ...form
  } = useForm({
    refineCoreProps: {
      meta: {
        select: '*',
      },
    },
  });

  const purchaseOrderData = query?.data?.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onSubmit(values: any) {
    // Xử lý dữ liệu trước khi gửi
    const processedValues = {
      code: values.code || null,
      description: values.description || null,
      supplier_name: values.supplier_name || null,
      purchase_date: values.purchase_date || null,
      discount: values.discount ? parseFloat(values.discount) : null,
      discount_ratio: values.discount_ratio
        ? parseFloat(values.discount_ratio)
        : null,
      total: values.total ? parseFloat(values.total) : null,
      total_payment: values.total_payment
        ? parseFloat(values.total_payment)
        : null,
      status: values.status ? parseInt(values.status) : null,
    };

    onFinish(processedValues);
  }

  return (
    <EditView>
      <div className="space-y-6">
        {/* Card hiển thị thông tin đơn mua hàng (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn mua hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">ID</label>
                <p className="text-sm">{purchaseOrderData?.id || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  KiotViet ID
                </label>
                <p className="text-sm">
                  {purchaseOrderData?.kiotviet_id || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Retailer ID
                </label>
                <p className="text-sm">
                  {purchaseOrderData?.retailer_id || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tổng tiền
                </label>
                <p className="text-sm">
                  {purchaseOrderData?.total
                    ? Number(purchaseOrderData.total).toLocaleString('vi-VN')
                    : 'N/A'}{' '}
                  VND
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card chỉnh sửa các trường có thể edit */}
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa thông tin</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mã đơn mua hàng</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="PO001" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tên nhà cung cấp</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nhà cung cấp ABC" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Mô tả về đơn mua hàng..."
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="total"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tổng tiền (VND)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value || ''}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="total_payment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Thanh toán (VND)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            value={field.value || ''}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    {...form.saveButtonProps}
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting
                      ? 'Đang cập nhật...'
                      : 'Cập nhật'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </EditView>
  );
};
