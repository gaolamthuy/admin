import { cn } from '@/lib/utils';
import React from 'react';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  className?: string;
}

/**
 * AuthHeader - Header component cho auth pages
 * Hiển thị logo, title, subtitle
 */
export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  showLogo = true,
  className,
}) => {
  return (
    <div className={cn('text-center', className)}>
      {showLogo && (
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-green-700">🌾 Gạo Lâm Thủy</h1>
        </div>
      )}
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
};

export default AuthHeader;
