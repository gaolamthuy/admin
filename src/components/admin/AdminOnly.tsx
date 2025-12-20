/**
 * AdminOnly Component
 * Wrapper component để conditional render các phần chỉ dành cho admin
 *
 * @module components/admin/AdminOnly
 */

import { useIsAdmin } from '@/hooks/useAuth';
import type { PropsWithChildren } from 'react';

interface AdminOnlyProps extends PropsWithChildren {
  /**
   * Fallback component để render khi không phải admin
   * Nếu không có, sẽ không render gì cả
   */
  fallback?: React.ReactNode;
  /**
   * Custom check function (optional)
   * Nếu có, sẽ dùng function này thay vì isAdmin
   */
  check?: () => boolean;
}

/**
 * AdminOnly Component
 * Chỉ render children nếu user là admin
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AdminOnly>
 *   <PriceDifferenceBadge />
 * </AdminOnly>
 *
 * // Với fallback
 * <AdminOnly fallback={<span>Chỉ admin mới thấy</span>}>
 *   <AdminPanel />
 * </AdminOnly>
 *
 * // Với custom check
 * <AdminOnly check={() => user.role === 'super_admin'}>
 *   <SuperAdminPanel />
 * </AdminOnly>
 * ```
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null,
  check,
}) => {
  const { isAdmin } = useIsAdmin();
  const shouldRender = check ? check() : isAdmin;

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * AdminOnly Fragment
 * Sử dụng như một fragment, không tạo thêm DOM element
 */
export const AdminOnlyFragment: React.FC<AdminOnlyProps> = ({
  children,
  fallback = null,
  check,
}) => {
  const { isAdmin } = useIsAdmin();
  const shouldRender = check ? check() : isAdmin;

  if (!shouldRender) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
