/**
 * Product Show Page
 * Sử dụng TanStack Query để fetch và hiển thị product details
 *
 * @module pages/products/ProductShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useProductShow,
  useProductPriceComparison,
  useProductInventory,
  useUpdateProduct,
  useUpdateProductPrice,
  type ChildUnitInfo,
  type ChangelogEntry,
  type ProductChangelog,
} from './hooks/useProductShow';
import { ProductImageUploadDialog } from './components/ProductImageUploadDialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { formatDaysAgo, formatDate, formatTimeAgo } from '@/utils/date';
import { toast } from 'sonner';

/**
 * Component hiển thị chi tiết sản phẩm với hot editing
 * Cho phép edit trực tiếp 3 trường với auto-save: glt_retail_promotion, glt_baseprice_markup, glt_labelprint_favorite
 */
export const ProductShow = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasResetForm = useRef(false);
  const updateProductPrice = useUpdateProductPrice();

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

  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      glt_retail_promotion: false,
      glt_baseprice_markup: 0,
      glt_extra_cost: 0,
      glt_baseprice_round_step: 1000,
      glt_labelprint_favorite: false,
    },
  });

  useEffect(() => {
    if (record && !hasResetForm.current) {
      form.reset({
        glt_retail_promotion: record.glt_retail_promotion ?? false,
        glt_baseprice_markup: record.glt_baseprice_markup || 0,
        glt_extra_cost: record.glt_extra_cost || 0,
        glt_baseprice_round_step: record.glt_baseprice_round_step || 1000,
        glt_labelprint_favorite: record.glt_labelprint_favorite ?? false,
      });
      hasResetForm.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  const onSubmit = async (values: {
    glt_retail_promotion: boolean;
    glt_baseprice_markup: number;
    glt_extra_cost: number;
    glt_baseprice_round_step: number;
    glt_labelprint_favorite: boolean;
  }) => {
    if (!record?.id) return;

    const processedValues = {
      glt_retail_promotion: Boolean(values.glt_retail_promotion),
      glt_baseprice_markup: values.glt_baseprice_markup
        ? parseFloat(String(values.glt_baseprice_markup))
        : 0,
      glt_extra_cost: values.glt_extra_cost
        ? parseFloat(String(values.glt_extra_cost))
        : 0,
      glt_baseprice_round_step: values.glt_baseprice_round_step || 1000,
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
                      <p className="font-medium">
                        {record.category_name || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lịch sử thay đổi giá */}
          {(() => {
            const changelog = record.changelog as ProductChangelog | undefined;
            if (!changelog || Object.keys(changelog).length === 0) return null;

            const fieldLabels: Record<string, string> = {
              base_price: 'Giá bán',
              cost: 'Giá vốn',
              order_template: 'Mẫu đặt hàng',
            };

            return (
              <Card>
                <CardHeader>
                  <CardTitle>Lịch sử thay đổi</CardTitle>
                  <CardDescription>
                    5 thay đổi gần nhất theo từng loại
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(changelog).map(([field, entries]) => {
                    if (!entries || entries.length === 0) return null;
                    return (
                      <div key={field}>
                        <h4 className="text-sm font-medium mb-2">
                          {fieldLabels[field] || field}
                        </h4>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Thời gian</TableHead>
                                <TableHead className="text-right">Cũ</TableHead>
                                <TableHead className="text-right">
                                  Mới
                                </TableHead>
                                {field !== 'order_template' && (
                                  <TableHead className="text-right">
                                    Chênh lệch
                                  </TableHead>
                                )}
                                <TableHead>Nguồn</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {entries.map(
                                (entry: ChangelogEntry, idx: number) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      <div className="text-sm">
                                        {formatDate(entry.at)}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {formatTimeAgo(entry.at)}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {field === 'order_template'
                                        ? (entry.old?.slice(0, 30) || '-') +
                                          (entry.old && entry.old.length > 30
                                            ? '...'
                                            : '')
                                        : Number(
                                            entry.old || 0
                                          ).toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-mono">
                                      {field === 'order_template'
                                        ? (entry.new?.slice(0, 30) || '-') +
                                          (entry.new && entry.new.length > 30
                                            ? '...'
                                            : '')
                                        : Number(
                                            entry.new || 0
                                          ).toLocaleString()}
                                    </TableCell>
                                    {field !== 'order_template' && (
                                      <TableCell
                                        className={`text-right font-medium ${
                                          entry.dir === 'up'
                                            ? 'text-destructive'
                                            : entry.dir === 'down'
                                              ? 'text-green-600 dark:text-green-400'
                                              : ''
                                        }`}
                                      >
                                        {entry.diff !== null ? (
                                          <>
                                            {entry.diff > 0 ? '+' : ''}
                                            {Number(
                                              entry.diff
                                            ).toLocaleString()}
                                            {entry.pct !== null && (
                                              <span className="text-xs ml-1">
                                                ({entry.pct > 0 ? '+' : ''}
                                                {Number(entry.pct).toFixed(1)}
                                                %)
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          '-'
                                        )}
                                      </TableCell>
                                    )}
                                    <TableCell>
                                      {entry.src ? (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {entry.src === 'webhook'
                                            ? 'KiotViet'
                                            : entry.src === 'po_update'
                                              ? 'Đơn nhập'
                                              : entry.src === 'sync'
                                                ? 'Sync'
                                                : entry.src}
                                        </Badge>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })()}

          {/* Đơn vị con (child units) */}
          {record.child_unit_info && record.child_unit_info.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Đơn vị con</CardTitle>
                <CardDescription>
                  Các đơn vị quy đổi từ sản phẩm gốc
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã</TableHead>
                        <TableHead>Tên</TableHead>
                        <TableHead>Đơn vị</TableHead>
                        <TableHead className="text-right">Giá bán</TableHead>
                        <TableHead className="text-right">Quy đổi</TableHead>
                        <TableHead className="text-right">
                          Giá/đơn vị gốc
                        </TableHead>
                        <TableHead>Thay đổi gần nhất</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(record.child_unit_info as ChildUnitInfo[]).map(cu => {
                        const lastChange = cu.price_changelog?.[0];
                        return (
                          <TableRow key={cu.kiotviet_id}>
                            <TableCell className="font-mono text-xs">
                              {cu.code}
                            </TableCell>
                            <TableCell>{cu.full_name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{cu.unit}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {Number(cu.base_price).toLocaleString()} VNĐ
                            </TableCell>
                            <TableCell className="text-right">
                              × {cu.conversion_value}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {cu.price_per_master_unit
                                ? `${Number(cu.price_per_master_unit).toLocaleString()} VNĐ`
                                : '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {lastChange ? (
                                <span
                                  className={
                                    lastChange.dir === 'up'
                                      ? 'text-destructive'
                                      : lastChange.dir === 'down'
                                        ? 'text-green-600 dark:text-green-400'
                                        : ''
                                  }
                                >
                                  {lastChange.dir === 'up' ? '↑' : '↓'}{' '}
                                  {lastChange.diff !== null
                                    ? `${lastChange.diff > 0 ? '+' : ''}${Number(lastChange.diff).toLocaleString()}`
                                    : ''}
                                  {lastChange.pct !== null &&
                                    ` (${lastChange.pct > 0 ? '+' : ''}${Number(lastChange.pct).toFixed(1)}%)`}
                                  <span className="text-xs text-muted-foreground ml-1">
                                    {formatTimeAgo(lastChange.at)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

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
              ) : priceComparison &&
                priceComparison.latest_purchase_order_id ? (
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
                      {priceComparison.cost_diff_from_latest_po !== null &&
                        priceComparison.cost_diff_from_latest_po !== 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-2 w-full"
                            disabled={updateProductPrice.isPending}
                            onClick={() => {
                              if (record?.kiotviet_id) {
                                updateProductPrice.mutate(record.kiotviet_id);
                              }
                            }}
                          >
                            {updateProductPrice.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            Cập nhật giá KioViet
                          </Button>
                        )}
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">
                        Chênh lệch (Cost - Giá nhập)
                      </div>
                      {(() => {
                        const costDiff =
                          priceComparison.cost_diff_from_latest_po;
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
                                  ? 'text-destructive'
                                  : costDiff !== null && costDiff < 0
                                    ? 'text-green-600 dark:text-green-400'
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
                                    ? 'text-destructive'
                                    : costDiffPercent < 0
                                      ? 'text-green-600 dark:text-green-400'
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
                                  const totalCost =
                                    purchase.total_cost_per_unit;
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
                                        {Number(
                                          purchase.price
                                        ).toLocaleString()}
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
                                            ? 'text-destructive'
                                            : costDifference &&
                                                costDifference < 0
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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ảnh sản phẩm</CardTitle>
                  <CardDescription>
                    Upload và quản lý ảnh theo role (feature, closeup, package)
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  disabled={!record?.kiotviet_id}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload ảnh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const gltImages = record?.glt_images as
                  | Array<{
                      role: string;
                      images: Record<
                        string,
                        {
                          id: number;
                          url: string;
                          path: string;
                          rev?: number;
                          width?: number;
                          height?: number;
                          format?: string;
                        }
                      >;
                    }>
                  | undefined;

                if (!gltImages || gltImages.length === 0) {
                  return (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      Chưa có ảnh nào. Nhấn "Upload ảnh" để bắt đầu.
                    </div>
                  );
                }

                return (
                  <div className="space-y-8">
                    {gltImages.map((roleData, roleIndex) => {
                      const { role, images } = roleData;
                      const displayImage = images.display;
                      const linkVariants = Object.entries(images).filter(
                        ([key]) => key !== 'display'
                      );

                      return (
                        <div key={roleIndex} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold uppercase tracking-wide">
                              {role}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {Object.keys(images).length} variants
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4">
                            {displayImage && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  Display
                                </div>
                                <div
                                  className="relative rounded-lg border overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                                  onClick={() =>
                                    window.open(
                                      displayImage.rev
                                        ? `${displayImage.url}?v=${displayImage.rev}`
                                        : displayImage.url,
                                      '_blank'
                                    )
                                  }
                                >
                                  <img
                                    src={
                                      displayImage.rev
                                        ? `${displayImage.url}?v=${displayImage.rev}`
                                        : displayImage.url
                                    }
                                    alt={`${role} display`}
                                    className="w-[200px] h-[267px] object-cover"
                                  />
                                  {displayImage.format && (
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                                      {displayImage.format.toUpperCase()}
                                      {displayImage.width &&
                                        ` ${displayImage.width}x${displayImage.height}`}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {linkVariants.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {linkVariants.map(([imageType, imageData]) => (
                                <a
                                  key={imageType}
                                  href={
                                    imageData.rev
                                      ? `${imageData.url}?v=${imageData.rev}`
                                      : imageData.url
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                                >
                                  {imageType}
                                  {imageData.format && (
                                    <span className="text-[10px] opacity-70">
                                      ({imageData.format})
                                    </span>
                                  )}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {record?.kiotviet_id && (
            <ProductImageUploadDialog
              open={isUploadDialogOpen}
              onOpenChange={setIsUploadDialogOpen}
              kiotvietId={record.kiotviet_id}
              productName={record.full_name || record.name}
            />
          )}
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                      name="glt_extra_cost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Extra cost (VND/kg)</FormLabel>
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
                      name="glt_baseprice_round_step"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bước làm tròn giá (VND)</FormLabel>
                          <Select
                            value={String(field.value || 1000)}
                            onValueChange={value => {
                              field.onChange(Number(value));
                              setTimeout(() => {
                                form.handleSubmit(onSubmit)();
                              }, 0);
                            }}
                            disabled={updateProduct.isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn bước làm tròn" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="500">500 VNĐ</SelectItem>
                              <SelectItem value="1000">1000 VNĐ</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            500 = làm tròn mịn, 1000 = mặc định
                          </p>
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
