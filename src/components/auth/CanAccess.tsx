import React from 'react';
import { useIsAdmin, usePermissions } from '@/hooks/useIsAdmin';

interface CanAccessProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
  requireEdit?: boolean;
  requireDelete?: boolean;
  requireCreate?: boolean;
}

/**
 * CanAccess Component
 * Conditionally renders children based on user permissions
 *
 * @example
 * <CanAccess requireAdmin>
 *   <AdminOnlyButton />
 * </CanAccess>
 *
 * <CanAccess requireStaff fallback={<div>Staff only</div>}>
 *   <StaffContent />
 * </CanAccess>
 */
export const CanAccess: React.FC<CanAccessProps> = ({
  children,
  fallback = null,
  requireAdmin = false,
  requireStaff = false,
  requireEdit = false,
  requireDelete = false,
  requireCreate = false,
}) => {
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const {
    isStaff,
    canEdit,
    canDelete,
    canCreate,
    loading: permissionsLoading,
  } = usePermissions();

  // Show loading state while checking permissions
  if (adminLoading || permissionsLoading) {
    return null; // or a loading spinner
  }

  // Check specific permission requirements
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  if (requireStaff && !isStaff) {
    return <>{fallback}</>;
  }

  if (requireEdit && !canEdit) {
    return <>{fallback}</>;
  }

  if (requireDelete && !canDelete) {
    return <>{fallback}</>;
  }

  if (requireCreate && !canCreate) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * AdminOnly Component
 * Shorthand for admin-only content
 */
export const AdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <CanAccess requireAdmin fallback={fallback}>
    {children}
  </CanAccess>
);

/**
 * StaffOnly Component
 * Shorthand for staff-only content
 */
export const StaffOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback = null }) => (
  <CanAccess requireStaff fallback={fallback}>
    {children}
  </CanAccess>
);
