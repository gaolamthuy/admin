/**
 * Auth form default values
 */
export const AUTH_DEFAULT_VALUES = {
  login: {
    email: '',
    password: '',
  },
  register: {
    email: '',
    password: '',
    confirmPassword: '',
  },
  forgotPassword: {
    email: '',
  },
};

/**
 * Auth route paths
 */
export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  DASHBOARD: '/',
};

/**
 * Auth form labels (Vietnamese)
 */
export const AUTH_LABELS = {
  EMAIL: 'Email',
  PASSWORD: 'Mật khẩu',
  CONFIRM_PASSWORD: 'Xác nhận mật khẩu',
  LOGIN: 'Đăng nhập',
  REGISTER: 'Đăng ký',
  FORGOT_PASSWORD: 'Quên mật khẩu',
  SUBMIT: 'Gửi',
};

/**
 * Auth form placeholders (Vietnamese)
 */
export const AUTH_PLACEHOLDERS = {
  EMAIL: 'admin@gaolamthuy.com',
  PASSWORD: '••••••••',
};

/**
 * Auth error messages (Vietnamese)
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
  USER_ALREADY_EXISTS: 'Email này đã được đăng ký',
  WEAK_PASSWORD: 'Mật khẩu không đủ mạnh',
  GENERIC_ERROR: 'Có lỗi xảy ra, vui lòng thử lại',
};

/**
 * Auth success messages (Vietnamese)
 */
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công',
  REGISTER_SUCCESS: 'Đăng ký thành công',
  FORGOT_PASSWORD_SENT: 'Link đặt lại mật khẩu đã được gửi đến email của bạn',
};
