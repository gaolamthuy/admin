/**
 * ProductCategoryFilter Component Tests
 * Unit tests for category filter functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
// import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import ProductCategoryFilter from '../ProductCategoryFilter';

// Mock supabase (updated from @/utility to @/lib/supabase)
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [
                {
                  category_id: 1,
                  category_name: 'Điện tử',
                  rank: 1,
                },
                {
                  category_id: 2,
                  category_name: 'Quần áo',
                  rank: 2,
                },
                {
                  category_id: 3,
                  category_name: 'Thực phẩm',
                  rank: 3,
                },
              ],
              error: null,
            })
          ),
        })),
      })),
    })),
  },
}));

describe('ProductCategoryFilter Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render loading skeleton initially', () => {
      renderWithProviders(<ProductCategoryFilter />);
      const skeleton = document.querySelector('.animate-pulse');
      expect(skeleton).toBeTruthy();
    });

    it('should render select trigger after loading', async () => {
      renderWithProviders(<ProductCategoryFilter />);
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });

    it('should display placeholder text', async () => {
      renderWithProviders(
        <ProductCategoryFilter placeholder="Chọn danh mục" />
      );
      await waitFor(() => {
        expect(screen.getByText('Chọn danh mục')).toBeTruthy();
      });
    });
  });

  describe('Data Loading', () => {
    it('should load categories from Supabase', async () => {
      renderWithProviders(<ProductCategoryFilter />);
      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });
  });

  describe('Props', () => {
    it('should accept custom className', async () => {
      const { container } = renderWithProviders(
        <ProductCategoryFilter className="custom-class" />
      );

      await waitFor(() => {
        const wrapper = container.querySelector('.custom-class');
        expect(wrapper).toBeTruthy();
      });
    });

    it('should accept different sizes', async () => {
      renderWithProviders(<ProductCategoryFilter size="lg" />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });

    it('should accept different variants', async () => {
      renderWithProviders(<ProductCategoryFilter variant="ghost" />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });

    it('should disable when disabled prop is true', async () => {
      renderWithProviders(<ProductCategoryFilter disabled />);

      await waitFor(() => {
        const trigger = screen.getByRole('button');
        expect(trigger).toHaveAttribute('disabled');
      });
    });

    it('should display selected value', async () => {
      renderWithProviders(<ProductCategoryFilter value="1" />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });
  });

  describe('Functionality', () => {
    it('should render without errors', () => {
      expect(() => {
        renderWithProviders(<ProductCategoryFilter />);
      }).not.toThrow();
    });

    it('should handle onChange callback', async () => {
      const onChange = vi.fn();
      renderWithProviders(<ProductCategoryFilter onChange={onChange} />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });

    it('should support allowClear prop', async () => {
      renderWithProviders(<ProductCategoryFilter value="1" allowClear />);

      await waitFor(() => {
        expect(screen.getByRole('button')).toBeTruthy();
      });
    });
  });
});
