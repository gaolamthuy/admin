import { AccessControlProvider } from '@refinedev/core';
import { supabaseClient } from '@/utility';

/**
 * Access Control Provider for Refine
 * Handles role-based permissions for UI components
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ action }) => {
    try {
      // Get current user session
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session?.user) {
        return {
          can: false,
          reason: 'Not authenticated',
        };
      }

      // Get user role from glt_users table
      const { data: userData } = await supabaseClient
        .from('glt_users')
        .select('role')
        .eq('user_id', session.user.id)
        .single();

      const role = userData?.role || 'user';

      // Define permissions based on role
      const permissions = {
        admin: {
          // Admin can do everything
          list: true,
          show: true,
          create: true,
          edit: true,
          delete: true,
        },
        staff: {
          // Staff can list, show, create but not edit/delete
          list: true,
          show: true,
          create: true,
          edit: false,
          delete: false,
        },
        user: {
          // Regular users can only list and show
          list: true,
          show: true,
          create: false,
          edit: false,
          delete: false,
        },
      };

      const rolePermissions =
        permissions[role as keyof typeof permissions] || permissions.user;

      // Check if user has permission for this action
      const hasPermission =
        rolePermissions[action as keyof typeof rolePermissions];

      if (hasPermission) {
        return {
          can: true,
        };
      }

      return {
        can: false,
        reason: `Insufficient permissions. Required: ${action}, Current role: ${role}`,
      };
    } catch (error) {
      console.error('Access control error:', error);
      return {
        can: false,
        reason: 'Error checking permissions',
      };
    }
  },
};
