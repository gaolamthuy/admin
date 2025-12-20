# 📋 Admin Features Management Guide

## 🎯 Tổng quan

Guide này giải thích cách quản lý các features chỉ dành cho admin trong project.

## 📁 Cấu trúc

```
src/
├── hooks/
│   └── useAdminFeatures.ts      # Hook quản lý admin features
├── components/
│   └── admin/
│       ├── AdminOnly.tsx        # Wrapper component cho admin-only content
│       ├── AdminFeature.tsx     # Component conditional render theo feature
│       └── index.ts             # Barrel export
```

## 🚀 Cách sử dụng

### 1. **AdminOnly Component** - Render toàn bộ phần admin

```tsx
import { AdminOnly } from '@/components/admin';

// Basic usage
<AdminOnly>
  <PriceDifferenceBadge />
  <UploadIcon />
  <EditButton />
</AdminOnly>

// Với fallback
<AdminOnly fallback={<span>Chỉ admin mới thấy</span>}>
  <AdminPanel />
</AdminOnly>
```

### 2. **AdminFeature Component** - Render theo feature cụ thể

```tsx
import { AdminFeature } from '@/components/admin';

// Single feature
<AdminFeature feature="priceDifference">
  <PriceDifferenceBadge />
</AdminFeature>

// Multiple features (OR - có ít nhất 1)
<AdminFeature any={['priceDifference', 'cost']}>
  <PriceInfo />
</AdminFeature>

// Multiple features (AND - có tất cả)
<AdminFeature all={['priceDifference', 'cost', 'purchasePrice']}>
  <FullPriceInfo />
</AdminFeature>
```

### 3. **useAdminFeatures Hook** - Logic check trong component

```tsx
import { useAdminFeatures } from '@/hooks/useAdminFeatures';

function MyComponent() {
  const { isAdmin, hasFeature, hasAnyFeature } = useAdminFeatures();

  // Check single feature
  if (hasFeature('priceDifference')) {
    // Render price difference
  }

  // Check multiple features
  if (hasAnyFeature(['priceDifference', 'cost'])) {
    // Render nếu có ít nhất 1 feature
  }

  return <div>{isAdmin && <AdminPanel />}</div>;
}
```

## 📝 Thêm features mới

### Bước 1: Thêm feature vào config

Mở `src/hooks/useAdminFeatures.ts` và thêm vào `ADMIN_FEATURES`:

```tsx
export const ADMIN_FEATURES = {
  // ... existing features

  // Thêm feature mới
  newFeature: {
    key: 'newFeature',
    label: 'Tên feature',
    description: 'Mô tả feature',
  },
} as const;
```

### Bước 2: Sử dụng trong component

```tsx
// Option 1: Dùng AdminFeature component
<AdminFeature feature="newFeature">
  <NewFeatureComponent />
</AdminFeature>;

// Option 2: Dùng hook
const { hasFeature } = useAdminFeatures();
{
  hasFeature('newFeature') && <NewFeatureComponent />;
}
```

## 🎨 Ví dụ thực tế

### ProductCard Component

```tsx
import { AdminOnly, AdminFeature } from '@/components/admin';

function ProductCard({ product, isAdmin }) {
  return (
    <Card>
      {/* Price Difference - chỉ admin thấy */}
      <AdminFeature feature="priceDifference">
        <PriceDifferenceBadge difference={product.priceDifference} />
      </AdminFeature>

      {/* Cost & Purchase Price - chỉ admin thấy */}
      <AdminFeature any={['cost', 'purchasePrice']}>
        <div className="space-y-1">
          <AdminFeature feature="cost">
            <div>Cost: {product.inventoryCost}</div>
          </AdminFeature>
          <AdminFeature feature="purchasePrice">
            <div>Giá nhập: {product.latestPurchaseCost}</div>
          </AdminFeature>
        </div>
      </AdminFeature>

      {/* Admin Actions - nhóm chung */}
      <AdminOnly>
        <div className="flex gap-2">
          <AdminFeature feature="uploadIcon">
            <UploadButton />
          </AdminFeature>
          <AdminFeature feature="editButton">
            <EditButton />
          </AdminFeature>
        </div>
      </AdminOnly>
    </Card>
  );
}
```

