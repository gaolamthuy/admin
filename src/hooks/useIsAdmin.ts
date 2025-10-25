/**
 * useIsAdmin Hook
 * Check if the current user has admin role
 */

import { useState, useEffect } from 'react';
import { supabaseClient } from '@/utility/supabaseClient';
import { useGetIdentity } from '@refinedev/core';

/**
 * Hook to check if user is admin
 * @returns Object with isAdmin boolean and loading state
 */
export const useIsAdmin = () => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const { data: user } = useGetIdentity<{ id: string }>();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check if user exists in glt_users table with admin role
        const { data, error } = await supabaseClient
          .from('glt_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data?.role === 'admin');
        }
      } catch (err) {
        console.error('Error in useIsAdmin:', err);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user?.id]);

  return { isAdmin, loading };
};

/**
 * usePermissions Hook
 * Enhanced permission checking for different roles
 * @returns Object with permission checks and loading state
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<{
    isAdmin: boolean;
    isStaff: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canCreate: boolean;
  }>({
    isAdmin: false,
    isStaff: false,
    canEdit: false,
    canDelete: false,
    canCreate: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const { data: user } = useGetIdentity<{ id: string }>();

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user?.id) {
        setPermissions({
          isAdmin: false,
          isStaff: false,
          canEdit: false,
          canDelete: false,
          canCreate: false,
        });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Check user role from glt_users table
        const { data, error } = await supabaseClient
          .from('glt_users')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error checking permissions:', error);
          setPermissions({
            isAdmin: false,
            isStaff: false,
            canEdit: false,
            canDelete: false,
            canCreate: false,
          });
        } else {
          const role = data?.role || 'user';
          const isAdmin = role === 'admin';
          const isStaff = role === 'staff' || isAdmin;

          setPermissions({
            isAdmin,
            isStaff,
            canEdit: isAdmin, // Only admin can edit
            canDelete: isAdmin, // Only admin can delete
            canCreate: isStaff, // Staff and admin can create
          });
        }
      } catch (err) {
        console.error('Error in usePermissions:', err);
        setPermissions({
          isAdmin: false,
          isStaff: false,
          canEdit: false,
          canDelete: false,
          canCreate: false,
        });
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [user?.id]);

  return { ...permissions, loading };
};
