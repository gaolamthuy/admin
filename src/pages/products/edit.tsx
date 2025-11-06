import { useForm } from '@refinedev/react-hook-form';
import { useNavigate } from 'react-router';
import { useEffect, useRef, useState, useCallback } from 'react';

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
import { uploadImageToCloudinary, validateImageFile } from '@/lib/cloudinary';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

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
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

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
  const onSelectFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setUploadError(null);
    setUploadedUrl(null);
    setFile(f);
  }, []);

  const onUpload = useCallback(async () => {
    if (!file) return;
    if (!productData?.kiotviet_id) {
      setUploadError('Thiếu kiotviet_id để đặt public_id');
      return;
    }
    try {
      validateImageFile(file);
      setUploading(true);
      const res = await uploadImageToCloudinary({
        file,
        kiotvietId: productData.kiotviet_id,
      });
      setUploadedUrl(res.secure_url);
      toast.success('Upload ảnh thành công', {
        description: productData?.full_name || productData?.name,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload thất bại';
      setUploadError(msg);
      toast.error('Upload ảnh thất bại', { description: String(msg) });
    } finally {
      setUploading(false);
    }
  }, [file, productData?.kiotviet_id]);

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

        {/* Cloudinary upload (tạm thời) */}
        <Card>
          <CardHeader>
            <CardTitle>Ảnh sản phẩm (Cloudinary tạm)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={onSelectFile} />
                <Button
                  type="button"
                  onClick={onUpload}
                  disabled={!file || uploading}
                >
                  {uploading ? 'Đang upload...' : 'Upload ảnh'}
                </Button>
              </div>
              {uploading && <Progress value={60} className="w-full" />}
              {uploadError && (
                <p className="text-sm text-red-600">{uploadError}</p>
              )}
              {uploadedUrl && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Đã upload: </p>
                  <img
                    src={uploadedUrl}
                    alt="Uploaded preview"
                    className="max-h-48 rounded border"
                  />
                </div>
              )}
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
