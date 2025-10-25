/**
 * ProductFavoriteFilter Component
 * Toggle filter for favorite products using Shadcn/UI Toggle component
 * @module components/products/ProductFavoriteFilter
 */

import React from 'react';
import { Heart } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import type { ProductFavoriteFilterProps } from '@/types';
import { cn } from '@/lib/utils';

/**
 * ProductFavoriteFilter Component
 * Simple toggle button to filter favorite products
 *
 * @example
 * ```tsx
 * <ProductFavoriteFilter
 *   pressed={isFavorite}
 *   onPressedChange={setIsFavorite}
 *   aria-label="Toggle favorite products"
 * />
 * ```
 */
export const ProductFavoriteFilter = ({
  pressed = false,
  onPressedChange,
  'aria-label': ariaLabel = 'Toggle favorite products',
  className = '',
  disabled = false,
  variant = 'outline',
  size: _size = 'default',
}: ProductFavoriteFilterProps) => {
  /**
   * Handle toggle state change
   * @param {boolean} newPressed - New pressed state
   */
  const handleToggle = (newPressed: boolean) => {
    onPressedChange?.(newPressed);
  };

  return (
    <Toggle
      pressed={pressed}
      onPressedChange={handleToggle}
      aria-label={ariaLabel}
      disabled={disabled}
      variant={variant}
      size="default"
      className={cn(
        'gap-2',
        'transition-all',
        'duration-200',
        pressed && 'text-red-500 hover:text-red-600',
        className
      )}
    >
      <Heart
        className={cn(
          'h-4 w-4',
          'transition-all',
          'duration-200',
          pressed && 'fill-current'
        )}
      />
      <span className="font-medium">Yêu thích</span>
    </Toggle>
  );
};

ProductFavoriteFilter.displayName = 'ProductFavoriteFilter';
