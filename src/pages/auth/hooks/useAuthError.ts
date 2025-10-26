import { useState } from 'react';

interface UseAuthErrorProps {
  error?: string | null;
}

/**
 * useAuthError - Custom hook để handle auth errors
 * Cung cấp error message formatting và clearing functionality
 */
export const useAuthError = ({ error }: UseAuthErrorProps = {}) => {
  const [localError, setLocalError] = useState<string | null>(error || null);

  const getErrorMessage = (err: unknown): string => {
    if (typeof err === 'string') {
      return err;
    }

    if (err?.message) {
      return err.message;
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    // Default error messages based on error type
    if (err?.code === 'invalid_credentials') {
      return 'Email hoặc mật khẩu không chính xác';
    }

    if (err?.code === 'user_already_exists') {
      return 'Email này đã được đăng ký';
    }

    if (err?.code === 'weak_password') {
      return 'Mật khẩu không đủ mạnh';
    }

    return 'Có lỗi xảy ra, vui lòng thử lại';
  };

  const clearError = () => {
    setLocalError(null);
  };

  const setError = (err: unknown) => {
    setLocalError(getErrorMessage(err));
  };

  return {
    errorMessage: localError,
    clearError,
    setError,
    getErrorMessage,
  };
};

export default useAuthError;
