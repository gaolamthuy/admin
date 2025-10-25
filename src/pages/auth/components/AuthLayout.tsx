import { cn } from '@/lib/utils';
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}

/**
 * AuthLayout - Wrapper component cho tất cả auth pages
 * Cung cấp consistent layout với responsive design
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  className,
}) => {
  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8',
        className
      )}
    >
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-foreground vietnamese-text">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground vietnamese-text">
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
