import { useCallback } from 'react';
import { useNavigate } from 'react-router';

interface UseAuthRedirectProps {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
}

/**
 * useAuthRedirect - Custom hook để handle auth redirects
 * Cung cấp redirect logic sau khi auth thành công/thất bại
 */
export const useAuthRedirect = ({
  onSuccess,
  onError,
}: UseAuthRedirectProps = {}) => {
  const navigate = useNavigate();

  const redirectToLogin = useCallback(() => {
    navigate('/auth/login');
  }, [navigate]);

  const redirectToRegister = useCallback(() => {
    navigate('/auth/register');
  }, [navigate]);

  const redirectToDashboard = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const redirectToForgotPassword = useCallback(() => {
    navigate('/auth/forgot-password');
  }, [navigate]);

  const handleAuthSuccess = useCallback(() => {
    onSuccess?.();
    redirectToDashboard();
  }, [onSuccess, redirectToDashboard]);

  const handleAuthError = useCallback(
    (error: unknown) => {
      onError?.(error);
    },
    [onError]
  );

  return {
    redirectToLogin,
    redirectToRegister,
    redirectToDashboard,
    redirectToForgotPassword,
    handleAuthSuccess,
    handleAuthError,
  };
};

export default useAuthRedirect;
