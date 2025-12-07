import { useOne } from '@refinedev/core';
import { useInvalidate } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { useEffect, useMemo, useRef, useState } from 'react';

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
import { Loader2 } from 'lucide-react';
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
import { supabaseClient } from '@/utility';
import { formatDaysAgo, formatDate } from '@/utils/date';
import { toast } from 'sonner';
// Không cần import icons nữa vì đã xóa edit buttons

/**
 * Interface cho product image từ bảng glt_product_images
 */
interface ProductImage {
  id: number;
  product_id: number | null;
  url: string | null;
  path: string | null;
  role: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  alt: string | null;
  description: string | null;
  rev: number | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Interface cho dữ liệu từ view v_product_compare_pod
 */
interface PurchaseOrderDetail {
  purchase_order_id: number;
  purchase_order_code: string;
  purchase_date: string | null;
  supplier_name: string | null;
  price: number;
  quantity: number;
  glt_extra_cost_per_unit: number;
  total_cost_per_unit: number;
  price_difference: number;
  price_difference_percent: number | null;
}

interface ProductPriceComparison {
  product_id: number;
  product_code: string;
  product_name: string;
  base_price: number;
  new_baseprice_suggestion: number | null;
  recent_purchases: PurchaseOrderDetail[];
  purchase_stats: {
    avg_price: number | null;
    avg_total_cost: number | null;
    min_price: number | null;
    max_price: number | null;
    latest_price: number | null;
    latest_total_cost: number | null;
    total_quantity: number | null;
    purchase_count: number;
  };
  latest_purchase_order_id: number | null;
  latest_purchase_date: string | null;
  latest_total_cost_per_unit: number | null;
  latest_price_difference: number | null;
  latest_price_difference_percent: number | null;
}

/**
 * Interface cho inventory cost từ kv_product_inventories
 */
interface ProductInventory {
  product_id: number;
  cost: number | null;
  branch_id: number | null;
  branch_name: string | null;
}

/**
 * Component hiển thị chi tiết sản phẩm với hot editing
 * Cho phép edit trực tiếp 3 trường với auto-save: glt_retail_promotion, glt_baseprice_markup, glt_labelprint_favorite
 */
export const ProductShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasResetForm = useRef(false);
  // Hook để invalidates cache/query sau khi cập nhật nhằm tránh trạng thái cũ khi quay lại list
  const invalidate = useInvalidate();

