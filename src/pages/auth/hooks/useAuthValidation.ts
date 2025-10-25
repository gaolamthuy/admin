/**
 * useAuthValidation - Custom hook cung cấp validation rules cho auth forms
 * Reusable validation rules cho email, password, confirm password
 */
export const useAuthValidation = () => {
  const emailRules = {
    required: 'Email là bắt buộc',
    pattern: {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: 'Email không hợp lệ',
    },
  };

  const passwordRules = {
    required: 'Mật khẩu là bắt buộc',
    minLength: {
      value: 6,
      message: 'Mật khẩu phải có ít nhất 6 ký tự',
    },
  };

  const confirmPasswordRules = {
    required: 'Xác nhận mật khẩu là bắt buộc',
  };

  return {
    emailRules,
    passwordRules,
    confirmPasswordRules,
  };
};

export default useAuthValidation;
