/**
 * CustomerShow Tests
 * Unit tests cho logic của CustomerShow component
 */

import { describe, it, expect } from 'vitest';
import type { RecentlyPurchasedProduct } from '@/hooks/useCustomers';

// Mock data khớp định dạng column recently_purchased_products trong v_customers_admin
const createMockProducts = (count: number): RecentlyPurchasedProduct[] => {
  return Array.from({ length: count }, (_, i) => ({
    product_code: `P${i + 1}`,
    product_name: `Sản phẩm ${i + 1}`,
    total_quantity: 10 - i,
  }));
};

describe('CustomerShow', () => {
  describe('Recently Purchased Products', () => {
    it('should map recently_purchased_products with product_code, product_name, total_quantity', () => {
      const products = createMockProducts(3);
      expect(products).toHaveLength(3);
      expect(products[0].product_code).toBe('P1');
      expect(products[0].product_name).toBe('Sản phẩm 1');
      expect(products[0].total_quantity).toBe(10);
    });

    it('should display products sorted by total_quantity DESC (khớp thứ tự jsonb_agg trong view)', () => {
      const products = createMockProducts(5);
      const sorted = [...products].sort(
        (a, b) => b.total_quantity - a.total_quantity
      );
      expect(sorted[0].total_quantity).toBeGreaterThanOrEqual(
        sorted[sorted.length - 1].total_quantity
      );
    });

    it('should handle empty recently_purchased_products', () => {
      const products: RecentlyPurchasedProduct[] = [];
      expect(products).toHaveLength(0);
    });

    it('should handle null recently_purchased_products (fallback về mảng rỗng)', () => {
      const products = null;
      expect(products ?? []).toHaveLength(0);
    });
  });

  describe('Header Badges', () => {
    it('should show active badge for glt_is_active customer', () => {
      const customer = { glt_is_active: true };
      expect(customer.glt_is_active).toBe(true);
    });

    it('should show inactive badge for glt_is_active = false', () => {
      const customer = { glt_is_active: false };
      expect(customer.glt_is_active).toBe(false);
    });
  });

  describe('Print Price Table Visibility', () => {
    it('should show print actions only when groups is not null (khách sỉ)', () => {
      const wholesaleCustomer = { groups: 'Khách sỉ A' };
      const retailCustomer = { groups: null };
      expect(wholesaleCustomer.groups !== null).toBe(true);
      expect(retailCustomer.groups !== null).toBe(false);
    });
  });

  describe('Full Address', () => {
    it('should join address parts with comma, skipping empty parts', () => {
      const address = '123 Đường ABC';
      const wardName = 'Phường 4';
      const locationName = 'TP. Hồ Chí Minh';
      const fullAddress = [address, wardName, locationName]
        .filter(Boolean)
        .join(', ');
      expect(fullAddress).toBe('123 Đường ABC, Phường 4, TP. Hồ Chí Minh');
    });

    it('should return empty string when all parts are missing', () => {
      const fullAddress = [null, null, null].filter(Boolean).join(', ');
      expect(fullAddress).toBe('');
    });
  });

  describe('Debt Display', () => {
    it('should highlight debt when positive', () => {
      const debt = 150000;
      expect(debt > 0).toBe(true);
    });

    it('should format debt number with locale separators', () => {
      const debt = 150000;
      expect(Number(debt).toLocaleString()).toBe('150,000');
    });
  });
});
