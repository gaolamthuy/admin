/**
 * ProductPriceDifferenceFilter Component
 * Toggle để sort products theo cost_diff_from_latest_po (admin only)
 * @module components/products/ProductPriceDifferenceFilter
 */

import React from 'react';
import { Bookmark } from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';

/**
 * Props cho ProductPriceDifferenceFilter
 */
interface ProductPriceDifferenceFilterProps {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  'aria-label'?: string;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline';
}

/**
 * ProductPriceDifferenceFilter Component
 * Toggle button để sort products theo cost_diff_from_latest_po
 *
 * @example
 * ```tsx
 * <ProductPriceDifferenceFilter
 *   pressed={sortByPriceDifference}
 *   onPressedChange={setSortByPriceDifference}
 *   aria-label="Sort by price difference"
 * />
 * ```
 */
export const ProductPriceDifferenceFilter = ({
  pressed = false,
  onPressedChange,
  'aria-label': ariaLabel = 'Sort by price difference',
  className = '',
  disabled = false,
  variant = 'outline',
}: ProductPriceDifferenceFilterProps) => {
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
      size="sm"
      className={cn(
        'gap-2',
        'h-10', // Đồng nhất với các filter khác
        'transition-all',
        'duration-200',
        'data-[state=on]:bg-transparent',
        'data-[state=on]:*:[svg]:fill-primary',
        'data-[state=on]:*:[svg]:stroke-primary',
        className
      )}
    >
      <Bookmark className="h-4 w-4" />
      <span className="font-medium">Giá chênh lệch</span>
    </Toggle>
  );
};

ProductPriceDifferenceFilter.displayName = 'ProductPriceDifferenceFilter';
