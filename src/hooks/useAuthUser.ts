import { useState, useEffect } from 'react';
import { client } from '@/lib/neon';
import type { AuthChangeEvent, Session } from '@supabase/auth-js';

interface AuthUser {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

/**
 * useAuthUser Hook
 * Lấy thông tin user từ Supabase Auth
 */
export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession();
        if (session?.user) {
          // Get user role from glt_users table
          const { data: userData } = await client
            .from('glt_users')
            .select('role, note')
            .eq('user_id', session.user.id)
            .single();

          setUser({
            name:
              session.user.user_metadata?.full_name ||
              session.user.email ||
              'User',
            email: session.user.email || '',
            avatar: session.user.user_metadata?.avatar_url,
            role: userData?.role || 'User',
          });
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(
      async (_event: string, session: Session | null) => {
        if (session?.user) {
          try {
            // Get user role from glt_users table
            const { data: userData } = await client
              .from('glt_users')
              .select('role, note')
              .eq('user_id', session.user.id)
              .single();

            setUser({
              name:
                session.user.user_metadata?.full_name ||
                session.user.email ||
                'User',
              email: session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url,
              role: userData?.role || 'User',
            });
          } catch (error) {
            console.error('Error getting user role:', error);
            setUser({
              name:
                session.user.user_metadata?.full_name ||
                session.user.email ||
                'User',
              email: session.user.email || '',
              avatar: session.user.user_metadata?.avatar_url,
              role: 'User',
            });
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await client.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    loading,
    signOut,
  };
}
