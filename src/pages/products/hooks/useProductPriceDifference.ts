import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Interface cho product với price difference data
 */
export interface ProductWithPriceDifference {
  product_id: number;
  product_code: string;
  product_name: string;
  base_price: number;
  latest_total_cost_per_unit: number | null;
  latest_price_difference: number | null;
  latest_price_difference_percent: number | null;
  inventory_cost: number | null;
  cost_difference: number | null;
  cost_difference_percent: number | null;
  category_id?: number | null;
  // Thêm fields từ kv_products
  kiotviet_id?: number;
  images?: string[];
  glt_labelprint_favorite?: boolean;
}

/**
 * Hook để query và quản lý products có chênh lệch giá
 * @param enabled - Có enable query không
 * @returns Object chứa products với price difference và loading state
 */
export const useProductPriceDifference = (enabled: boolean = false) => {
  const [products, setProducts] = useState<ProductWithPriceDifference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setProducts([]);
      return;
    }

    const fetchProductsWithPriceDifference = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query view v_products_admin để lấy products có purchase data
        // ⭐ Tối ưu: Lấy kv_images và kiotviet_id từ view, không cần query thêm kv_products
        const { data: priceComparisonData, error: priceError } = await supabase
          .from('v_products_admin')
          .select(
            `
              product_id,
              product_code,
              product_name,
              base_price,
              latest_total_cost_per_unit,
              latest_price_difference,
              latest_price_difference_percent,
              category_id,
              is_active,
              kiotviet_id,
              kv_images
            `
          )
          .not('latest_purchase_order_id', 'is', null);

        if (priceError) {
          throw new Error(
            `Error fetching price comparison: ${priceError.message}`
          );
        }

        if (!priceComparisonData || priceComparisonData.length === 0) {
          setProducts([]);
          return;
        }

        // Query inventory costs cho tất cả products
        const productIds = priceComparisonData.map(p => p.product_id);
        const { data: inventoryData, error: inventoryError } = await supabase
          .from('kv_product_inventories')
          .select('product_id, cost, branch_name')
          .in('product_id', productIds);

        // ⭐ Query thêm glt_labelprint_favorite từ kv_products (không có trong view)
        const { data: productsData, error: productsError } = await supabase
          .from('kv_products')
          .select('id, glt_labelprint_favorite')
          .in('id', productIds);

        if (inventoryError) {
          console.warn('Error fetching inventory costs:', inventoryError);
        }

        if (productsError) {
          console.warn('Error fetching products data:', productsError);
        }

        // Tạo map để lookup cost nhanh
        const costMap = new Map<number, number | null>();
        (inventoryData || []).forEach(inv => {
          costMap.set(inv.product_id, inv.cost);
        });

        // Tạo map để lookup product data nhanh (chỉ glt_labelprint_favorite từ kv_products)
        const productMap = new Map<
          number,
          {
            glt_labelprint_favorite: boolean;
          }
        >();
        (productsData || []).forEach(p => {
          productMap.set(p.id, {
            glt_labelprint_favorite: p.glt_labelprint_favorite || false,
          });
        });

        // Combine data và tính cost difference
        const productsWithDifference: ProductWithPriceDifference[] =
          priceComparisonData.map(pc => {
            const cost = costMap.get(pc.product_id) ?? null;
            const latestCost = pc.latest_total_cost_per_unit;
            const costDifference =
              cost && latestCost ? latestCost - cost : null;
            const costDifferencePercent =
              cost && latestCost && cost > 0
                ? ((latestCost - cost) / cost) * 100
                : null;

            const productData = productMap.get(pc.product_id);

            // Parse kv_images từ JSONB (từ kv_products.images - text[] đã convert sang jsonb)
            const kvImages = (pc.kv_images as string[] | null) || [];

            return {
              product_id: pc.product_id,
              product_code: pc.product_code,
              product_name: pc.product_name,
              base_price: pc.base_price,
              latest_total_cost_per_unit: pc.latest_total_cost_per_unit,
              latest_price_difference: pc.latest_price_difference,
              latest_price_difference_percent:
                pc.latest_price_difference_percent,
              inventory_cost: cost,
              cost_difference: costDifference,
              cost_difference_percent: costDifferencePercent,
              category_id: pc.category_id || null,
              // ⭐ Sử dụng data từ view (kiotviet_id, kv_images)
              kiotviet_id: pc.kiotviet_id || 0,
              images: kvImages, // ⭐ Từ kv_images trong view
              glt_labelprint_favorite:
                productData?.glt_labelprint_favorite || false,
            } as ProductWithPriceDifference & {
              kiotviet_id: number;
              images: string[];
              glt_labelprint_favorite: boolean;
            };
          });

        console.log('Price comparison data:', priceComparisonData.length);
        console.log('Inventory data:', inventoryData?.length || 0);
        console.log('Products data:', productsData?.length || 0);
        console.log('Products with difference:', productsWithDifference.length);

        // Sort theo cost_difference (absolute value) - lớn nhất trước
        // Nếu không có cost_difference, dùng latest_price_difference
        productsWithDifference.sort((a, b) => {
          const diffA = a.cost_difference
            ? Math.abs(a.cost_difference)
            : a.latest_price_difference
              ? Math.abs(a.latest_price_difference)
              : 0;
          const diffB = b.cost_difference
            ? Math.abs(b.cost_difference)
            : b.latest_price_difference
              ? Math.abs(b.latest_price_difference)
              : 0;
          return diffB - diffA; // Descending order
        });

        console.log('Final products count:', productsWithDifference.length);
        setProducts(productsWithDifference);
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error('Unknown error occurred');
        setError(error);
        console.error('Error fetching products with price difference:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsWithPriceDifference();
  }, [enabled]);

  /**
   * Get products sorted by cost difference (largest first)
   */
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const diffA = a.cost_difference ? Math.abs(a.cost_difference) : 0;
      const diffB = b.cost_difference ? Math.abs(b.cost_difference) : 0;
      return diffB - diffA;
    });
  }, [products]);

  /**
   * Get products with positive difference (cost > purchase price)
   */
  const positiveDifferenceProducts = useMemo(() => {
    return sortedProducts.filter(
      p => p.cost_difference && p.cost_difference > 0
    );
  }, [sortedProducts]);

  /**
   * Get products with negative difference (cost < purchase price)
   */
  const negativeDifferenceProducts = useMemo(() => {
    return sortedProducts.filter(
      p => p.cost_difference && p.cost_difference < 0
    );
  }, [sortedProducts]);

  return {
    products: sortedProducts,
    positiveDifferenceProducts,
    negativeDifferenceProducts,
    loading,
    error,
    count: products.length,
  };
};
