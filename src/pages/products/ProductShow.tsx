/**
 * Product Show Page
 * Sử dụng TanStack Query để fetch và hiển thị product details
 *
 * @module pages/products/ProductShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  useProductShow,
  useProductPriceComparison,
  useProductInventory,
  useUpdateProduct,
  useUploadBaseProductImage,
  type HomepageImage,
} from './hooks/useProductShow';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { formatDaysAgo, formatDate } from '@/utils/date';
import { toast } from 'sonner';

/**
 * Component hiển thị chi tiết sản phẩm với hot editing
 * Cho phép edit trực tiếp 3 trường với auto-save: glt_retail_promotion, glt_baseprice_markup, glt_labelprint_favorite
 */
export const ProductShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasResetForm = useRef(false);

  // Query product data
  const {
    data: record,
    isLoading: recordLoading,
    error: recordError,
  } = useProductShow(id || '');

  // Query price comparison
  const { data: priceComparison, isLoading: priceComparisonLoading } =
    useProductPriceComparison(record?.code);

  // Query inventory
  const { data: inventory, isLoading: inventoryLoading } = useProductInventory(
    record?.id
  );

  // Mutation để update product
  const updateProduct = useUpdateProduct();
  
  // Mutation để upload base images
  const uploadBaseImage = useUploadBaseProductImage();

  // Form cho inline editing
  const form = useForm({
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  /**
   * Handle upload base image
   */
  const handleUploadBaseImage = async (
    imageType: 'main' | 'package',
    file: File,
  ) => {
    if (!record?.id) return;

    try {
      await toast.promise(
        uploadBaseImage.mutateAsync({
          productId: record.id,
          imageType,
          file,
        }),
        {
          loading: `Đang upload ảnh ${imageType}...`,
          success: `Đã upload ảnh ${imageType} thành công`,
          error: `Upload ảnh ${imageType} thất bại. Vui lòng thử lại.`,
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  // Handle form submission - Auto save khi có thay đổi
  const onSubmit = async (values: {
    glt_retail_promotion: boolean;
    glt_baseprice_markup: number;
    glt_labelprint_favorite: boolean;
  }) => {
    if (!record?.id) return;

    const processedValues = {
      glt_retail_promotion: Boolean(values.glt_retail_promotion),
      glt_baseprice_markup: values.glt_baseprice_markup
        ? parseFloat(String(values.glt_baseprice_markup))
        : 0,
      glt_labelprint_favorite: Boolean(values.glt_labelprint_favorite),
    };

    const promise = updateProduct.mutateAsync({
      id: record.id,
      fields: processedValues,
    });

    await toast.promise(promise, {
      loading: 'Đang lưu thay đổi...',
      success: 'Đã lưu cài đặt sản phẩm',
      error: 'Lưu thất bại. Vui lòng thử lại',
    });
  };

  // Loading state
  if (recordLoading) {
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
  if (recordError || !record) {
    return (
      <div className="container mx-auto py-6 space-y-6">
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
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header với badges */}
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

      {/* Tabs: Thông tin, Hình ảnh, Cài đặt */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="images">Hình ảnh</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>

        {/* Tab Thông tin */}
        <TabsContent value="info" className="space-y-6">
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
            </CardContent>
          </Card>

          {/* So sánh giá với lịch sử nhập hàng */}
          <Card>
            <CardHeader>
              <CardTitle>So sánh giá với lịch sử nhập hàng</CardTitle>
              <CardDescription>
                So sánh giá hiện tại với giá nhập hàng (bao gồm chi phí phụ)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceComparisonLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-sm text-muted-foreground">
                    Đang tải dữ liệu so sánh giá...
                  </div>
                </div>
              ) : priceComparison && priceComparison.latest_purchase_order_id ? (
                <div className="space-y-6">
                  {/* Thông tin tổng quan */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">
                        Giá tồn kho (Cost)
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {inventoryLoading ? (
                          <span className="text-sm text-muted-foreground">
                            Đang tải...
                          </span>
                        ) : inventory?.cost ? (
                          `${Number(inventory.cost).toLocaleString()} VNĐ`
                        ) : (
                          '-'
                        )}
                      </div>
                      {inventory?.branch_name && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {inventory.branch_name}
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">
                        Giá nhập mới nhất
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {priceComparison.latest_total_cost_per_unit
                          ? Number(
                              priceComparison.latest_total_cost_per_unit
                            ).toLocaleString()
                          : '-'}{' '}
                        VNĐ
                      </div>
                      {priceComparison.new_baseprice_suggestion && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Giá bán đề xuất:{' '}
                          <span className="font-semibold">
                            {Number(
                              priceComparison.new_baseprice_suggestion
                            ).toLocaleString()}{' '}
                            VNĐ
                          </span>
                        </div>
                      )}
                      {priceComparison.latest_purchase_date && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(priceComparison.latest_purchase_date)} (
                          {formatDaysAgo(priceComparison.latest_purchase_date)})
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">
                        Chênh lệch (Cost - Giá nhập)
                      </div>
                      {(() => {
                        const costDiff = priceComparison.cost_diff_from_latest_po;
                        const cost = inventory?.cost;
                        const costDiffPercent =
                          cost && cost > 0 && costDiff !== null
                            ? (costDiff / cost) * 100
                            : null;

                        return (
                          <>
                            <div
                              className={`text-2xl font-bold mt-1 ${
                                costDiff !== null && costDiff > 0
                                  ? 'text-green-600 dark:text-green-400'
                                  : costDiff !== null && costDiff < 0
                                    ? 'text-destructive'
                                    : ''
                              }`}
                            >
                              {costDiff !== null
                                ? `${costDiff > 0 ? '+' : ''}${Number(
                                    costDiff
                                  ).toLocaleString()} VNĐ`
                                : '-'}
                            </div>
                            {costDiffPercent !== null && (
                              <div
                                className={`text-xs mt-1 ${
                                  costDiffPercent > 0
                                    ? 'text-green-600 dark:text-green-400'
                                    : costDiffPercent < 0
                                      ? 'text-destructive'
                                      : ''
                                }`}
                              >
                                ({costDiffPercent > 0 ? '+' : ''}
                                {Number(costDiffPercent).toFixed(2)}%)
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Bảng lịch sử 5 purchase orders gần đây */}
                  {priceComparison.recent_purchases &&
                    priceComparison.recent_purchases.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-3">
                          Lịch sử nhập hàng gần đây (5 lần)
                        </h4>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Ngày nhập</TableHead>
                                <TableHead>Mã đơn</TableHead>
                                <TableHead>Nhà cung cấp</TableHead>
                                <TableHead className="text-right">
                                  Giá nhập
                                </TableHead>
                                <TableHead className="text-right">
                                  Chi phí phụ
                                </TableHead>
                                <TableHead className="text-right">
                                  Tổng chi phí
                                </TableHead>
                                <TableHead className="text-right">
                                  Số lượng
                                </TableHead>
                                <TableHead className="text-right">
                                  Chênh lệch vs Cost
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {priceComparison.recent_purchases.map(
                                (purchase, index) => {
                                  const cost = inventory?.cost;
                                  const totalCost = purchase.total_cost_per_unit;
                                  const costDifference =
                                    cost && totalCost ? totalCost - cost : null;
                                  const costDifferencePercent =
                                    cost && totalCost && cost > 0
                                      ? ((totalCost - cost) / cost) * 100
                                      : null;

                                  return (
                                    <TableRow key={index}>
                                      <TableCell>
                                        <div>
                                          {purchase.purchase_date
                                            ? formatDate(purchase.purchase_date)
                                            : '-'}
                                        </div>
                                        {purchase.purchase_date && (
                                          <div className="text-xs text-muted-foreground">
                                            {formatDaysAgo(purchase.purchase_date)}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell className="font-mono text-xs">
                                        {purchase.purchase_order_code || '-'}
                                      </TableCell>
                                      <TableCell>
                                        {purchase.supplier_name || '-'}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {Number(purchase.price).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {Number(
                                          purchase.glt_extra_cost_per_unit
                                        ).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">
                                        {Number(
                                          purchase.total_cost_per_unit
                                        ).toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {Number(purchase.quantity).toLocaleString()}
                                      </TableCell>
                                      <TableCell
                                        className={`text-right font-medium ${
                                          costDifference && costDifference > 0
                                            ? 'text-destructive'
                                            : costDifference && costDifference < 0
                                              ? 'text-green-600 dark:text-green-400'
                                              : ''
                                        }`}
                                      >
                                        {costDifference !== null ? (
                                          <>
                                            {costDifference > 0 ? '+' : ''}
                                            {Number(
                                              costDifference
                                            ).toLocaleString()}
                                            {costDifferencePercent !== null && (
                                              <span className="text-xs ml-1">
                                                (
                                                {costDifferencePercent > 0
                                                  ? '+'
                                                  : ''}
                                                {Number(
                                                    costDifferencePercent
                                                  ).toFixed(2)}
                                                %)
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          '-'
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                }
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Chưa có dữ liệu nhập hàng để so sánh
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Hình ảnh */}
        <TabsContent value="images" className="space-y-6">
          {/* Section 1: Ảnh gốc upload (glt_images_upload) */}
          <Card>
            <CardHeader>
              <CardTitle>Ảnh gốc upload</CardTitle>
              <CardDescription>
                Upload ảnh gốc để xử lý thành các phiên bản hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Image Upload */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Ảnh Main</div>
                  {record?.glt_images_upload?.main ? (
                    <div className="relative rounded-lg border overflow-hidden">
                      <img
                        src={record.glt_images_upload.main}
                        alt="Main upload"
                        className="w-[300px] h-[400px] object-cover"
                        onClick={() => window.open(record.glt_images_upload.main, '_blank')}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                      <label className="cursor-pointer w-full h-full flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && record?.id) {
                              handleUploadBaseImage('main', file);
                            }
                          }}
                          disabled={uploadBaseImage.isPending}
                        />
                        <div className="text-center text-muted-foreground text-xs">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <p>Upload ảnh main</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {/* Package Image Upload */}
                <div className="space-y-3">
                  <div className="text-sm font-medium">Ảnh Package</div>
                  {record?.glt_images_upload?.package ? (
                    <div className="relative rounded-lg border overflow-hidden">
                      <img
                        src={record.glt_images_upload.package}
                        alt="Package upload"
                        className="w-[300px] h-[400px] object-cover"
                        onClick={() => window.open(record.glt_images_upload.package, '_blank')}
                      />
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                      <label className="cursor-pointer w-full h-full flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && record?.id) {
                              handleUploadBaseImage('package', file);
                            }
                          }}
                          disabled={uploadBaseImage.isPending}
                        />
                        <div className="text-center text-muted-foreground text-xs">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <p>Upload ảnh package</p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {uploadBaseImage.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang upload...
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 2: Ảnh đã xử lý (glt_images_homepage) */}
          <Card>
            <CardHeader>
              <CardTitle>Ảnh hiển thị</CardTitle>
              <CardDescription>
                Các ảnh đã được xử lý và sử dụng để hiển thị
              </CardDescription>
            </CardHeader>
            <CardContent>
              {record?.glt_images_homepage && record.glt_images_homepage.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {record.glt_images_homepage.map((image: HomepageImage) => (
                    <div key={image.id} className="space-y-2">
                      <div className="text-sm font-medium text-muted-foreground">
                        {image.description || image.id}
                      </div>
                      <div className="relative rounded-lg border overflow-hidden">
                        <img
                          src={image.url}
                          alt={image.description || image.id}
                          className="w-[300px] h-[400px] object-cover"
                          onClick={() => window.open(image.url, '_blank')}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <div>Order: {image.order}</div>
                        {image.updatedAt && (
                          <div>{formatDaysAgo(new Date(image.updatedAt * 1000).toISOString())}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  Chưa có ảnh hiển thị. Vui lòng upload ảnh gốc từ phần trên.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Cài đặt */}
        <TabsContent value="settings" className="space-y-6">
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
                  noValidate
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="glt_retail_promotion"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Khuyến mãi</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Bật/tắt chế độ khuyến mãi
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? false}
                              disabled={updateProduct.isPending}
                              onCheckedChange={value => {
                                field.onChange(value);
                                setTimeout(() => {
                                  form.handleSubmit(onSubmit)();
                                }, 0);
                              }}
                            />
                          </FormControl>
                          {updateProduct.isPending && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
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
                              type="text"
                              value={field.value || ''}
                              placeholder="0"
                              disabled={updateProduct.isPending}
                              onChange={e => {
                                field.onChange(e.target.value);
                              }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  form.handleSubmit(onSubmit)();
                                }
                              }}
                              onBlur={() => {
                                form.handleSubmit(onSubmit)();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {updateProduct.isPending && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Đang lưu...
                            </div>
                          )}
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
                              disabled={updateProduct.isPending}
                              onCheckedChange={value => {
                                field.onChange(value);
                                setTimeout(() => {
                                  form.handleSubmit(onSubmit)();
                                }, 0);
                              }}
                            />
                          </FormControl>
                          {updateProduct.isPending && (
                            <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </div>
    </div>
  );
};

export default ProductShow;
