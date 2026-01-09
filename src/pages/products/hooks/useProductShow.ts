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
 * Hook để fetch product từ v_products_admin (tối ưu hoàn toàn)
 * Sử dụng view v_products_admin để lấy đầy đủ data, không cần query kv_products
 * Các fields thiếu được đóng gói trong glt_custom_fields JSONB
 *
 * @param id - kv_products.id
 */
export const useProductShow = (id: string | number) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-show', id],
    queryFn: async () => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Query từ v_products_admin (có đầy đủ tất cả fields)
      const { data: viewData, error: viewError } = await supabase
        .from('v_products_admin')
        .select('*')
        .eq('product_id', id)
        .single();

      if (viewError) {
        // Nếu không tìm thấy trong view, fallback về query trực tiếp từ kv_products
        if (viewError.code === 'PGRST116') {
          console.warn(
            'Product not found in v_products_admin, falling back to direct query'
          );
          const { data, error } = await supabase
            .from('kv_products')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          return data;
        }
        throw viewError;
      }

      // Parse glt_custom_fields JSONB để lấy các fields thiếu
      const customFields = (viewData.glt_custom_fields as {
        glt_visible?: boolean;
        glt_retail_promotion?: boolean;
        glt_labelprint_favorite?: boolean;
        glt_images_homepage?: any;
        glt_custom_image_url?: string | null;
      }) || {};

      // Map data từ view sang format tương thích với ProductShow
      return {
        // Basic fields từ view
        id: viewData.product_id,
        kiotviet_id: viewData.kiotviet_id,
        code: viewData.product_code,
        name: viewData.product_name,
        full_name: viewData.product_name, // ⭐ Sử dụng product_name từ view (đã là full_name)
        base_price: viewData.base_price,
        category_name: viewData.category_name,
        category_id: viewData.category_id,
        is_active: viewData.is_active,
        glt_baseprice_markup: viewData.glt_baseprice_markup,
        // Fields từ glt_custom_fields JSONB
        glt_visible: customFields.glt_visible ?? true,
        glt_retail_promotion: customFields.glt_retail_promotion ?? false,
        glt_labelprint_favorite: customFields.glt_labelprint_favorite ?? false,
        glt_images_homepage: customFields.glt_images_homepage || null,
        glt_custom_image_url: customFields.glt_custom_image_url || null,
        // Extended fields từ view
        glt_images: viewData.glt_images, // ⭐ Từ glt_product_images
        kv_images: viewData.kv_images, // ⭐ Từ kv_products.images
        inventory_cost: viewData.inventory_cost,
        // Spread tất cả fields khác từ view để đảm bảo backward compatibility
        ...viewData,
      };
    },
    enabled: !!session && !!id,
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};

/**
 * Hook để fetch product images từ v_products_admin
 * Tối ưu: Sử dụng images JSONB từ view thay vì query riêng glt_product_images
 * Images đã được sort theo role priority trong view (feature → closeup → package → infocard)
 *
 * @param productId - kv_products.id (không phải kiotviet_id)
 */
