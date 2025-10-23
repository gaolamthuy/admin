# Role-Based Permissions System

Hệ thống quản lý quyền hạn dựa trên roles và permissions, cho phép kiểm soát truy cập chi tiết và linh hoạt.

## 🏗️ Kiến trúc hệ thống

### Database Schema

```sql
-- Bảng roles
glt_roles (id, name, description, is_active, created_at, updated_at)

-- Bảng permissions
glt_permissions (id, resource, action, description, created_at)

-- Bảng role-permission mapping
glt_role_permissions (id, role_id, permission_id, created_at)

-- Bảng user-role mapping
glt_user_roles (id, user_id, role_id, assigned_by, assigned_at, expires_at, is_active)
```

### Helper Functions

- `user_has_role(user_uuid, role_name)` - Kiểm tra user có role cụ thể
- `user_has_permission(user_uuid, resource, action)` - Kiểm tra user có permission
- `get_user_roles(user_uuid)` - Lấy tất cả roles của user
- `get_user_permissions(user_uuid)` - Lấy tất cả permissions của user

## 🚀 Cách sử dụng

### 1. Permission Guards

```tsx
import { PermissionGuard, AdminGuard, RoleGuard } from '@/components/permissions/PermissionGuard';

// Kiểm tra single permission
<PermissionGuard resource="products" action="write">
  <button>Chỉnh sửa sản phẩm</button>
</PermissionGuard>

// Kiểm tra single role
<RoleGuard role="admin">
  <AdminPanel />
</RoleGuard>

// Kiểm tra multiple permissions
<PermissionGuard
  permissions={[
    {resource: 'products', action: 'read'},
    {resource: 'customers', action: 'read'}
  ]}
  requireAll={false} // true = cần tất cả, false = cần ít nhất 1
>
  <Dashboard />
</PermissionGuard>

// Convenience components
<AdminGuard>
  <AdminOnlyContent />
</AdminGuard>

<ManagerGuard>
  <ManagerContent />
</ManagerGuard>
```

### 2. Hooks

```tsx
import {
  usePermission,
  useRole,
  useUserRoles,
  useUserPermissions,
  useIsAdmin,
  useCanManageUsers,
} from "@/hooks/usePermissions";

function MyComponent() {
  // Kiểm tra single permission
  const { hasPermission, loading } = usePermission("products", "write");

  // Kiểm tra single role
  const { hasRole } = useRole("admin");

  // Lấy tất cả roles của user
  const { roles } = useUserRoles();

  // Lấy tất cả permissions của user
  const { permissions } = useUserPermissions();

  // Convenience hooks
  const { hasRole: isAdmin } = useIsAdmin();
  const { hasPermission: canManageUsers } = useCanManageUsers();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {hasPermission && <button>Edit Product</button>}
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### 3. Role Management

```tsx
import { RoleManagement } from "@/components/permissions/RoleManagement";

function AdminPage() {
  return (
    <AdminGuard>
      <RoleManagement
        onRoleCreated={(role) => console.log("Role created:", role)}
        onRoleUpdated={(role) => console.log("Role updated:", role)}
        onRoleDeleted={(roleId) => console.log("Role deleted:", roleId)}
      />
    </AdminGuard>
  );
}
```

## 📋 Default Roles & Permissions

### Roles

- **admin**: Full access to all features
- **manager**: Can manage products, customers, and view reports
- **staff**: Can view and edit products, customers
- **viewer**: Read-only access to most features
- **cashier**: Can process sales and view customer info

### Permissions

- **users**: read, write, delete, manage
- **products**: read, write, delete, export, manage
- **customers**: read, write, delete, export, manage
- **invoices**: read, write, delete, export, manage
- **payments**: read, write, export, manage
- **system**: read, write, manage
- **reports**: read, export, manage

## 🔧 API Usage

### Kiểm tra permissions trong API

```typescript
// Trong API route
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getUser(request);

  // Kiểm tra permission
  const { data: hasPermission } = await supabase.rpc("user_has_permission", {
    user_uuid: user.id,
    resource_name: "products",
    action_name: "read",
  });

  if (!hasPermission) {
    return new Response("Forbidden", { status: 403 });
  }

  // Continue with logic...
}
```

### RLS Policies

Các RLS policies đã được cập nhật để sử dụng dynamic permissions:

```sql
-- Ví dụ policy cho products
CREATE POLICY "users_can_read_products" ON kv_products
    FOR SELECT USING (public.user_has_permission(auth.uid(), 'products', 'read'));

CREATE POLICY "users_can_write_products" ON kv_products
    FOR UPDATE USING (public.user_has_permission(auth.uid(), 'products', 'write'));
```

## 🎯 Best Practices

### 1. Component Level Protection

```tsx
// ✅ Good - Sử dụng PermissionGuard
<PermissionGuard resource="products" action="write">
  <EditProductButton />
</PermissionGuard>;

// ❌ Bad - Kiểm tra permission trong component
function EditProductButton() {
  const { hasPermission } = usePermission("products", "write");
  if (!hasPermission) return null;
  return <button>Edit</button>;
}
```

### 2. API Level Protection

```typescript
// ✅ Good - Kiểm tra permission trong API
export async function DELETE(request: Request) {
  const hasPermission = await checkPermission(user.id, "products", "delete");
  if (!hasPermission) return new Response("Forbidden", { status: 403 });
  // ...
}

// ❌ Bad - Chỉ dựa vào frontend
```

### 3. Performance Optimization

```tsx
// ✅ Good - Sử dụng multiple permissions hook
const { results } = useMultiplePermissions([
  { resource: "products", action: "read" },
  { resource: "products", action: "write" },
]);

// ❌ Bad - Multiple single permission hooks
const read = usePermission("products", "read");
const write = usePermission("products", "write");
```

## 🔄 Migration từ hệ thống cũ

Hệ thống mới tương thích ngược với hệ thống cũ:

- Function `is_admin()` vẫn hoạt động
- Existing users được migrate tự động
- Có thể sử dụng song song cả 2 hệ thống

## 🚨 Security Notes

1. **RLS Policies**: Tất cả tables đều có RLS enabled
2. **Function Security**: Helper functions sử dụng `SECURITY DEFINER`
3. **Audit Trail**: Tất cả role assignments được track
4. **Expiration**: Roles có thể set expiration date

## 📊 Monitoring & Debugging

### Kiểm tra permissions của user

```sql
-- Lấy tất cả roles của user
SELECT * FROM get_user_roles('user-uuid-here');

-- Lấy tất cả permissions của user
SELECT * FROM get_user_permissions('user-uuid-here');

-- Kiểm tra specific permission
SELECT user_has_permission('user-uuid-here', 'products', 'write');
```

### Debug RLS policies

```sql
-- Kiểm tra policies
SELECT * FROM pg_policies WHERE tablename = 'kv_products';

-- Test policy với specific user
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';
SELECT * FROM kv_products;
```
