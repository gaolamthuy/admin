/**
 * Custom hooks cho permission checking
 * Cung cấp các hooks để kiểm tra permissions và roles trong React components
 */

import { useState, useEffect, useCallback } from "react";
import { useGetIdentity } from "@refinedev/core";
import { supabase } from "../lib/supabase";
import type {
  Resource,
  Action,
  UserRolesResponse,
  UserPermissionsResponse,
  PermissionCheck,
  RoleCheck,
} from "../types/permissions";

// ===== PERMISSION CHECKING HOOKS =====

/**
 * Hook để kiểm tra user có permission cụ thể không
 * @param resource - Tài nguyên cần kiểm tra
 * @param action - Hành động cần kiểm tra
 * @returns Object chứa hasPermission và loading state
 */
export const usePermission = (resource: Resource, action: Action) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetIdentity();

  const checkPermission = useCallback(async () => {
    if (!user) {
      setHasPermission(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: checkError } = await supabase.rpc(
        "user_has_permission",
        {
          user_uuid: user.id,
          resource_name: resource,
          action_name: action,
        }
      );

      if (checkError) {
        throw checkError;
      }

      setHasPermission(data || false);
    } catch (err) {
      console.error("Error checking permission:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  }, [user, resource, action]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    hasPermission,
    loading,
    error,
    refetch: checkPermission,
  };
};

/**
 * Hook để kiểm tra user có role cụ thể không
 * @param roleName - Tên role cần kiểm tra
 * @returns Object chứa hasRole và loading state
 */
export const useRole = (roleName: string) => {
  const [hasRole, setHasRole] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetIdentity();

  const checkRole = useCallback(async () => {
    if (!user) {
      setHasRole(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: checkError } = await supabase.rpc("user_has_role", {
        user_uuid: user.id,
        role_name: roleName,
      });

      if (checkError) {
        throw checkError;
      }

      setHasRole(data || false);
    } catch (err) {
      console.error("Error checking role:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setHasRole(false);
    } finally {
      setLoading(false);
    }
  }, [user, roleName]);

  useEffect(() => {
    checkRole();
  }, [checkRole]);

  return {
    hasRole,
    loading,
    error,
    refetch: checkRole,
  };
};

/**
 * Hook để lấy tất cả roles của user hiện tại
 * @returns Object chứa roles array và loading state
 */
export const useUserRoles = () => {
  const [roles, setRoles] = useState<UserRolesResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetIdentity();

  const fetchUserRoles = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc("get_user_roles", {
        user_uuid: user.id,
      });

      if (fetchError) {
        throw fetchError;
      }

      setRoles(data || []);
    } catch (err) {
      console.error("Error fetching user roles:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserRoles();
  }, [fetchUserRoles]);

  return {
    roles,
    loading,
    error,
    refetch: fetchUserRoles,
  };
};

/**
 * Hook để lấy tất cả permissions của user hiện tại
 * @returns Object chứa permissions array và loading state
 */
export const useUserPermissions = () => {
  const [permissions, setPermissions] = useState<UserPermissionsResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetIdentity();

  const fetchUserPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc(
        "get_user_permissions",
        {
          user_uuid: user.id,
        }
      );

      if (fetchError) {
        throw fetchError;
      }

      setPermissions(data || []);
    } catch (err) {
      console.error("Error fetching user permissions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserPermissions();
  }, [fetchUserPermissions]);

  return {
    permissions,
    loading,
    error,
    refetch: fetchUserPermissions,
  };
};

// ===== BULK PERMISSION CHECKING =====

/**
 * Hook để kiểm tra nhiều permissions cùng lúc
 * @param permissionChecks - Array các permission cần kiểm tra
 * @returns Object chứa results array và loading state
 */
export const useMultiplePermissions = (
  permissionChecks: Array<{ resource: Resource; action: Action }>
) => {
  const [results, setResults] = useState<PermissionCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetIdentity();

  const checkMultiplePermissions = useCallback(async () => {
    if (!user || permissionChecks.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Tạo array các promises để check permissions
      const permissionPromises = permissionChecks.map(
        async ({ resource, action }) => {
          const { data, error: checkError } = await supabase.rpc(
            "user_has_permission",
            {
              user_uuid: user.id,
              resource_name: resource,
              action_name: action,
            }
          );

          if (checkError) {
            throw checkError;
          }

          return {
            hasPermission: data || false,
            resource,
            action,
          };
        }
      );

      const results = await Promise.all(permissionPromises);
      setResults(results);
    } catch (err) {
      console.error("Error checking multiple permissions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user, permissionChecks]);

  useEffect(() => {
    checkMultiplePermissions();
  }, [checkMultiplePermissions]);

  return {
    results,
    loading,
    error,
    refetch: checkMultiplePermissions,
  };
};

/**
 * Hook để kiểm tra nhiều roles cùng lúc
 * @param roleNames - Array các role names cần kiểm tra
 * @returns Object chứa results array và loading state
 */
export const useMultipleRoles = (roleNames: string[]) => {
  const [results, setResults] = useState<RoleCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useGetIdentity();

  const checkMultipleRoles = useCallback(async () => {
    if (!user || roleNames.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Tạo array các promises để check roles
      const rolePromises = roleNames.map(async (roleName) => {
        const { data, error: checkError } = await supabase.rpc(
          "user_has_role",
          {
            user_uuid: user.id,
            role_name: roleName,
          }
        );

        if (checkError) {
          throw checkError;
        }

        return {
          hasRole: data || false,
          roleName,
        };
      });

      const results = await Promise.all(rolePromises);
      setResults(results);
    } catch (err) {
      console.error("Error checking multiple roles:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [user, roleNames]);

  useEffect(() => {
    checkMultipleRoles();
  }, [checkMultipleRoles]);

  return {
    results,
    loading,
    error,
    refetch: checkMultipleRoles,
  };
};

// ===== UTILITY HOOKS =====

/**
 * Hook để kiểm tra user có phải admin không
 * @returns Object chứa isAdmin và loading state
 */
export const useIsAdmin = () => {
  return useRole("admin");
};

/**
 * Hook để kiểm tra user có thể quản lý users không
 * @returns Object chứa canManageUsers và loading state
 */
export const useCanManageUsers = () => {
  return usePermission("users", "manage");
};

/**
 * Hook để kiểm tra user có thể quản lý products không
 * @returns Object chứa canManageProducts và loading state
 */
export const useCanManageProducts = () => {
  return usePermission("products", "manage");
};

/**
 * Hook để kiểm tra user có thể quản lý customers không
 * @returns Object chứa canManageCustomers và loading state
 */
export const useCanManageCustomers = () => {
  return usePermission("customers", "manage");
};

/**
 * Hook để kiểm tra user có thể quản lý invoices không
 * @returns Object chứa canManageInvoices và loading state
 */
export const useCanManageInvoices = () => {
  return usePermission("invoices", "manage");
};
