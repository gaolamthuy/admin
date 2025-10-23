/**
 * Authentication utilities và helpers
 * Các utility functions cho authentication với Supabase
 */
import { supabase } from "./supabase";
import type { AuthError, User } from "@supabase/supabase-js";

/**
 * Interface cho user profile
 * Định nghĩa structure của user profile
 */
export interface UserProfile {
  id: string;
  email: string;
  role: "admin" | "staff";
  created_at: string;
  note?: string;
}

/**
 * Login với email và password
 * @param email - Email của user
 * @param password - Password của user
 * @returns Promise với user data hoặc error
 */
export const login = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Lấy thông tin role từ glt_users table
    const { data: userProfile } = await supabase
      .from("glt_users")
      .select("*")
      .eq("user_id", data.user?.id)
      .single();

    return {
      user: data.user,
      profile: userProfile,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error as AuthError,
    };
  }
};

/**
 * Logout user
 * @returns Promise<void>
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Lấy current user
 * @returns Promise<User | null>
 */
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

/**
 * Lấy user profile với role
 * @param userId - ID của user
 * @returns Promise<UserProfile | null>
 */
export const getUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("glt_users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

/**
 * Check quyền admin
 * @param user - User object
 * @returns boolean
 */
export const isAdmin = (user: User | null): boolean => {
  // Logic check admin role sẽ được implement trong auth provider
  return false;
};

/**
 * Check quyền staff
 * @param user - User object
 * @returns boolean
 */
export const isStaff = (user: User | null): boolean => {
  // Logic check staff role sẽ được implement trong auth provider
  return false;
};