export const useProductImages = (productId: number | null | undefined) => {
  const { data: session } = useSession();

  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: async (): Promise<ProductImage[]> => {
      if (!session || !productId) {
        return [];
      }

      // Query từ v_products_admin để lấy glt_images đã được aggregate sẵn
      const { data, error } = await supabase
        .from('v_products_admin')
        .select('glt_images, kiotviet_id')
        .eq('product_id', productId)
        .single();

      if (error) {
        // Nếu không tìm thấy trong view, fallback về query trực tiếp
        if (error.code === 'PGRST116') {
          // No rows returned - có thể product chưa có trong view
          // Fallback: query trực tiếp từ glt_product_images (cần kiotviet_id)
          console.warn(
            'Product not found in v_products_admin, falling back to direct query'
          );
          return [];
        }
        console.error('Error fetching product images:', error);
        return [];
      }

      // Parse glt_images từ JSONB array (từ glt_product_images)
      const images = (data.glt_images || []) as Array<{
        id: number;
        role: string;
        url: string | null;
        url_with_rev: string | null;
        url_r2_dev: string | null;
        path: string | null;
        width: number | null;
        height: number | null;
        format: string | null;
        rev: number | null;
        rev_datetime: string | null;
        updated_at: string | null;
      }>;

      // Map sang ProductImage interface
      // Sử dụng url_with_rev nếu có (cho cache busting), fallback về url
      return images.map(
        img =>
          ({
            id: img.id,
            product_id: data.kiotviet_id,
            url: img.url_with_rev || img.url || null,
            path: img.path,
            role: img.role,
            width: img.width,
            height: img.height,
            format: img.format,
            rev: img.rev,
            updated_at: img.updated_at,
            created_at: img.rev_datetime || img.updated_at || new Date().toISOString(),
            alt: null,
            description: null,
          }) as ProductImage
      );
    },
    enabled: !!session && !!productId,
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

/**
 * Hook để regenerate product images thông qua n8n webhook
 * Gọi đến n8n workflow quHZ8rLzImz6T3ta, node "handle admin ui"
 *
 * @param kiotvietId - kv_products.kiotviet_id
 * @param role - Role prefix: 'feature' | 'closeup' | 'package' | 'infocard'
 */
export const useRegenerateProductImages = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const buildWebhookUrl = (baseUrl?: string) => {
    if (!baseUrl) return null;
    return `${baseUrl.replace(/\/$/, '')}/handle-admin-regenerate-product-image`;
  };

  const encodeBasicAuth = (value?: string) => {
    if (!value) return undefined;
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(value);
    }
    return value;
  };

  const webhookUrl = buildWebhookUrl(import.meta.env.VITE_N8N_WEBHOOK_URL);
  const basicAuthToken = encodeBasicAuth(
    import.meta.env.VITE_N8N_WEBHOOK_BASIC_AUTH
  );
  const customHeaderKey = import.meta.env.VITE_N8N_WEBHOOK_HEADER_KEY;
  const customHeaderValue = import.meta.env.VITE_N8N_WEBHOOK_HEADER_VALUE;

  const authHeaders: Record<string, string> = {};
  if (basicAuthToken) {
    authHeaders.Authorization = `Basic ${basicAuthToken}`;
  }
  if (customHeaderKey && customHeaderValue) {
    authHeaders[customHeaderKey] = customHeaderValue;
  }

  return useMutation({
    mutationFn: async ({
      kiotvietId,
      role,
    }: {
      kiotvietId: number;
      role: 'feature' | 'closeup' | 'package' | 'infocard';
    }) => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      if (!webhookUrl) {
        throw new Error(
          'VITE_N8N_WEBHOOK_URL chưa được cấu hình. Vui lòng kiểm tra file .env.local.'
        );
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          kiotviet_id: kiotvietId,
          role: role,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          text || 'Không thể regenerate images. Vui lòng thử lại hoặc kiểm tra log trong n8n.'
        );
      }

      return await response.json();
    },
    onSuccess: () => {
      // Invalidate queries để refresh images
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      queryClient.invalidateQueries({ queryKey: ['product-show'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

/**
 * Hook để upload product image lên Cloudinary với context
 * Upload lên Cloudinary với context.custom chứa product_id và role
 * Cloudinary sẽ tự động gọi webhook n8n để xử lý
 *
 * @param kiotvietId - kv_products.kiotviet_id
 * @param role - Role prefix: 'closeup' | 'package'
 */
export const useUploadProductImage = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  return useMutation({
    mutationFn: async ({
      file,
      kiotvietId,
      role,
    }: {
      file: File;
      kiotvietId: number;
      role: 'closeup' | 'package';
    }) => {
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Import validateImageFile và uploadImageToCloudinary
      const {
        validateImageFile,
        uploadImageToCloudinary,
      } = await import('@/lib/cloudinary');

      // Validate file
      validateImageFile(file);

      // Upload lên Cloudinary với context.custom
      // Context sẽ được Cloudinary gửi đến webhook n8n
      const result = await uploadImageToCloudinary({
        file,
        kiotvietId: kiotvietId.toString(),
        useSignedUpload: true,
        useCloudflareFunction: false, // Dùng client-side signature (DEV)
        context: {
          product_id: kiotvietId,
          role: role, // 'closeup' hoặc 'package'
        },
      });

      // Sau khi upload thành công, Cloudinary sẽ tự động gọi webhook
      // Không cần gọi thêm API nào nữa
      return result;
    },
    onSuccess: () => {
      // Invalidate queries sau một chút để đợi n8n xử lý xong
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['product-images'] });
        queryClient.invalidateQueries({ queryKey: ['product-show'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });
      }, 2000); // Đợi 2 giây để n8n xử lý xong
    },
  });
};
