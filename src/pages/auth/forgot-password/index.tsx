import { useForgotPassword } from '@refinedev/core';
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
 * ForgotPassword Page Component
 * Sử dụng shared components và hooks để giảm code duplication
 */
export const ForgotPassword = () => {
  const { mutate: forgotPassword } = useForgotPassword();
  const { emailRules } = useAuthValidation();

  const form = useForm({
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (values: { email: string }) => {
    forgotPassword({
      email: values.email,
    });
  };

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email để nhận link đặt lại mật khẩu"
    >
      <AuthCard
        title="Đặt lại mật khẩu"
        description="Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn"
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

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? 'Đang gửi...'
              : 'Gửi link đặt lại mật khẩu'}
          </Button>
        </AuthForm>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Nhớ mật khẩu?{' '}
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

export default ForgotPassword;
