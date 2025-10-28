import { useOne } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useRef } from 'react';

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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
// Không cần import icons nữa vì đã xóa edit buttons

/**
 * Component hiển thị chi tiết sản phẩm với hot editing
 * Cho phép edit trực tiếp 3 trường với auto-save: glt_retail_promotion, glt_baseprice_markup, glt_labelprint_favorite
 */
export const ProductShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasResetForm = useRef(false);

  // Lấy data sản phẩm từ ID trong URL
  const {
    query: { data: recordData, isLoading: recordLoading },
  } = useOne({
    resource: 'kv_products',
    id: id || '',
    meta: {
      select: '*, glt_images_homepage, glt_custom_image_url', // Bao gồm cả images fields
    },
  });

  const record = recordData?.data;

  // Không cần query riêng category vì đã có category_name trong record

  // Form cho inline editing
  const {
    refineCore: { onFinish },
    ...form
  } = useForm({
    refineCoreProps: {
      meta: {
        select: '*, glt_images_homepage, glt_custom_image_url', // Bao gồm cả images fields
      },
    },
    defaultValues: {
      glt_retail_promotion: false,
      glt_baseprice_markup: 0,
      glt_labelprint_favorite: false,
    },
  });

  // Set form values khi record thay đổi
  useEffect(() => {
    if (record && !hasResetForm.current) {
      form.reset({
        glt_retail_promotion: record.glt_retail_promotion ?? false,
        glt_baseprice_markup: record.glt_baseprice_markup || 0,
        glt_labelprint_favorite: record.glt_labelprint_favorite ?? false,
      });
      hasResetForm.current = true;
    }
  }, [record]); // Loại bỏ form khỏi dependency array để tránh vòng lặp vô hạn

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
              <CardTitle>Không tìm thấy sản phẩm</CardTitle>
              <CardDescription>
                Sản phẩm không tồn tại hoặc đã bị xóa.
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

  // Handle form submission - Auto save khi có thay đổi
  const onSubmit = (values: Record<string, unknown>) => {
    const processedValues = {
      glt_retail_promotion: Boolean(values.glt_retail_promotion),
      glt_baseprice_markup: values.glt_baseprice_markup
        ? parseFloat(String(values.glt_baseprice_markup))
        : 0,
      glt_labelprint_favorite: Boolean(values.glt_labelprint_favorite),
    };

    onFinish(processedValues);
  };

  return (
    <ShowView>
      <div className="space-y-6">
        {/* Header với edit button */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{record.name}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge variant={record.is_active ? 'default' : 'secondary'}>
                      {record.is_active ? 'Hoạt động' : 'Tạm dừng'}
                    </Badge>
                    <Badge variant={record.glt_visible ? 'default' : 'outline'}>
                      {record.glt_visible ? 'Hiển thị' : 'Ẩn'}
                    </Badge>
                    {record.glt_retail_promotion && (
                      <Badge variant="destructive">Khuyến mãi</Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      ID: {record.id}
                    </span>
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Thông tin sản phẩm - Read-only */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin sản phẩm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Mã sản phẩm:
                    </span>
                    <p className="font-medium">{record.code || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Tên đầy đủ:
                    </span>
                    <p className="font-medium">{record.full_name || '-'}</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Giá bán (VND):
                    </span>
                    <p className="font-medium">
                      {record.base_price
                        ? Number(record.base_price).toLocaleString()
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Danh mục:
                    </span>
                    <p className="font-medium">{record.category_name || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Hiển thị hình ảnh sản phẩm */}
            {(record.images && record.images.length > 0) ||
            record.glt_images_homepage ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Hình ảnh sản phẩm</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Hiển thị images array */}
                  {record.images &&
                    record.images.map((image: string, index: number) => (
                      <div key={`images-${index}`} className="relative group">
                        <img
                          src={image}
                          alt={`${record.name} - Hình ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                          onError={e => {
                            e.currentTarget.src = '/placeholder-product.png';
                          }}
                          onClick={() => window.open(image, '_blank')}
                        />
                      </div>
                    ))}

                  {/* Hiển thị glt_images_homepage nếu có */}
                  {record.glt_images_homepage &&
                    Array.isArray(record.glt_images_homepage) &&
                    record.glt_images_homepage.map(
                      (
                        image: string | { url?: string; src?: string },
                        index: number
                      ) => {
                        const imageUrl =
                          typeof image === 'string'
                            ? image
                            : image.url || image.src;
                        return (
                          <div
                            key={`glt-images-${index}`}
                            className="relative group"
                          >
                            <img
                              src={imageUrl}
                              alt={`${record.name} - Hình homepage ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border hover:scale-105 transition-transform cursor-pointer"
                              onError={e => {
                                e.currentTarget.src =
                                  '/placeholder-product.png';
                              }}
                              onClick={() => window.open(imageUrl, '_blank')}
                            />
                          </div>
                        );
                      }
                    )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click vào hình để xem kích thước đầy đủ
                </p>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium mb-2">Hình ảnh sản phẩm</h4>
                <p className="text-sm text-muted-foreground">
                  Chưa có hình ảnh
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cài đặt có thể chỉnh sửa */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt sản phẩm</CardTitle>
            <CardDescription>
              Các cài đặt sẽ tự động lưu khi thay đổi
            </CardDescription>
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
                          <p className="text-sm text-muted-foreground">
                            Bật/tắt chế độ khuyến mãi
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={value => {
                              field.onChange(value);
                              // Auto-save khi thay đổi
                              form.handleSubmit(onSubmit)();
                            }}
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
                            onChange={e => {
                              field.onChange(e);
                              // Auto-save khi thay đổi (debounce)
                              clearTimeout(
                                (
                                  window as unknown as {
                                    markupTimeout?: NodeJS.Timeout;
                                  }
                                ).markupTimeout
                              );
                              (
                                window as unknown as {
                                  markupTimeout?: NodeJS.Timeout;
                                }
                              ).markupTimeout = setTimeout(() => {
                                form.handleSubmit(onSubmit)();
                              }, 1000);
                            }}
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
                          <p className="text-sm text-muted-foreground">
                            Ưu tiên in nhãn cho sản phẩm này
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={value => {
                              field.onChange(value);
                              // Auto-save khi thay đổi
                              form.handleSubmit(onSubmit)();
                            }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
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
