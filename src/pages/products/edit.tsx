import { useForm } from '@refinedev/react-hook-form';
import { useNavigate } from 'react-router';
import { useEffect, useRef } from 'react';

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
// import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Component chỉnh sửa sản phẩm
 * Load dữ liệu hiện tại và cho phép cập nhật
 */
export const ProductEdit = () => {
  const navigate = useNavigate();

  const {
    refineCore: { onFinish, query },
    ...form
  } = useForm({
    refineCoreProps: {
      meta: {
        select: '*, kv_product_categories(category_name)',
      },
    },
  });

  const productData = query?.data?.data;
  const hasResetForm = useRef(false);

  // Set form values khi productData thay đổi
  useEffect(() => {
    if (productData && !hasResetForm.current) {
      form.reset({
        glt_retail_promotion: productData.glt_retail_promotion ?? false,
        glt_baseprice_markup: productData.glt_baseprice_markup || 0,
        glt_labelprint_favorite: productData.glt_labelprint_favorite ?? false,
      });
      hasResetForm.current = true;
    }
  }, [productData, form]);

  // Không cần query categories vì đã có category_name trong productData

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onSubmit(values: any) {
    // Chỉ gửi 3 trường có thể edit
    const processedValues = {
      glt_retail_promotion: values.glt_retail_promotion ?? false,
      glt_baseprice_markup: values.glt_baseprice_markup
        ? parseFloat(values.glt_baseprice_markup)
        : 0,
      glt_labelprint_favorite: values.glt_labelprint_favorite ?? false,
    };

    onFinish(processedValues);
  }

  return (
    <EditView>
      <div className="space-y-6">
        {/* Card hiển thị thông tin sản phẩm (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Mã sản phẩm
                </label>
                <p className="text-sm">{productData?.code || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tên sản phẩm
                </label>
                <p className="text-sm">{productData?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tên đầy đủ
                </label>
                <p className="text-sm">{productData?.full_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Danh mục
                </label>
                <p className="text-sm">{productData?.category_name || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Đơn vị
                </label>
                <p className="text-sm">{productData?.unit || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Giá bán (VND)
                </label>
                <p className="text-sm">
                  {productData?.base_price
                    ? Number(productData.base_price).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Trọng lượng (kg)
                </label>
                <p className="text-sm">{productData?.weight || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Mô tả
                </label>
                <p className="text-sm">{productData?.description || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card chỉnh sửa các trường có thể edit */}
        <Card>
          <CardHeader>
            <CardTitle>Chỉnh sửa cài đặt</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="glt_retail_promotion"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Khuyến mãi
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="glt_baseprice_markup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Markup giá (VND)</FormLabel>
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
                    name="glt_labelprint_favorite"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Yêu thích in nhãn
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
                      : 'Cập nhật cài đặt'}
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
