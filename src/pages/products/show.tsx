import { useOne, useShow } from '@refinedev/core';

import { ShowView } from '@/components/refine-ui/views/show-view';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Component hiển thị chi tiết sản phẩm
 * Load và hiển thị thông tin đầy đủ của sản phẩm
 */
export const ProductShow = () => {
  const { result: record } = useShow({
    meta: {
      select: '*, kv_product_categories(category_name)',
    },
  });

  const {
    result: category,
    query: { isLoading: categoryIsLoading },
  } = useOne({
    resource: 'kv_product_categories',
    id: record?.category_id || '',
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <ShowView>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{record?.name}</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-4">
                <Badge variant={record?.is_active ? 'default' : 'secondary'}>
                  {record?.is_active ? 'Hoạt động' : 'Tạm dừng'}
                </Badge>
                <Badge variant={record?.glt_visible ? 'default' : 'outline'}>
                  {record?.glt_visible ? 'Hiển thị' : 'Ẩn'}
                </Badge>
                {record?.glt_retail_promotion && (
                  <Badge variant="destructive">Khuyến mãi</Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  ID: {record?.id}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Thông tin cơ bản</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Mã sản phẩm:
                    </span>
                    <p className="font-medium">{record?.code || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Tên đầy đủ:
                    </span>
                    <p className="font-medium">{record?.full_name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Danh mục:
                    </span>
                    <p className="font-medium">
                      {categoryIsLoading
                        ? 'Loading...'
                        : category?.title || record?.category_name || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Thông tin bán hàng</h4>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Giá bán:
                    </span>
                    <p className="font-medium">
                      {record?.base_price
                        ? `${record.base_price.toLocaleString()} VND`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Trọng lượng:
                    </span>
                    <p className="font-medium">
                      {record?.weight ? `${record.weight} kg` : '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">
                      Đơn vị:
                    </span>
                    <p className="font-medium">{record?.unit || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Trạng thái</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Hoạt động:
                  </span>
                  <Badge variant={record?.is_active ? 'default' : 'secondary'}>
                    {record?.is_active ? 'Có' : 'Không'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Cho phép bán:
                  </span>
                  <Badge
                    variant={record?.allows_sale ? 'default' : 'secondary'}
                  >
                    {record?.allows_sale ? 'Có' : 'Không'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Hiển thị:
                  </span>
                  <Badge variant={record?.glt_visible ? 'default' : 'outline'}>
                    {record?.glt_visible ? 'Có' : 'Không'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Khuyến mãi:
                  </span>
                  <Badge
                    variant={
                      record?.glt_retail_promotion ? 'destructive' : 'secondary'
                    }
                  >
                    {record?.glt_retail_promotion ? 'Có' : 'Không'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Thời gian</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    Ngày tạo:
                  </span>
                  <p className="font-medium">
                    {record?.created_date
                      ? new Date(record.created_date).toLocaleDateString(
                          'vi-VN'
                        )
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">
                    Ngày cập nhật:
                  </span>
                  <p className="font-medium">
                    {record?.modified_date
                      ? new Date(record.modified_date).toLocaleDateString(
                          'vi-VN'
                        )
                      : '-'}
                  </p>
                </div>
              </div>
            </div>

            {record?.description && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-4">Mô tả</h4>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground">
                      {record.description}
                    </p>
                  </div>
                </div>
              </>
            )}

            {record?.images && record.images.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-4">Hình ảnh</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {record.images.map((image: string, index: number) => (
                      <div key={index} className="aspect-square">
                        <img
                          src={image}
                          alt={`${record.name} - ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </ShowView>
  );
};
