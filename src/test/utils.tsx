/**
 * Test utilities and helpers
 * Custom render functions and mock factories
 */
/* eslint-disable react-refresh/only-export-components */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { Product, ProductCard } from '@/types';

/**
 * Custom render function with providers
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

/**
 * Mock product factory
 */
export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  id: 1,
  kiotviet_id: 1001,
  code: 'PROD-001',
  name: 'Test Product',
  full_name: 'Test Product Full Name',
  category_id: 1,
  category_name: 'Test Category',
  base_price: 100000,
  weight: 1.5,
  unit: 'kg',
  is_active: true,
  allows_sale: true,
  type: 1,
  has_variants: false,
  description: 'Test product description',
  images: ['https://via.placeholder.com/300'],
  glt_visible: true,
  glt_retail_promotion: false,
  glt_created_at: new Date().toISOString(),
  glt_updated_at: new Date().toISOString(),
  created_date: new Date().toISOString(),
  modified_date: new Date().toISOString(),
  ...overrides,
});

/**
 * Mock product card factory
 */
export const createMockProductCard = (
  overrides?: Partial<ProductCard>
): ProductCard => ({
  id: '1',
  kiotviet_id: 1001,
  code: 'PROD-001',
  name: 'Test Product',
  full_name: 'Test Product Full Name',
  category_name: 'Test Category',
  base_price: 100000,
  images: ['https://via.placeholder.com/300'],
  is_active: true,
  glt_visible: true,
  glt_labelprint_favorite: false,
  ...overrides,
});

/**
 * Mock products array
 */
export const createMockProducts = (count: number = 5): Product[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockProduct({
      id: i + 1,
      code: `PROD-${String(i + 1).padStart(3, '0')}`,
      name: `Product ${i + 1}`,
    })
  );
};

/**
 * Mock product cards array
 */
export const createMockProductCards = (count: number = 5): ProductCard[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockProductCard({
      id: String(i + 1),
      name: `Product ${i + 1}`,
    })
  );
};

/**
 * Mock Supabase client
 */
export const mockSupabaseClient = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: createMockProducts(),
        error: null,
      })),
      order: vi.fn(() => ({
        data: createMockProducts(),
        error: null,
      })),
    })),
    insert: vi.fn(() => ({
      data: createMockProduct(),
      error: null,
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: createMockProduct(),
        error: null,
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({
        data: null,
        error: null,
      })),
    })),
  })),
});

/**
 * Mock router
 */
export const mockRouter = () => ({
  navigate: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
});

/**
 * Wait for async operations
 */
export const waitForAsync = () =>
  new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
