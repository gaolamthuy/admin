import React from 'react';
import { useIsAdmin } from '@/hooks/useAuth';
// Note: usePermissions không còn available, chỉ dùng useIsAdmin

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
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  // Show loading state while checking permissions
  if (adminLoading) {
    return null; // or a loading spinner
  }

  // Check specific permission requirements
  // Note: Chỉ support requireAdmin hiện tại, các permission khác cần implement sau
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>;
  }

  // TODO: Implement staff/edit/delete/create permissions
  // Hiện tại chỉ support admin check
  if (requireStaff || requireEdit || requireDelete || requireCreate) {
    console.warn(
      'CanAccess: requireStaff/requireEdit/requireDelete/requireCreate chưa được implement, chỉ support requireAdmin'
    );
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
