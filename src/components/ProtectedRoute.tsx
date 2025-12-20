/**
 * ProtectedRoute component
 * Bảo vệ routes cần authentication
 *
 * @module components/ProtectedRoute
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useSession, useAuthUser, useIsAdmin } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component
 * Bảo vệ routes cần authentication
 *
 * @param children - React children
 * @param requireAdmin - Nếu true, chỉ admin mới được truy cập
 * @returns Protected route hoặc redirect to login
 */
export const ProtectedRoute = ({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) => {
  const location = useLocation();
  const { data: session, isLoading: sessionLoading } = useSession();
  const { isLoading: userLoading } = useAuthUser();
  const { isAdmin } = useIsAdmin();

  // Loading state
  if (sessionLoading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Require admin but user is not admin
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
