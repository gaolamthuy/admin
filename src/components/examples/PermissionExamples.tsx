import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsAdmin } from '@/hooks/useAuth';
// Note: usePermissions không còn available, chỉ dùng useIsAdmin
import { CanAccess, AdminOnly, StaffOnly } from '@/components/auth/CanAccess';

/**
 * Examples of different permission approaches
 */
export const PermissionExamples = () => {
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();

  if (adminLoading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Permission Examples</h1>

      {/* Method 1: Direct useIsAdmin */}
      <Card>
        <CardHeader>
          <CardTitle>Method 1: Direct useIsAdmin</CardTitle>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <Button variant="destructive">Delete Product (Admin Only)</Button>
          ) : (
            <p className="text-muted-foreground">
              You don't have admin permissions
            </p>
          )}
        </CardContent>
      </Card>

      {/* Method 2: usePermissions - DISABLED (không còn available) */}
      <Card>
        <CardHeader>
          <CardTitle>Method 2: usePermissions (Disabled)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            usePermissions hook đã được xóa. Chỉ dùng useIsAdmin hiện tại.
          </p>
        </CardContent>
      </Card>

      {/* Method 3: CanAccess Component */}
      <Card>
        <CardHeader>
          <CardTitle>Method 3: CanAccess Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <CanAccess requireAdmin fallback={<p>Admin only content</p>}>
            <Button variant="destructive">Admin Delete Button</Button>
          </CanAccess>

          <CanAccess requireStaff fallback={<p>Staff only content</p>}>
            <Button variant="outline">Staff Edit Button</Button>
          </CanAccess>

          <CanAccess requireCreate fallback={<p>No create permission</p>}>
            <Button>Create Button</Button>
          </CanAccess>
        </CardContent>
      </Card>

      {/* Method 4: Shorthand Components */}
      <Card>
        <CardHeader>
          <CardTitle>Method 4: Shorthand Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AdminOnly fallback={<p>Admin only content</p>}>
            <Button variant="destructive">Admin Only Button</Button>
          </AdminOnly>

          <StaffOnly fallback={<p>Staff only content</p>}>
            <Button variant="outline">Staff Only Button</Button>
          </StaffOnly>
        </CardContent>
      </Card>
    </div>
  );
};
