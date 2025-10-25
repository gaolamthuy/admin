/**
 * ProductCard Component Tests
 * Unit tests for ProductCard component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { ProductCard } from '../ProductCard';
import { renderWithProviders, createMockProductCard } from '@/test/utils';

// Mock useIsAdmin hook
vi.mock('@/hooks/useIsAdmin', () => ({
  useIsAdmin: vi.fn(() => ({ isAdmin: false, loading: false })),
}));

describe('ProductCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders product information correctly', () => {
      const product = createMockProductCard({
        name: 'Test Product',
        base_price: 100000,
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('renders product image', () => {
      const product = createMockProductCard({
        images: ['https://via.placeholder.com/300'],
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      const image = screen.getByAltText('Test Product');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://via.placeholder.com/300');
    });

    it('renders placeholder image when no images provided', () => {
      const product = createMockProductCard({
        images: undefined,
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      const image = screen.getByAltText('Test Product');
      expect(image).toHaveAttribute('src', '/placeholder-product.png');
    });

    it('renders formatted price', () => {
      const product = createMockProductCard({
        base_price: 100000,
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      // Price should be formatted as Vietnamese currency
      const priceElement = screen.getByText(/100/);
      expect(priceElement).toBeInTheDocument();
    });

    it('renders product code', () => {
      const product = createMockProductCard({
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      expect(screen.getByText('TEST-001')).toBeInTheDocument();
    });

    it('renders print buttons when code is provided', () => {
      const product = createMockProductCard({
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      expect(screen.getByText('10Kg')).toBeInTheDocument();
      expect(screen.getByText('5Kg')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('renders print buttons', () => {
      const product = createMockProductCard({
        id: '789',
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      expect(screen.getByText('10Kg')).toBeInTheDocument();
      expect(screen.getByText('5Kg')).toBeInTheDocument();
    });

    it('disables print buttons when no code provided', () => {
      const product = createMockProductCard({
        id: '123',
        code: undefined,
      });

      renderWithProviders(<ProductCard product={product} />);

      const buttons = screen.getAllByRole('button');
      // All print buttons should be disabled
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Props', () => {
    it('renders with all optional props', () => {
      const onEdit = vi.fn();
      const product = createMockProductCard({
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} onEdit={onEdit} />);

      expect(screen.getByText(product.name)).toBeInTheDocument();
    });

    it('renders with minimal props', () => {
      const product = createMockProductCard({
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      expect(screen.getByText(product.name)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      const product = createMockProductCard({
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('has alt text for images', () => {
      const product = createMockProductCard({
        code: 'TEST-001',
      });

      renderWithProviders(<ProductCard product={product} />);

      const image = screen.getByAltText(product.name);
      expect(image).toBeInTheDocument();
    });
  });
});
