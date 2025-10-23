/**
 * Authentication Provider cho Refine
 * Cung cấp authentication logic cho Refine với Supabase Auth
 */
import type { AuthProvider } from "@refinedev/core";
import { supabase } from "../lib/supabase";
import { getUserProfile } from "../lib/auth";

/**
 * Auth Provider implementation
 * Implementation của AuthProvider cho Supabase
 */
export const authProvider: AuthProvider = {
  /**
   * Login method
   * Xử lý đăng nhập với email/password
   */
  login: async ({ email, password }) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: {
            message: error.message,
            name: error.name,
          },
        };
      }

      // Lấy user profile với role
      const profile = await getUserProfile(data.user?.id || "");

      if (!profile) {
        return {
          success: false,
          error: {
            message: "User profile not found",
            name: "ProfileNotFound",
          },
        };
      }

      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Login failed",
          name: error.name || "LoginError",
        },
      };
    }
  },

  /**
   * Logout method
   * Xử lý đăng xuất
   */
  logout: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
          name: error.name,
        },
      };
    }

    return {
      success: true,
      redirectTo: "/login",
    };
  },

  /**
   * Check authentication
   * Kiểm tra trạng thái authentication
   */
  onError: async (error) => {
    console.error("Auth error:", error);
    return { error };
  },

  /**
   * Get identity
   * Lấy thông tin user hiện tại
   */
  getIdentity: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      // Lấy profile với role
      const profile = await getUserProfile(user.id);

      if (!profile) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        role: profile.role,
        created_at: profile.created_at,
        note: profile.note,
      };
    } catch (error) {
      console.error("Error getting identity:", error);
      return null;
    }
  },

  /**
   * Check permissions
   * Kiểm tra quyền truy cập
   */
  check: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        return {
          authenticated: true,
        };
      }

      return {
        authenticated: false,
        error: {
          message: "Not authenticated",
          name: "NotAuthenticated",
        },
        logout: true,
        redirectTo: "/login",
      };
    } catch (error: any) {
      return {
        authenticated: false,
        error: {
          message: error.message || "Authentication check failed",
          name: error.name || "AuthCheckError",
        },
        logout: true,
        redirectTo: "/login",
      };
    }
  },

  /**
   * Get permissions
   * Lấy danh sách permissions của user
   */
  getPermissions: async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const profile = await getUserProfile(user.id);

      if (!profile) {
        return null;
      }

      // Trả về permissions dựa trên role
      return {
        role: profile.role,
        canCreate: profile.role === "admin" || profile.role === "staff",
        canEdit: profile.role === "admin" || profile.role === "staff",
        canDelete: profile.role === "admin",
        canView: true,
      };
    } catch (error) {
      console.error("Error getting permissions:", error);
      return null;
    }
  },
};