### ProductList Component

```tsx
import { useAdminFeatures } from '@/hooks/useAdminFeatures';

function ProductList() {
  const { hasFeature } = useAdminFeatures();

  // Fetch data dựa trên features
  const { data: products } = useProducts({
    requirePurchaseData: hasFeature('requirePurchaseData'),
  });

  const { products: priceDiff } = useProductPriceDifference(
    hasFeature('priceDifference')
  );

  return (
    <div>
      {/* Filters - tất cả users */}
      <Filters />

      {/* Admin-only features */}
      {hasFeature('priceDifference') && <PriceDifferenceFilter />}

      <ProductGrid products={products} />
    </div>
  );
}
```

## 🔧 Best Practices

### 1. **Nhóm các features liên quan**

```tsx
// ✅ Tốt: Nhóm các features liên quan
<AdminFeature any={['priceDifference', 'cost', 'purchasePrice']}>
  <PriceInfoSection />
</AdminFeature>;

// ❌ Không tốt: Check từng feature riêng lẻ
{
  hasFeature('priceDifference') && <PriceDifference />;
}
{
  hasFeature('cost') && <Cost />;
}
{
  hasFeature('purchasePrice') && <PurchasePrice />;
}
```

### 2. **Dùng AdminOnly cho nhóm lớn**

```tsx
// ✅ Tốt: Dùng AdminOnly cho nhóm lớn
<AdminOnly>
  <AdminPanel>
    <PriceDifference />
    <Cost />
    <UploadButton />
  </AdminPanel>
</AdminOnly>

// ❌ Không tốt: Wrap từng component
<AdminFeature feature="priceDifference"><PriceDifference /></AdminFeature>
<AdminFeature feature="cost"><Cost /></AdminFeature>
<AdminFeature feature="uploadIcon"><UploadButton /></AdminFeature>
```

### 3. **Dùng hook cho logic phức tạp**

```tsx
// ✅ Tốt: Dùng hook cho logic
const { hasFeature, hasAllFeatures } = useAdminFeatures();
const shouldFetchPriceData = hasAllFeatures(['priceDifference', 'cost']);

// ❌ Không tốt: Check trực tiếp trong JSX
{
  isAdmin && hasPriceDifference && hasCost && <Component />;
}
```

## 📊 Feature List

Hiện tại có các features sau:

| Feature Key           | Label                 | Mô tả                                         |
| --------------------- | --------------------- | --------------------------------------------- |
| `priceDifference`     | Chênh lệch giá        | Hiển thị chênh lệch giá giữa giá nhập và cost |
| `cost`                | Cost                  | Hiển thị cost từ inventory                    |
| `purchasePrice`       | Giá nhập              | Hiển thị giá nhập từ purchase orders          |
| `uploadIcon`          | Upload icon           | Upload ảnh sản phẩm                           |
| `editButton`          | Nút chỉnh sửa         | Nút xem/chỉnh sửa sản phẩm                    |
| `deleteButton`        | Nút xóa               | Nút xóa sản phẩm                              |
| `requirePurchaseData` | Yêu cầu purchase data | Chỉ hiển thị products có purchase data        |
| `inventoryCost`       | Inventory cost        | Hiển thị inventory cost data                  |

## 🎯 Kết luận

- **AdminOnly**: Dùng cho nhóm lớn các features admin
- **AdminFeature**: Dùng cho từng feature cụ thể
- **useAdminFeatures**: Dùng cho logic check trong component
- **ADMIN_FEATURES config**: Quản lý tập trung tất cả features

Cách này giúp:

- ✅ Dễ maintain và mở rộng
- ✅ Code rõ ràng, dễ đọc
- ✅ Quản lý tập trung
- ✅ Type-safe với TypeScript
