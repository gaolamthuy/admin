/**
 * Purchase Order Create Page
 * Sử dụng TanStack Query và React Hook Form
 *
 * @module pages/purchase-orders/PurchaseOrderCreate
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import {
  useCreatePurchaseOrder,
  useSuppliers,
} from '@/hooks/usePurchaseOrders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';

const createPurchaseOrderSchema = z.object({
  code: z.string().min(1, 'Mã đơn là bắt buộc'),
  supplier_id: z.number().optional(),
  description: z.string().optional(),
  purchase_date: z.string().optional(),
});

type CreatePurchaseOrderForm = z.infer<typeof createPurchaseOrderSchema>;

/**
 * Purchase Order Create Page Component
 */
export const PurchaseOrderCreate = () => {
  const navigate = useNavigate();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();

  const form = useForm<CreatePurchaseOrderForm>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: {
      code: '',
      supplier_id: undefined,
      description: '',
      purchase_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: CreatePurchaseOrderForm) => {
    try {
      await createPurchaseOrder.mutateAsync({
        code: data.code,
        supplier_id: data.supplier_id || null,
        description: data.description || null,
        purchase_date: data.purchase_date
          ? new Date(data.purchase_date).toISOString()
          : null,
        total: 0,
        total_payment: 0,
        status: 1,
      });
      toast.success('Tạo đơn mua hàng thành công!');
      navigate('/purchase-orders');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Tạo đơn mua hàng thất bại';
      toast.error(message);
    }
  };

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
          <CardTitle>Tạo đơn mua hàng mới</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã đơn</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="PO-001"
                        disabled={createPurchaseOrder.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supplier_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nhà cung cấp</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={value =>
                        field.onChange(value ? Number(value) : undefined)
                      }
                      disabled={
                        suppliersLoading || createPurchaseOrder.isPending
                      }
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn nhà cung cấp" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers.map(
                          (supplier: { kiotviet_id: number; name: string }) => (
                            <SelectItem
                              key={supplier.kiotviet_id}
                              value={String(supplier.kiotviet_id)}
                            >
                              {supplier.name}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày mua</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        disabled={createPurchaseOrder.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Mô tả đơn mua hàng"
                        disabled={createPurchaseOrder.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4">
                <Button type="submit" disabled={createPurchaseOrder.isPending}>
                  {createPurchaseOrder.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    'Tạo đơn mua hàng'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/purchase-orders')}
                  disabled={createPurchaseOrder.isPending}
                >
                  Hủy
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseOrderCreate;
