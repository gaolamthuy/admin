/**
 * Product Show Page
 * Sử dụng TanStack Query để fetch product data
 *
 * @module pages/products/ProductShow
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useProduct } from '@/hooks/useProducts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/utils/date';

/**
 * Product Show Page Component
 */
export const ProductShow = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              {error instanceof Error
                ? error.message
                : 'Không tìm thấy sản phẩm'}
            </p>
            <Button onClick={() => navigate('/products')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{product.full_name || product.name}</CardTitle>
              <CardDescription>
                Mã: {product.code || product.kiotviet_id}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {product.glt_labelprint_favorite && (
                <Badge variant="secondary">Yêu thích</Badge>
              )}
              {product.is_active ? (
                <Badge variant="default">Đang hoạt động</Badge>
              ) : (
                <Badge variant="destructive">Ngừng hoạt động</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Product Image */}
          {product.images && product.images.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Hình ảnh</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} - ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        '/placeholder-product.png';
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Product Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tên sản phẩm:</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tên đầy đủ:</span>
                  <span className="font-medium">{product.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã sản phẩm:</span>
                  <span className="font-medium">{product.code || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KiotViet ID:</span>
                  <span className="font-medium">{product.kiotviet_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Danh mục:</span>
                  <span className="font-medium">
                    {product.category_name || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Giá và đơn vị</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giá bán:</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(product.base_price || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trọng lượng:</span>
                  <span className="font-medium">
                    {product.weight
                      ? `${product.weight} ${product.unit || 'kg'}`
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn vị:</span>
                  <span className="font-medium">{product.unit || '-'}</span>
                </div>
              </div>
            </div>
          </div>

          {product.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-2">Mô tả</h3>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Thông tin bổ sung</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cho phép bán:</span>
                  <Badge
                    variant={product.allows_sale ? 'default' : 'secondary'}
                  >
                    {product.allows_sale ? 'Có' : 'Không'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Có biến thể:</span>
                  <Badge
                    variant={product.has_variants ? 'default' : 'secondary'}
                  >
                    {product.has_variants ? 'Có' : 'Không'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hiển thị:</span>
                  <Badge
                    variant={product.glt_visible ? 'default' : 'secondary'}
                  >
                    {product.glt_visible ? 'Có' : 'Không'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Thời gian</h3>
              <div className="space-y-2">
                {product.created_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày tạo:</span>
                    <span className="font-medium">
                      {formatDate(product.created_date)}
                    </span>
                  </div>
                )}
                {product.modified_date && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngày sửa:</span>
                    <span className="font-medium">
                      {formatDate(product.modified_date)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductShow;
