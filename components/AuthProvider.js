import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Spin } from 'antd';

const AuthContext = createContext(null);

// Define page access rules
const PAGE_ACCESS = {
  PUBLIC: ['/login', '/'],
  ADMIN: ['/admin'],
  USER: ['/dashboard']
};

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check localStorage for auth status on mount
  useEffect(() => {
    const checkAuth = () => {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');
      
      if (!username || !password) {
        console.log('[AuthProvider] No credentials found in localStorage');
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('[AuthProvider] Checking admin status:', { 
        username, 
        isAdminUsername: username === process.env.NEXT_PUBLIC_ADMIN_USERNAME,
        envUsername: process.env.NEXT_PUBLIC_ADMIN_USERNAME
      });

      const isAdminUser = username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && 
                         password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
      const isRegularUser = username === process.env.NEXT_PUBLIC_AUTH_USERNAME && 
                           password === process.env.NEXT_PUBLIC_AUTH_PASSWORD;
      
      console.log('[AuthProvider] Auth check result:', { isAdminUser, isRegularUser });
      
      setIsAuthenticated(isAdminUser || isRegularUser);
      setIsAdmin(isAdminUser);
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Improved routing logic with role-based access control
  useEffect(() => {
    if (loading) return;

    const currentPath = router.pathname;
    
    // Helper function to check if path starts with any of the paths in the array
    const pathStartsWith = (paths, currentPath) => 
      paths.some(path => currentPath === path || currentPath.startsWith(`${path}/`));

    const isPublicPath = PAGE_ACCESS.PUBLIC.includes(currentPath);
    const isAdminPath = pathStartsWith(PAGE_ACCESS.ADMIN, currentPath);
    const isUserPath = pathStartsWith(PAGE_ACCESS.USER, currentPath);

    console.log('[AuthProvider] Route check:', {
      currentPath,
      isPublicPath,
      isAdminPath,
      isUserPath,
      isAuthenticated,
      isAdmin
    });

    const handleRouting = async () => {
      try {
        // Not authenticated users can only access public paths
        if (!isAuthenticated && !isPublicPath) {
          console.log('[AuthProvider] Redirecting to login (not authenticated)');
          await router.push('/login');
          return;
        }

        // Authenticated users on public paths should be redirected to their default page
        if (isAuthenticated && isPublicPath) {
          console.log('[AuthProvider] Redirecting from public path');
          await router.push(isAdmin ? '/admin/purchase-order' : '/dashboard');
          return;
        }

        // Regular users cannot access admin paths
        if (isAuthenticated && !isAdmin && isAdminPath) {
          console.log('[AuthProvider] Redirecting regular user from admin path');
          await router.push('/dashboard');
          return;
        }

        // No need to redirect in other cases - let users access their allowed paths
      } catch (error) {
        console.error('[AuthProvider] Routing error:', error);
      }
    };

    handleRouting();
  }, [isAuthenticated, isAdmin, router.pathname, loading]);

  const login = useCallback(async (username, password) => {
    const isAdminUser = username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && 
                       password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
    const isRegularUser = username === process.env.NEXT_PUBLIC_AUTH_USERNAME && 
                         password === process.env.NEXT_PUBLIC_AUTH_PASSWORD;
    
    if (!isAdminUser && !isRegularUser) {
      throw new Error('Invalid credentials');
    }

    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    setIsAuthenticated(true);
    setIsAdmin(isAdminUser);
    
    // Redirect based on role
    router.push(isAdminUser ? '/admin/purchase-order' : '/dashboard');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    setIsAuthenticated(false);
    setIsAdmin(false);
    router.push('/login');
  }, [router]);

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isAdmin, 
      login, 
      logout,
      loading,
      // Add helper functions for role checking
      canAccessAdmin: isAuthenticated && isAdmin,
      canAccessDashboard: isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 