/**
 * Permission Guard Component
 * Component để bảo vệ các phần tử UI dựa trên permissions
 */

import React from "react";
import {
  usePermission,
  useRole,
  useMultiplePermissions,
  useMultipleRoles,
} from "../../hooks/usePermissions";
import type { Resource, Action } from "../../types/permissions";

// ===== PERMISSION GUARD PROPS =====

interface PermissionGuardProps {
  children: React.ReactNode;
  resource?: Resource;
  action?: Action;
  role?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // Nếu true, cần tất cả permissions/roles
  permissions?: Array<{ resource: Resource; action: Action }>;
  roles?: string[];
  loading?: React.ReactNode;
  error?: React.ReactNode;
}

// ===== PERMISSION GUARD COMPONENT =====

/**
 * Component bảo vệ UI dựa trên permissions hoặc roles
 *
 * @param children - Nội dung hiển thị khi có permission
 * @param resource - Resource cần kiểm tra permission
 * @param action - Action cần kiểm tra permission
 * @param role - Role cần kiểm tra
 * @param fallback - Nội dung hiển thị khi không có permission
 * @param requireAll - Nếu true, cần tất cả permissions/roles
 * @param permissions - Array permissions cần kiểm tra
 * @param roles - Array roles cần kiểm tra
 * @param loading - Nội dung hiển thị khi đang loading
 * @param error - Nội dung hiển thị khi có lỗi
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  resource,
  action,
  role,
  fallback = null,
  requireAll = false,
  permissions = [],
  roles = [],
  loading = null,
  error = null,
}) => {
  // Kiểm tra single permission
  const singlePermission = usePermission(resource!, action!);

  // Kiểm tra single role
  const singleRole = useRole(role!);

  // Kiểm tra multiple permissions
  const multiplePermissions = useMultiplePermissions(permissions);

  // Kiểm tra multiple roles
  const multipleRoles = useMultipleRoles(roles);

  // Xác định loading state
  const isLoading =
    (resource && action && singlePermission.loading) ||
    (role && singleRole.loading) ||
    (permissions.length > 0 && multiplePermissions.loading) ||
    (roles.length > 0 && multipleRoles.loading);

  // Xác định error state
  const hasError =
    (resource && action && singlePermission.error) ||
    (role && singleRole.error) ||
    (permissions.length > 0 && multiplePermissions.error) ||
    (roles.length > 0 && multipleRoles.error);

  // Xác định permission state
  const hasPermission = () => {
    // Kiểm tra single permission
    if (resource && action) {
      return singlePermission.hasPermission;
    }

    // Kiểm tra single role
    if (role) {
      return singleRole.hasRole;
    }

    // Kiểm tra multiple permissions
    if (permissions.length > 0) {
      if (requireAll) {
        return multiplePermissions.results.every(
          (result) => result.hasPermission
        );
      } else {
        return multiplePermissions.results.some(
          (result) => result.hasPermission
        );
      }
    }

    // Kiểm tra multiple roles
    if (roles.length > 0) {
      if (requireAll) {
        return multipleRoles.results.every((result) => result.hasRole);
      } else {
        return multipleRoles.results.some((result) => result.hasRole);
      }
    }

    return false;
  };

  // Hiển thị loading
  if (isLoading) {
    return <>{loading}</>;
  }

  // Hiển thị error
  if (hasError) {
    return <>{error}</>;
  }

  // Hiển thị content hoặc fallback
  return hasPermission() ? <>{children}</> : <>{fallback}</>;
};

// ===== CONVENIENCE COMPONENTS =====

/**
 * Component bảo vệ UI dựa trên single permission
 */
export const PermissionGuardSingle: React.FC<{
  children: React.ReactNode;
  resource: Resource;
  action: Action;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}> = ({ children, resource, action, fallback, loading, error }) => {
  return (
    <PermissionGuard
      resource={resource}
      action={action}
      fallback={fallback}
      loading={loading}
      error={error}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Component bảo vệ UI dựa trên single role
 */
export const RoleGuard: React.FC<{
  children: React.ReactNode;
  role: string;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}> = ({ children, role, fallback, loading, error }) => {
  return (
    <PermissionGuard
      role={role}
      fallback={fallback}
      loading={loading}
      error={error}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Component bảo vệ UI dựa trên multiple permissions
 */
export const MultiplePermissionGuard: React.FC<{
  children: React.ReactNode;
  permissions: Array<{ resource: Resource; action: Action }>;
  requireAll?: boolean;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}> = ({ children, permissions, requireAll, fallback, loading, error }) => {
  return (
    <PermissionGuard
      permissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
      loading={loading}
      error={error}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Component bảo vệ UI dựa trên multiple roles
 */
export const MultipleRoleGuard: React.FC<{
  children: React.ReactNode;
  roles: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}> = ({ children, roles, requireAll, fallback, loading, error }) => {
  return (
    <PermissionGuard
      roles={roles}
      requireAll={requireAll}
      fallback={fallback}
      loading={loading}
      error={error}
    >
      {children}
    </PermissionGuard>
  );
};

// ===== ADMIN GUARD COMPONENTS =====

/**
 * Component chỉ hiển thị cho admin
 */
export const AdminGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}> = ({ children, fallback, loading, error }) => {
  return (
    <RoleGuard role="admin" fallback={fallback} loading={loading} error={error}>
      {children}
    </RoleGuard>
  );
};

/**
 * Component chỉ hiển thị cho manager hoặc admin
 */
export const ManagerGuard: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  error?: React.ReactNode;
}> = ({ children, fallback, loading, error }) => {
  return (
    <MultipleRoleGuard
      roles={["admin", "manager"]}
      fallback={fallback}
      loading={loading}
      error={error}
    >
      {children}
    </MultipleRoleGuard>
  );
};

// ===== EXPORTS =====

export default PermissionGuard;
