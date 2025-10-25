import { useLogin } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { AuthCard, AuthForm, AuthLayout } from '../components';
import { useAuthValidation } from '../hooks';

/**
 * Login Page Component
 * Sử dụng shared components và hooks để giảm code duplication
 */
export const Login = () => {
  const { mutate: login } = useLogin();
  const { emailRules, passwordRules } = useAuthValidation();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (values: { email: string; password: string }) => {
    login({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <AuthLayout
      title="Đăng nhập Admin"
      subtitle="Quản lý hệ thống Gạo Lâm Thủy"
    >
      <AuthCard
        title="Đăng nhập"
        description="Nhập thông tin tài khoản để truy cập hệ thống"
      >
        <AuthForm form={form} onSubmit={onSubmit}>
          <FormField
            control={form.control}
            name="email"
            rules={emailRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="admin@gaolamthuy.com"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            rules={passwordRules}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mật khẩu</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="••••••••"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-default hover:text-primary/80"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </Button>
        </AuthForm>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

export default Login;
