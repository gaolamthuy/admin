import { useRegister } from '@refinedev/core';
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
 * Register Page Component
 * Sử dụng shared components và hooks để giảm code duplication
 */
export const Register = () => {
  const { mutate: register } = useRegister();
  const { emailRules, passwordRules } = useAuthValidation();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (values: {
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      form.setError('confirmPassword', {
        message: 'Mật khẩu xác nhận không khớp',
      });
      return;
    }

    register({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <AuthLayout title="Đăng ký tài khoản" subtitle="Tạo tài khoản admin mới">
      <AuthCard
        title="Đăng ký"
        description="Nhập thông tin để tạo tài khoản admin mới"
      >
        <AuthForm form={form as unknown as any} onSubmit={onSubmit as unknown as any}>
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

          <FormField
            control={form.control}
            name="confirmPassword"
            rules={{
              required: 'Xác nhận mật khẩu là bắt buộc',
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Xác nhận mật khẩu</FormLabel>
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

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </Button>
        </AuthForm>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
};

export default Register;
