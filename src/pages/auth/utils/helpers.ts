/**
 * Format form data before submission
 */
export const formatFormData = (
  data: unknown,
  type: 'login' | 'register' | 'forgot-password'
) => {
  switch (type) {
    case 'login':
      return {
        email: data.email.trim(),
        password: data.password,
      };
    case 'register':
      return {
        email: data.email.trim(),
        password: data.password,
      };
    case 'forgot-password':
      return {
        email: data.email.trim(),
      };
    default:
      return data;
  }
};

/**
 * Format error message for display
 */
export const formatErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error?.message) {
    return error.error.message;
  }

  return 'Có lỗi xảy ra, vui lòng thử lại';
};

/**
 * Generate auth URL
 */
export const generateAuthUrl = (path: string): string => {
  return `/auth${path}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('vi-VN');
};

/**
 * Check if email is valid format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

/**
 * Check if password is strong enough
 */
export const isStrongPassword = (password: string): boolean => {
  return password.length >= 6;
};
