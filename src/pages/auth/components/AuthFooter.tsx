import { cn } from '@/lib/utils';
import { Link } from 'react-router';
import React from 'react';

interface AuthFooterLink {
  text: string;
  href: string;
}

interface AuthFooterProps {
  links: AuthFooterLink[];
  className?: string;
}

/**
 * AuthFooter - Footer component cho auth pages
 * Hiển thị navigation links
 */
export const AuthFooter: React.FC<AuthFooterProps> = ({ links, className }) => {
  return (
    <div className={cn('mt-6 text-center', className)}>
      <div className="flex flex-wrap justify-center gap-4">
        {links.map((link, index) => (
          <Link
            key={index}
            to={link.href}
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            {link.text}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AuthFooter;
