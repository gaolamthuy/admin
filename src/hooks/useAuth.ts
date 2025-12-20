/**
 * Authentication hooks với TanStack Query
 * Quản lý session, user, và auth operations
 *
 * @module hooks/useAuth
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Interface cho AuthUser với role từ glt_users table
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role?: string;
}

/**
 * Hook lấy current session
 * Tự động refetch khi window focus để tránh stale data bugs
 *
 * @returns Query result với session data
 */
export const useSession = () => {
  return useQuery({
    queryKey: ['auth', 'session'],
    queryFn: async (): Promise<Session | null> => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data.session;
    },
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: true,
    retry: 1,
  });
};

/**
 * Hook lấy current user với role từ glt_users table
 * Tự động fetch role từ database sau khi có session
 *
 * @returns Query result với user data (bao gồm role)
 */
export const useAuthUser = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['auth', 'user', session?.user?.id],
    queryFn: async (): Promise<AuthUser | null> => {
      if (!session?.user) return null;

      try {
        // Get user role from glt_users table
        const { data: userData, error } = await supabase
          .from('glt_users')
          .select('role, note')
          .eq('user_id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, không phải error
          console.warn('Error fetching user role:', error);
        }

        return {
          id: session.user.id,
          email: session.user.email || '',
          name:
            session.user.user_metadata?.full_name ||
            session.user.email ||
            'User',
          avatar: session.user.user_metadata?.avatar_url,
          role: userData?.role || 'User',
        };
      } catch (error) {
        console.error('Error in useAuthUser:', error);
        // Return basic user info nếu không fetch được role
        return {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.email || 'User',
          role: 'User',
        };
      }
    },
    enabled: !!session?.user, // Chỉ fetch khi có session
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook check xem user có phải admin không
 *
 * @returns Object với isAdmin boolean và isLoading state
 */
export const useIsAdmin = () => {
  const { data: user, isLoading } = useAuthUser();

  return {
    isAdmin: user?.role === 'admin' || user?.role === 'Admin',
    isLoading,
  };
};

/**
 * Login mutation
 *
 * @returns Mutation object với login function
 */
export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate và refetch auth queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

/**
 * Register mutation
 *
 * @returns Mutation object với register function
 */
export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
};

/**
 * Logout mutation
 *
 * @returns Mutation object với logout function
 */
export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      // Clear all queries khi logout
      queryClient.clear();
    },
  });
};

/**
 * Forgot password mutation
 *
 * @returns Mutation object với forgotPassword function
 */
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return data;
    },
  });
};
