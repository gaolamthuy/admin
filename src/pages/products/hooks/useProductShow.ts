/**
 * Hooks cho Product Show Page
 * Query product data, images, price comparison, và inventory
 *
 * @module pages/products/hooks/useProductShow
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/useAuth';

/**
 * Interface cho product image từ bảng glt_product_images
 */
export interface ProductImage {
  id: number;
  product_id: number | null;
  url: string | null;
  path: string | null;
  role: string | null;
  width: number | null;
  height: number | null;
  format: string | null;
  alt: string | null;
  description: string | null;
  rev: number | null;
  created_at: string;
  updated_at: string | null;
}

/**
 * Interface cho dữ liệu từ view v_products_admin
 */
export interface PurchaseOrderDetail {
  purchase_order_id: number;
  purchase_order_code: string;
  purchase_date: string | null;
  supplier_name: string | null;
  price: number;
  quantity: number;
  glt_extra_cost_per_unit: number;
  total_cost_per_unit: number;
  price_difference: number;
  price_difference_percent: number | null;
}

export interface ProductPriceComparison {
  product_id: number;
  product_code: string;
  product_name: string;
  base_price: number;
  new_baseprice_suggestion: number | null;
  recent_purchases: PurchaseOrderDetail[];
  purchase_stats: {
    avg_price: number | null;
    avg_total_cost: number | null;
    min_price: number | null;
    max_price: number | null;
    latest_price: number | null;
    latest_total_cost: number | null;
    total_quantity: number | null;
    purchase_count: number;
  };
  latest_purchase_order_id: number | null;
  latest_purchase_date: string | null;
  latest_total_cost_per_unit: number | null;
  latest_price_difference: number | null;
  latest_price_difference_percent: number | null;
  cost_diff_from_latest_po: number | null;
}

/**
 * Interface cho inventory cost từ kv_product_inventories
 */
export interface ProductInventory {
  product_id: number;
  cost: number | null;
  branch_id: number | null;
  branch_name: string | null;
}

/**
 * Hook để fetch product từ kv_products
 */
export const useProductShow = (id: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-show', id],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_products')
        .select('*, glt_images_homepage, glt_custom_image_url')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session && !!id,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

/**
 * Hook để fetch product images từ glt_product_images
 */
export const useProductImages = (kiotvietId: number | null | undefined) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-images', kiotvietId],
    queryFn: async (): Promise<ProductImage[]> => {
      if (!session || !kiotvietId) {
        return [];
      }

      const { data, error } = await supabase
        .from('glt_product_images')
        .select('*')
        .eq('product_id', kiotvietId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching product images:', error);
        return [];
      }

      // Sắp xếp theo role priority
      const rolePriority: Record<string, number> = {
        main: 1,
        package: 2,
        'package-thumbnail': 3,
        'package-original': 4,
        'main-thumbnail': 5,
        'main-resized': 6,
        'main-original': 7,
        'main-infoCard': 8,
      };

      return (data || []).sort((a, b) => {
        const priorityA = rolePriority[a.role || ''] || 999;
        const priorityB = rolePriority[b.role || ''] || 999;
        return priorityA - priorityB;
      }) as ProductImage[];
    },
    enabled: !!session && !!kiotvietId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook để fetch price comparison từ v_products_admin
 */
export const useProductPriceComparison = (
  productCode: string | null | undefined
) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-price-comparison', productCode],
    queryFn: async (): Promise<ProductPriceComparison | null> => {
      if (!session || !productCode) {
        return null;
      }

      const { data, error } = await supabase
        .from('v_products_admin')
        .select('*')
        .eq('product_code', productCode)
        .single();

      if (error) {
        // Không có dữ liệu - không phải lỗi nghiêm trọng
        if (error.code !== 'PGRST116') {
          // PGRST116 = no rows returned
          console.error('Error fetching price comparison:', error);
        }
        return null;
      }

      return data as ProductPriceComparison;
    },
    enabled: !!session && !!productCode,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook để fetch inventory cost từ kv_product_inventories
 */
export const useProductInventory = (productId: number | null | undefined) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-inventory', productId],
    queryFn: async (): Promise<ProductInventory | null> => {
      if (!session || !productId) {
        return null;
      }

      const { data, error } = await supabase
        .from('kv_product_inventories')
        .select('product_id, cost, branch_id, branch_name')
        .eq('product_id', productId)
        .single();

      if (error) {
        // Không có dữ liệu - không phải lỗi nghiêm trọng
        if (error.code !== 'PGRST116') {
          console.error('Error fetching inventory:', error);
        }
        return null;
      }

      return data as ProductInventory;
    },
    enabled: !!session && !!productId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook để update product fields (auto-save)
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      id,
      fields,
    }: {
      id: number;
      fields: {
        glt_retail_promotion?: boolean;
        glt_baseprice_markup?: number;
        glt_labelprint_favorite?: boolean;
      };
    }) => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('kv_products')
        .update(fields)
        .eq('id', id)
        .select('id')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate queries để refresh data
      queryClient.invalidateQueries({
        queryKey: ['product-show', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
