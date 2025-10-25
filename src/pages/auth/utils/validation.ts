/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate password strength
 * Yêu cầu: ít nhất 6 ký tự
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate password match
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

/**
 * Validation error messages (Vietnamese)
 */
export const VALIDATION_MESSAGES = {
  EMAIL_REQUIRED: 'Email là bắt buộc',
  EMAIL_INVALID: 'Email không hợp lệ',
  PASSWORD_REQUIRED: 'Mật khẩu là bắt buộc',
  PASSWORD_MIN_LENGTH: 'Mật khẩu phải có ít nhất 6 ký tự',
  CONFIRM_PASSWORD_REQUIRED: 'Xác nhận mật khẩu là bắt buộc',
  CONFIRM_PASSWORD_MISMATCH: 'Mật khẩu xác nhận không khớp',
};

/**
 * Form validation schemas
 */
export const VALIDATION_RULES = {
  email: {
    required: VALIDATION_MESSAGES.EMAIL_REQUIRED,
    pattern: {
      value: EMAIL_REGEX,
      message: VALIDATION_MESSAGES.EMAIL_INVALID,
    },
  },
  password: {
    required: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
    minLength: {
      value: 6,
      message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
    },
  },
  confirmPassword: {
    required: VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED,
  },
};
