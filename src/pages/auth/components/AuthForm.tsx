import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import React from 'react';
import { UseFormReturn } from 'react-hook-form';

interface AuthFormProps {
  children: React.ReactNode;
  form: UseFormReturn<any>;
  onSubmit: (values: any) => void;
  className?: string;
}

/**
 * AuthForm - Form wrapper cho auth forms
 * Sử dụng shadcn Form components với consistent styling
 */
export const AuthForm: React.FC<AuthFormProps> = ({
  children,
  form,
  onSubmit,
  className,
}) => {
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        {children}
      </form>
    </Form>
  );
};

export default AuthForm;
