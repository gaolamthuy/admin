/**
 * Product Show Page
 * Sử dụng TanStack Query để fetch và hiển thị product details
 *
 * @module pages/products/ProductShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useProductShow,
  useProductImages,
  useProductPriceComparison,
  useProductInventory,
  useUpdateProduct,
  useRegenerateProductImages,
  useUploadProductImage,
  type ProductImage,
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
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, RefreshCw } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDaysAgo, formatDate, formatDateTime } from '@/utils/date';
import { toast } from 'sonner';

/**
 * Component hiển thị chi tiết sản phẩm với hot editing
 * Cho phép edit trực tiếp 3 trường với auto-save: glt_retail_promotion, glt_baseprice_markup, glt_labelprint_favorite
 */
export const ProductShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasResetForm = useRef(false);
  
  // Track image load errors để tránh infinite retry
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Query product data
  const {
    data: record,
    isLoading: recordLoading,
    error: recordError,
  } = useProductShow(id || '');

  // Query product images (sử dụng product_id thay vì kiotviet_id)
  const { data: productImages = [], isLoading: imagesLoading } =
    useProductImages(record?.id);

  // Query price comparison
  const { data: priceComparison, isLoading: priceComparisonLoading } =
    useProductPriceComparison(record?.code);

  // Query inventory
  const { data: inventory, isLoading: inventoryLoading } = useProductInventory(
    record?.id
  );

  // Mutation để update product
  const updateProduct = useUpdateProduct();
  
  // Mutations cho images
  const regenerateImages = useRegenerateProductImages();
  const uploadImage = useUploadProductImage();

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

  // Reset image errors khi product thay đổi
  useEffect(() => {
    setImageErrors(new Set());
    hasResetForm.current = false;
  }, [id]);

  /**
   * Phân loại ảnh theo role để hiển thị theo nhóm
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

  // Feature images
  const featureMain = imagesByRole['feature-main'];
  const featureThumbnail = imagesByRole['feature-thumbnail'];

  // Closeup images
  const closeupMain = imagesByRole['closeup-main'];
  const closeupThumbnail = imagesByRole['closeup-thumbnail'];
  const closeupOriginal = imagesByRole['closeup-original'];

  // Package images
  const packageMain = imagesByRole['package-main'];
  const packageThumbnail = imagesByRole['package-thumbnail'];
  const packageOriginal = imagesByRole['package-original'];

  // Infocard images
  const infocardMain = imagesByRole['infocard-main'];
  const infocardThumbnail = imagesByRole['infocard-thumbnail'];

  /**
   * Validate URL và check xem có bị error không
   */
  const getImageUrl = (image?: ProductImage | null): string | null => {
    if (!image) return null;
    const url = image.url || image.path;
    if (!url) return null;
    
    // Check nếu URL đã bị error trước đó
    if (imageErrors.has(url)) {
      return null;
    }
    
    // Validate URL format
    try {
      new URL(url);
      return url;
    } catch {
      // Invalid URL format
      return null;
    }
  };

  /**
   * Handle image error - prevent infinite retry
   */
  const handleImageError = (url: string | null) => {
    if (url && !imageErrors.has(url)) {
      setImageErrors(prev => new Set(prev).add(url));
    }
  };

  /**
   * Handle upload image cho closeup hoặc package
   */
  const handleUploadImage = async (
    role: 'closeup' | 'package',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!record?.kiotviet_id) return;

    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await toast.promise(
        uploadImage.mutateAsync({
          file,
          kiotvietId: record.kiotviet_id,
          role,
        }),
        {
          loading: `Đang upload ảnh ${role}...`,
          success: `Đã upload ảnh ${role} thành công. Đang xử lý...`,
          error: `Upload ảnh ${role} thất bại. Vui lòng thử lại.`,
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      // Reset input để có thể chọn lại file cùng tên
      event.target.value = '';
    }
  };

  /**
   * Handle regenerate images
   */
  const handleRegenerate = async (role: 'feature' | 'closeup' | 'package' | 'infocard') => {
    if (!record?.kiotviet_id) return;

    try {
      await toast.promise(
        regenerateImages.mutateAsync({
          kiotvietId: record.kiotviet_id,
          role,
        }),
        {
          loading: `Đang regenerate ảnh ${role}...`,
          success: `Đã regenerate ảnh ${role} thành công`,
          error: `Regenerate ảnh ${role} thất bại. Vui lòng thử lại.`,
        }
      );
    } catch (error) {
      console.error('Regenerate error:', error);
    }
  };

  /**
   * Render image item text (không dùng card)
   */
  const renderImageItem = (
    roleName: string,
    image?: ProductImage | null
  ) => {
    const imageUrl = getImageUrl(image);
    const hasImage = Boolean(imageUrl);
    const rev = image?.rev;
    const updatedAt = image?.updated_at;

    // Convert rev (timestamp) sang date format
    const revDate = rev
      ? (() => {
          // Rev có thể là milliseconds (>= 1000000000000) hoặc seconds
          const timestamp =
            rev >= 1000000000000 ? rev : rev * 1000;
          return formatDateTime(new Date(timestamp));
        })()
      : null;

    return (
      <div
        key={roleName}
        className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/30 transition-colors"
        onClick={() => {
          if (hasImage && imageUrl) {
            window.open(imageUrl, '_blank');
          }
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{roleName}</span>
          {hasImage ? (
            <span className="text-green-600" title="Available">✅</span>
          ) : (
            <span className="text-muted-foreground" title="Missing">⚠️</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          {revDate && (
            <span className="text-[10px]">
              {revDate}
            </span>
          )}-
          {updatedAt && (
            <span className="text-[10px]">{formatDaysAgo(updatedAt)}</span>
          )}
        </div>
      </div>
    );
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

          {/* Hiển thị hình ảnh sản phẩm theo 4 nhóm: feature, closeup, package, infocard */}
          <div>
            <h4 className="text-sm font-medium mb-4">Hình ảnh sản phẩm</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Feature Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Feature</CardTitle>
                    <div className="flex items-center gap-2">
                      {imagesLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRegenerate('feature')}
                              disabled={regenerateImages.isPending || !record?.kiotviet_id}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerate feature images</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Feature Main Image */}
                  {featureMain ? (
                    <div className="relative rounded-lg border overflow-hidden group">
                      {(() => {
                        const imageUrl = getImageUrl(featureMain);
                        const hasError = imageUrl === null;
                        
                        return hasError ? (
                          <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground text-xs">
                              <p>Không thể tải ảnh</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt="Feature main"
                            className="w-[300px] h-[400px] object-cover transition-transform group-hover:scale-105 cursor-pointer"
                            loading="lazy"
                            decoding="async"
                            onError={() => handleImageError(imageUrl)}
                            onClick={() => imageUrl && window.open(imageUrl, '_blank')}
                          />
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground text-xs">
                        <p>Chưa có ảnh</p>
                      </div>
                    </div>
                  )}

                  {/* Feature Items */}
                  <div className="space-y-1">
                    {renderImageItem('feature-main', featureMain)}
                    {renderImageItem('feature-thumbnail', featureThumbnail)}
                  </div>
                </CardContent>
              </Card>

              {/* Closeup Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Closeup</CardTitle>
                    <div className="flex items-center gap-2">
                      {imagesLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRegenerate('closeup')}
                              disabled={regenerateImages.isPending || !record?.kiotviet_id}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerate closeup images</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Closeup Main Image với Upload Icon */}
                  {closeupMain ? (
                    <div className="relative rounded-lg border overflow-hidden group">
                      {(() => {
                        const imageUrl = getImageUrl(closeupMain);
                        const hasError = imageUrl === null;
                        
                        return hasError ? (
                          <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground text-xs">
                              <p>Không thể tải ảnh</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={imageUrl}
                              alt="Closeup main"
                              className="w-[300px] h-[400px] object-cover transition-transform group-hover:scale-105 cursor-pointer"
                              loading="lazy"
                              decoding="async"
                              onError={() => handleImageError(imageUrl)}
                              onClick={() => imageUrl && window.open(imageUrl, '_blank')}
                            />
                            <div className="absolute top-2 right-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => handleUploadImage('closeup', e)}
                                        disabled={uploadImage.isPending}
                                      />
                                      <div className="bg-black/70 hover:bg-black/90 rounded p-1.5 transition-colors">
                                        <Upload className="h-3.5 w-3.5 text-white" />
                                      </div>
                                    </label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Upload closeup image</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                      <label className="cursor-pointer w-full h-full flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleUploadImage('closeup', e)}
                          disabled={uploadImage.isPending}
                        />
                        <div className="text-center text-muted-foreground text-xs">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <p>Upload closeup</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Closeup Items */}
                  <div className="space-y-1">
                    {renderImageItem('closeup-main', closeupMain)}
                    {renderImageItem('closeup-thumbnail', closeupThumbnail)}
                    {renderImageItem('closeup-original', closeupOriginal)}
                  </div>
                </CardContent>
              </Card>

              {/* Package Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Package</CardTitle>
                    <div className="flex items-center gap-2">
                      {imagesLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRegenerate('package')}
                              disabled={regenerateImages.isPending || !record?.kiotviet_id}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerate package images</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Package Main Image với Upload Icon */}
                  {packageMain ? (
                    <div className="relative rounded-lg border overflow-hidden group">
                      {(() => {
                        const imageUrl = getImageUrl(packageMain);
                        const hasError = imageUrl === null;
                        
                        return hasError ? (
                          <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground text-xs">
                              <p>Không thể tải ảnh</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={imageUrl}
                              alt="Package main"
                              className="w-[300px] h-[400px] object-cover transition-transform group-hover:scale-105 cursor-pointer"
                              loading="lazy"
                              decoding="async"
                              onError={() => handleImageError(imageUrl)}
                              onClick={() => imageUrl && window.open(imageUrl, '_blank')}
                            />
                            <div className="absolute top-2 right-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <label className="cursor-pointer">
                                      <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={(e) => handleUploadImage('package', e)}
                                        disabled={uploadImage.isPending}
                                      />
                                      <div className="bg-black/70 hover:bg-black/90 rounded p-1.5 transition-colors">
                                        <Upload className="h-3.5 w-3.5 text-white" />
                                      </div>
                                    </label>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Upload package image</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                      <label className="cursor-pointer w-full h-full flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleUploadImage('package', e)}
                          disabled={uploadImage.isPending}
                        />
                        <div className="text-center text-muted-foreground text-xs">
                          <Upload className="h-6 w-6 mx-auto mb-1" />
                          <p>Upload package</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {/* Package Items */}
                  <div className="space-y-1">
                    {renderImageItem('package-main', packageMain)}
                    {renderImageItem('package-thumbnail', packageThumbnail)}
                    {renderImageItem('package-original', packageOriginal)}
                  </div>
                </CardContent>
              </Card>

              {/* Infocard Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Infocard</CardTitle>
                    <div className="flex items-center gap-2">
                      {imagesLoading && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRegenerate('infocard')}
                              disabled={regenerateImages.isPending || !record?.kiotviet_id}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerate infocard images</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Infocard Main Image */}
                  {infocardMain ? (
                    <div className="relative rounded-lg border overflow-hidden group">
                      {(() => {
                        const imageUrl = getImageUrl(infocardMain);
                        const hasError = imageUrl === null;
                        
                        return hasError ? (
                          <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                            <div className="text-center text-muted-foreground text-xs">
                              <p>Không thể tải ảnh</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={imageUrl}
                            alt="Infocard main"
                            className="w-[300px] h-[400px] object-cover transition-transform group-hover:scale-105 cursor-pointer"
                            loading="lazy"
                            decoding="async"
                            onError={() => handleImageError(imageUrl)}
                            onClick={() => imageUrl && window.open(imageUrl, '_blank')}
                          />
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="relative rounded-lg border border-dashed overflow-hidden bg-muted/20 w-[300px] h-[400px] flex items-center justify-center">
                      <div className="text-center text-muted-foreground text-xs">
                        <p>Chưa có ảnh</p>
                      </div>
                    </div>
                  )}

                  {/* Infocard Items */}
                  <div className="space-y-1">
                    {renderImageItem('infocard-main', infocardMain)}
                    {renderImageItem('infocard-thumbnail', infocardThumbnail)}
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
                            // Auto-save khi thay đổi
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
                            // save khi rời focus
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
                            // Auto-save khi thay đổi
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
                    // Sử dụng cost_diff_from_latest_po từ view (inventory_cost - latest_total_cost_per_unit)
                    // cost_diff_from_latest_po = inventory_cost - latest_total_cost_per_unit
                    const costDiff = priceComparison.cost_diff_from_latest_po;
                    const cost = inventory?.cost;
                    // Tính phần trăm dựa trên cost (nếu có)
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
                              // Tính chênh lệch với cost
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
