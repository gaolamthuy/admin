/**
 * Filter-related type definitions
 * @module types/filters
 */

import type { ReactNode } from 'react';

/**
 * Props for ProductFavoriteFilter component
 * @interface ProductFavoriteFilterProps
 */
export interface ProductFavoriteFilterProps {
  /**
   * Current pressed state of the toggle
   * @type {boolean}
   */
  pressed?: boolean;

  /**
   * Callback when toggle state changes
   * @param {boolean} pressed - New pressed state
   */
  onPressedChange?: (pressed: boolean) => void;

  /**
   * ARIA label for accessibility
   * @type {string}
   */
  'aria-label'?: string;

  /**
   * Additional CSS classes
   * @type {string}
   */
  className?: string;

  /**
   * Whether the toggle is disabled
   * @type {boolean}
   */
  disabled?: boolean;

  /**
   * Visual variant of the toggle
   * @type {"default" | "outline"}
   * @default "default"
   */
  variant?: 'default' | 'outline';

  /**
   * Size of the toggle
   * @type {"default" | "sm" | "lg"}
   * @default "default"
   */
  size?: 'default' | 'sm' | 'lg';
}

/**
 * Option for favorite filter
 * @interface FavoriteFilterOption
 */
export interface FavoriteFilterOption {
  /**
   * Value of the option
   * @type {"favorite"}
   */
  value: 'favorite';

  /**
   * Display label
   * @type {string}
   */
  label: string;

  /**
   * Optional icon to display
   * @type {ReactNode}
   */
  icon?: ReactNode;
}
