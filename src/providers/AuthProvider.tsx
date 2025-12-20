/**
 * AuthProvider component
 * Lắng nghe auth state changes và sync với TanStack Query
 *
 * @module providers/AuthProvider
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider component
 * Lắng nghe auth state changes và sync với TanStack Query cache
 *
 * @param children - React children
 * @returns Fragment với children
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      queryClient.setQueryData(['auth', 'session'], session);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Update session trong TanStack Query cache
      queryClient.setQueryData(['auth', 'session'], session);

      // Invalidate user query để refetch với role mới
      if (session?.user) {
        queryClient.invalidateQueries({
          queryKey: ['auth', 'user', session.user.id],
        });
      } else {
        // Clear user data khi logout
        queryClient.removeQueries({ queryKey: ['auth', 'user'] });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return <>{children}</>;
};