  // State để lưu product images từ glt_product_images
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);

  // State để lưu dữ liệu so sánh giá từ view v_product_compare_pod
  const [priceComparison, setPriceComparison] =
    useState<ProductPriceComparison | null>(null);
  const [priceComparisonLoading, setPriceComparisonLoading] = useState(false);

  // State để lưu inventory cost từ kv_product_inventories
  const [inventory, setInventory] = useState<ProductInventory | null>(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [savingField, setSavingField] = useState<
    | 'glt_retail_promotion'
    | 'glt_baseprice_markup'
    | 'glt_labelprint_favorite'
    | null
  >(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

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

  /**
   * Phân loại ảnh theo role để hiển thị nhóm main/package
   */
  const imagesByRole = useMemo(() => {
    const map: Record<string, ProductImage> = {};
    productImages.forEach(image => {
      if (image.role) {
        map[image.role] = image;
      }
    });
    return map;
  }, [productImages]);

  const mainImage = imagesByRole['main'];
  const mainThumbnail = imagesByRole['main-thumbnail'];
  const mainOriginal = imagesByRole['main-original'];
  const mainResized = imagesByRole['main-resized'];
  const mainInfocard = imagesByRole['main-infoCard'];

  const packageImage = imagesByRole['package'];
  const packageThumbnail = imagesByRole['package-thumbnail'];
  const packageOriginal = imagesByRole['package-original'];

  /**
   * Query product images từ bảng glt_product_images
   * Sắp xếp theo role priority: main > package > main-thumbnail > main-resized > main-original > main-infocard
   */
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!record?.kiotviet_id) {
        setProductImages([]);
        return;
      }

      try {
        setImagesLoading(true);
        const { data, error } = await supabaseClient
          .from('glt_product_images')
          .select('*')
          .eq('product_id', record.kiotviet_id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching product images:', error);
          setProductImages([]);
          return;
        }

        // Sắp xếp theo role priority
        const rolePriority: Record<string, number> = {
          main: 1,
          package: 2,
          'package-thumbnail': 3,
          'package-original': 4,
          'main-thumbnail': 5,
          'main-resized': 6,
          'main-original': 7,
          'main-infoCard': 8,
        };

        const sortedImages = (data || []).sort((a, b) => {
          const priorityA = rolePriority[a.role || ''] || 999;
          const priorityB = rolePriority[b.role || ''] || 999;
          return priorityA - priorityB;
        });

        setProductImages(sortedImages as ProductImage[]);
      } catch (error) {
        console.error('Error fetching product images:', error);
        setProductImages([]);
      } finally {
        setImagesLoading(false);
      }
    };

    fetchProductImages();
  }, [record?.kiotviet_id]);

  /**
   * Render helper hiển thị metadata badge cho các role con (main-original, main-resized, etc.)
   * @param roleName Tên role hiển thị
   * @param image Ảnh tương ứng (có thể null nếu chưa có)
   */
  const renderRoleMetadataBadge = (
    roleName: string,
    image?: ProductImage | null
  ) => {
    const hasImage = Boolean(image?.url || image?.path);
    const url = image?.url || image?.path;
    const rev = image?.rev;
    const updatedAt = image?.updated_at;

    return (
      <div
        key={roleName}
        className={`flex items-center justify-between p-3 rounded-lg border ${
          hasImage
            ? 'bg-muted/30 border-border hover:bg-muted/50 cursor-pointer'
            : 'bg-muted/10 border-dashed'
        } transition-colors`}
        onClick={() => {
          if (hasImage && url) {
            window.open(url, '_blank');
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {roleName}
          </span>
          {hasImage ? (
            <span className="text-green-600" title="Available">
              ✅
            </span>
          ) : (
            <span className="text-muted-foreground" title="Missing">
              ⚠️
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {rev && (
            <span className="font-mono">Rev: {rev.toString().slice(-8)}</span>
          )}
          {updatedAt && <span>{formatDaysAgo(updatedAt)}</span>}
        </div>
      </div>
    );
  };

  /**
   * Query dữ liệu so sánh giá từ view v_product_compare_pod
   */
  useEffect(() => {
    const fetchPriceComparison = async () => {
      if (!record?.code) {
        setPriceComparison(null);
        return;
      }

      try {
        setPriceComparisonLoading(true);
        const { data, error } = await supabaseClient
          .from('v_product_compare_pod')
          .select('*')
          .eq('product_code', record.code)
          .single();

        if (error) {
          // Không có dữ liệu hoặc lỗi - không phải vấn đề nghiêm trọng
          if (error.code !== 'PGRST116') {
            // PGRST116 = no rows returned
            console.error('Error fetching price comparison:', error);
          }
          setPriceComparison(null);
          return;
        }

        setPriceComparison(data as ProductPriceComparison);
      } catch (error) {
        console.error('Error fetching price comparison:', error);
        setPriceComparison(null);
      } finally {
        setPriceComparisonLoading(false);
      }
    };

    fetchPriceComparison();
  }, [record?.code]);

  /**
   * Query inventory cost từ kv_product_inventories
   */
  useEffect(() => {
    const fetchInventory = async () => {
      if (!record?.id) {
        setInventory(null);
        return;
      }

      try {
        setInventoryLoading(true);
        const { data, error } = await supabaseClient
          .from('kv_product_inventories')
          .select('product_id, cost, branch_id, branch_name')
          .eq('product_id', record.id)
          .single();

        if (error) {
          // Không có dữ liệu hoặc lỗi - không phải vấn đề nghiêm trọng
          if (error.code !== 'PGRST116') {
            // PGRST116 = no rows returned
            console.error('Error fetching inventory:', error);
          }
          setInventory(null);
          return;
        }

        setInventory(data as ProductInventory);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setInventory(null);
      } finally {
        setInventoryLoading(false);
      }
    };

    fetchInventory();
  }, [record?.id]);

  // Form cho inline editing
  const {
    refineCore: { onFinish: _onFinish }, // eslint-disable-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const onSubmit = async (values: Record<string, unknown>) => {
    const processedValues = {
      glt_retail_promotion: Boolean(values.glt_retail_promotion),
      glt_baseprice_markup: values.glt_baseprice_markup
        ? parseFloat(String(values.glt_baseprice_markup))
        : 0,
      glt_labelprint_favorite: Boolean(values.glt_labelprint_favorite),
    };

    // Tránh POST (create) gây lỗi RLS; luôn UPDATE theo id hiện tại
    const promise = supabaseClient
      .from('kv_products')
      .update(processedValues)
      .eq('id', record.id)
      .select('id')
      .then(({ error }) => {
        if (error) {
          throw error;
        }
        setLastSavedAt(Date.now());
        // Invalidate mọi query liên quan để khi quay về list không bị dữ liệu/icon cũ (stale cache)
        invalidate({
          resource: 'kv_products',
          invalidates: ['list', 'detail', 'many', 'all'],
        });
        return true;
      });

    await toast.promise(promise as unknown as Promise<boolean>, {
      loading: 'Đang lưu thay đổi...',
      success: 'Đã lưu cài đặt sản phẩm',
      error: 'Lưu thất bại. Vui lòng thử lại',
    });
    setSavingField(null);
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

            {/* Hiển thị hình ảnh sản phẩm theo nhóm main/package */}
            <div>
              <h4 className="text-sm font-medium mb-4">Hình ảnh sản phẩm</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Image Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Main Image</CardTitle>
                      {imagesLoading && (
                        <span className="text-xs text-muted-foreground">
                          Đang tải...
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hiển thị ảnh main chính */}
                    {mainImage ? (
                      <div className="relative rounded-lg border overflow-hidden group">
                        <img
                          src={
                            mainImage.url ||
                            mainImage.path ||
                            '/placeholder-product.png'
                          }
                          alt={mainImage.alt || 'Main image'}
                          className="w-full h-64 object-cover transition-transform group-hover:scale-105 cursor-pointer"
                          onError={e => {
                            e.currentTarget.src = '/placeholder-product.png';
                          }}
                          onClick={() => {
                            const url = mainImage.url || mainImage.path;
                            if (url) {
                              window.open(url, '_blank');
                            }
                          }}
                        />
                        <Badge
                          variant="default"
                          className="absolute top-2 left-2 text-xs"
                        >
                          Main
                        </Badge>
                        {mainImage.width && mainImage.height && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {mainImage.width} × {mainImage.height}px
                            {mainImage.format &&
                              ` • ${mainImage.format.toUpperCase()}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 h-64 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">Chưa có ảnh main</p>
                          <p className="text-xs mt-1">Placeholder</p>
                        </div>
                      </div>
                    )}

                    {/* Metadata section cho các role con */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground uppercase">
                        Metadata
                      </h5>
                      <div className="space-y-2">
                        {renderRoleMetadataBadge('main-original', mainOriginal)}
                        {renderRoleMetadataBadge('main-resized', mainResized)}
                        {renderRoleMetadataBadge(
                          'main-thumbnail',
                          mainThumbnail
                        )}
                        {renderRoleMetadataBadge('main-infoCard', mainInfocard)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Package Image Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Package Image</CardTitle>
                      {imagesLoading && (
                        <span className="text-xs text-muted-foreground">
                          Đang tải...
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Hiển thị ảnh package chính */}
                    {packageImage ? (
                      <div className="relative rounded-lg border overflow-hidden group">
                        <img
                          src={
                            packageImage.url ||
                            packageImage.path ||
                            '/placeholder-product.png'
                          }
                          alt={packageImage.alt || 'Package image'}
                          className="w-full h-64 object-cover transition-transform group-hover:scale-105 cursor-pointer"
                          onError={e => {
                            e.currentTarget.src = '/placeholder-product.png';
                          }}
                          onClick={() => {
                            const url = packageImage.url || packageImage.path;
                            if (url) {
                              window.open(url, '_blank');
                            }
                          }}
                        />
                        <Badge
                          variant="default"
                          className="absolute top-2 left-2 text-xs"
                        >
                          Package
                        </Badge>
                        {packageImage.width && packageImage.height && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            {packageImage.width} × {packageImage.height}px
                            {packageImage.format &&
                              ` • ${packageImage.format.toUpperCase()}`}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 h-64 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                          <p className="text-sm">Chưa có ảnh package</p>
                          <p className="text-xs mt-1">Placeholder</p>
                        </div>
                      </div>
                    )}

                    {/* Metadata section cho các role con của package */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-medium text-muted-foreground uppercase">
                        Metadata
                      </h5>
                      <div className="space-y-2">
                        {renderRoleMetadataBadge(
                          'package-thumbnail',
                          packageThumbnail
                        )}
                        {renderRoleMetadataBadge(
                          'package-original',
                          packageOriginal
                        )}
                        {/* Có thể thêm các role khác của package ở đây nếu cần */}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                            disabled={savingField === 'glt_retail_promotion'}
                            onCheckedChange={value => {
                              field.onChange(value);
                              // Auto-save khi thay đổi
                              setSavingField('glt_retail_promotion');
                              // đảm bảo state đã cập nhật trước khi submit
                              setTimeout(() => {
                                form.handleSubmit(onSubmit)();
                              }, 0);
                            }}
                          />
                        </FormControl>
                        {savingField === 'glt_retail_promotion' && (
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
                            disabled={savingField === 'glt_baseprice_markup'}
                            onChange={e => {
                              // chỉ cập nhật state form, chưa submit
                              field.onChange(e.target.value);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                setSavingField('glt_baseprice_markup');
                                form.handleSubmit(onSubmit)();
                              }
                            }}
                            onBlur={() => {
                              // save khi rời focus
                              setSavingField('glt_baseprice_markup');
                              form.handleSubmit(onSubmit)();
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                        {savingField === 'glt_baseprice_markup' && (
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
                            disabled={savingField === 'glt_labelprint_favorite'}
                            onCheckedChange={value => {
                              field.onChange(value);
                              // Auto-save khi thay đổi
                              setSavingField('glt_labelprint_favorite');
                              setTimeout(() => {
                                form.handleSubmit(onSubmit)();
                              }, 0);
                            }}
                          />
                        </FormControl>
                        {savingField === 'glt_labelprint_favorite' && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </FormItem>
                    )}
                  />
                </div>
                {lastSavedAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Đã lưu {formatDaysAgo(new Date(lastSavedAt).toISOString())}
                  </p>
                )}
              </form>
            </Form>
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
                      Chênh lệch (Giá nhập - Cost)
                    </div>
                    {(() => {
                      const cost = inventory?.cost;
                      const latestCost =
                        priceComparison.latest_total_cost_per_unit;
                      const difference =
                        cost && latestCost ? latestCost - cost : null;
                      const differencePercent =
                        cost && latestCost && cost > 0
                          ? ((latestCost - cost) / cost) * 100
                          : null;

                      return (
                        <>
                          <div
                            className={`text-2xl font-bold mt-1 ${
                              difference && difference > 0
                                ? 'text-red-600'
                                : difference && difference < 0
                                  ? 'text-green-600'
                                  : ''
                            }`}
                          >
                            {difference !== null
                              ? `${Number(difference).toLocaleString()} VNĐ`
                              : '-'}
                          </div>
                          {differencePercent !== null && (
                            <div
                              className={`text-xs mt-1 ${
                                differencePercent > 0
                                  ? 'text-red-600'
                                  : differencePercent < 0
                                    ? 'text-green-600'
                                    : ''
                              }`}
                            >
                              ({differencePercent > 0 ? '+' : ''}
                              {Number(differencePercent).toFixed(2)}%)
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
                                // Tính chênh lệch với cost thay vì base_price
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
                                          {formatDaysAgo(
                                            purchase.purchase_date
                                          )}
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
                                      {Number(
                                        purchase.quantity
                                      ).toLocaleString()}
                                    </TableCell>
                                    <TableCell
                                      className={`text-right font-medium ${
                                        costDifference && costDifference > 0
                                          ? 'text-red-600'
                                          : costDifference && costDifference < 0
                                            ? 'text-green-600'
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
