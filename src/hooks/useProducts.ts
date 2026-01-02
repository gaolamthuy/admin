/**
 * useProducts hook với TanStack Query
 * Fetch products từ Supabase với filters
 * Sử dụng v_products_admin view cho cả 2 tabs (Cơ bản và Nâng cao)
 *
 * @module hooks/useProducts
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';
import type { Product } from '@/types';

/**
 * Product filters interface
 */
export interface ProductFilters {
  category?: string | null;
  isFavorite?: boolean;
  showPriceDifference?: boolean;
  /**
   * Nếu true, chỉ lấy products có purchase data (latest_purchase_order_id IS NOT NULL)
   * Dùng cho tab "Nâng cao"
   */
  requirePurchaseData?: boolean;
}

/**
 * Hook fetch products với filters từ v_products_admin
 * View này có đầy đủ thông tin products và purchase data
 *
 * @param filters - Product filters (category, isFavorite, requirePurchaseData)
 * @returns Query result với products data
 */
export const useProducts = (filters: ProductFilters = {}) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['products', filters],
    queryFn: async (): Promise<Product[]> => {
      // Đảm bảo có session trước khi query
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Query từ v_products_admin view (có đầy đủ thông tin)
      // Tối ưu: Sử dụng kiotviet_id và images từ view thay vì query thêm
      let query = supabase
        .from('v_products_admin')
        .select(
          `
            product_id,
            kiotviet_id,
            product_code,
            product_name,
            base_price,
            category_id,
            category_name,
            is_active,
            latest_purchase_order_id,
            latest_total_cost_per_unit,
            latest_price_difference,
            latest_price_difference_percent,
            cost_diff_from_latest_po,
            images
          `
        )
        .eq('is_active', true);

      // Filter: chỉ lấy products có purchase data (cho tab Nâng cao)
      if (filters.requirePurchaseData) {
        query = query.not('latest_purchase_order_id', 'is', null);
      }

      // Apply category filter
      if (filters.category) {
        const categoryId = parseInt(filters.category, 10);
        if (!isNaN(categoryId)) {
          query = query.eq('category_id', categoryId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map data từ view sang Product format
      // Tối ưu: Chỉ query kv_products cho các fields không có trong view
      // View đã có: kiotviet_id, images (JSONB), category_name
      const productIds = (data || []).map(p => p.product_id);
      if (productIds.length === 0) {
        return [];
      }

      const { data: productsData, error: productsError } = await supabase
        .from('kv_products')
        .select(
          'id, code, glt_labelprint_favorite, master_unit_id, category_name, weight, unit, allows_sale, type, has_variants, description, glt_visible, glt_retail_promotion, glt_created_at, glt_updated_at, created_date, modified_date'
        )
        .in('id', productIds);
      // Note: v_products_admin đã filter master_unit_id = null rồi, không cần filter lại
      // Note: kiotviet_id và images đã có trong view, không cần query thêm

      if (productsError) {
        console.warn('Error fetching products details:', productsError);
      }

      // Tạo map để lookup product details nhanh
      const productMap = new Map<
        number,
        {
          glt_labelprint_favorite: boolean;
          category_name?: string | null;
          weight?: number | null;
          unit?: string | null;
          allows_sale?: boolean | null;
          type?: number | null;
          has_variants?: boolean | null;
          description?: string | null;
          glt_visible?: boolean | null;
          glt_retail_promotion?: boolean | null;
          glt_created_at?: string | null;
          glt_updated_at?: string | null;
          created_date?: string | null;
          modified_date?: string | null;
        }
      >();
      (productsData || []).forEach(p => {
        productMap.set(p.id, {
          glt_labelprint_favorite: p.glt_labelprint_favorite || false,
          category_name: p.category_name || null,
          weight: p.weight || null,
          unit: p.unit || null,
          allows_sale: p.allows_sale ?? null,
          type: p.type || null,
          has_variants: p.has_variants ?? null,
          description: p.description || null,
          glt_visible: p.glt_visible ?? null,
          glt_retail_promotion: p.glt_retail_promotion ?? null,
          glt_created_at: p.glt_created_at || null,
          glt_updated_at: p.glt_updated_at || null,
          created_date: p.created_date || null,
          modified_date: p.modified_date || null,
        });
      });

      // Combine data và map sang Product format
      // Tối ưu: Sử dụng kiotviet_id và images từ view
      const products: Product[] = (data || [])
        .map(p => {
          const productDetails = productMap.get(p.product_id);
          
          // Parse images từ JSONB (nếu có)
          // View trả về images dưới dạng JSONB array với structure:
          // [{ id, role, url, url_with_rev, path, width, height, format, rev, ... }]
          // Chúng ta chỉ cần extract URL cho Product.images (string[])
          const imagesFromView = (p.images as Array<{ url?: string; url_with_rev?: string }> | null) || [];
          const imageUrls = imagesFromView
            .map(img => img.url_with_rev || img.url)
            .filter((url): url is string => Boolean(url));
          
          return {
            id: Number(p.product_id),
            code: p.product_code || '',
            kiotviet_id: p.kiotviet_id || 0, // ⭐ Sử dụng từ view
            name: p.product_name || '',
            full_name: p.product_name || '',
            category_id: p.category_id || 0,
            category_name: productDetails?.category_name || p.category_name || '',
            base_price: p.base_price || 0,
            weight: productDetails?.weight || 0,
            unit: productDetails?.unit || '',
            is_active: p.is_active ?? true,
            allows_sale: productDetails?.allows_sale ?? true,
            type: productDetails?.type || 1,
            has_variants: productDetails?.has_variants ?? false,
            description: productDetails?.description || '',
            images: imageUrls, // ⭐ Sử dụng từ view
            glt_visible: productDetails?.glt_visible ?? true,
            glt_retail_promotion: productDetails?.glt_retail_promotion ?? false,
            glt_labelprint_favorite:
              productDetails?.glt_labelprint_favorite || false,
            glt_created_at: productDetails?.glt_created_at || '',
            glt_updated_at: productDetails?.glt_updated_at || '',
            created_date: productDetails?.created_date || '',
            modified_date: productDetails?.modified_date || '',
            // Extended fields for price difference (not in Product type, but used in ProductCard)
            priceDifference: p.latest_price_difference || null,
            priceDifferencePercent: p.latest_price_difference_percent || null,
            latestPurchaseCost: p.latest_total_cost_per_unit || null,
            costDiffFromLatestPo: p.cost_diff_from_latest_po || null,
          } as Product & {
            priceDifference?: number | null;
            priceDifferencePercent?: number | null;
            latestPurchaseCost?: number | null;
            costDiffFromLatestPo?: number | null;
          };
        })
        .filter(p => {
          // Apply favorite filter ở client level (vì view không có glt_labelprint_favorite)
          if (filters.isFavorite) {
            return p.glt_labelprint_favorite;
          }
          return true;
        });

      return products;
    },
    enabled: !!session, // Chỉ fetch khi đã authenticated
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: true, // Tránh stale data bugs
  });
};

/**
 * Hook fetch single product by ID
 *
 * @param id - Product ID
 * @returns Query result với product data
 */
export const useProduct = (id: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['products', id],
    queryFn: async (): Promise<Product | null> => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!session && !!id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook fetch product categories
 *
 * @returns Query result với categories data
 */
export const useProductCategories = () => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_product_categories')
        .select('category_id, category_name, glt_is_active')
        .eq('glt_is_active', true)
        .order('category_name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!session,
    staleTime: 10 * 60 * 1000, // 10 phút (categories ít thay đổi)
    refetchOnWindowFocus: false, // Categories không cần refetch thường xuyên
  });
};
