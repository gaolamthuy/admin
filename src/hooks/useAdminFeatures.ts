/**
 * Admin Features Management Hook
 * Quản lý tập trung các features chỉ dành cho admin
 * Chia thành 3 nhóm theo vị trí hiển thị trong UI:
 * - Filters: Nằm chung với toggle (phần filters trên cùng)
 * - Stats: Nằm dưới full_name (trong ProductCard, dưới tên sản phẩm)
 * - Buttons: Nằm dưới dãy nút "In 10kg" "In 5kg" "..." (trong ProductCard footer)
 *
 * @module hooks/useAdminFeatures
 */

import { useIsAdmin } from './useAuth';

/**
 * Feature config interface
 */
interface FeatureConfig {
  key: string;
  label: string;
  description: string;
}

/**
 * Admin features configuration
 * Chia thành 3 nhóm theo vị trí hiển thị:
 * - filters: Nằm chung với toggle (phần filters trên cùng)
 * - stats: Nằm dưới full_name (trong ProductCard)
 * - buttons: Nằm dưới dãy nút in (trong ProductCard footer)
 */
export const ADMIN_FEATURES = {
  // Filters - Bộ lọc (nằm chung với toggle, phần filters trên cùng)
  filters: {
    priceDifference: {
      key: 'priceDifference',
      label: 'Lọc chênh lệch giá',
      description:
        'Filter products theo price difference (logic sẽ được implement sau)',
    },
  },

  // Stats - Số liệu hoặc text hiển thị (nằm dưới full_name trong ProductCard)
  stats: {
    priceDifference: {
      key: 'priceDifference',
      label: 'Chênh lệch giá',
      description: 'Hiển thị chênh lệch giá giữa giá nhập và cost',
    },
    latestPriceDifference: {
      key: 'latestPriceDifference',
      label: 'Latest price difference',
      description: 'Hiển thị latest_price_difference từ v_products_admin',
    },
    cost: {
      key: 'cost',
      label: 'Cost',
      description: 'Hiển thị cost từ inventory',
    },
    purchasePrice: {
      key: 'purchasePrice',
      label: 'Giá nhập',
      description: 'Hiển thị giá nhập từ purchase orders',
    },
    inventoryCost: {
      key: 'inventoryCost',
      label: 'Inventory cost',
      description: 'Hiển thị inventory cost data',
    },
    requirePurchaseData: {
      key: 'requirePurchaseData',
      label: 'Yêu cầu purchase data',
      description: 'Chỉ hiển thị products có purchase data',
    },
  },

  // Buttons - Các nút hành động (nằm dưới dãy nút "In 10kg" "In 5kg" "..." trong ProductCard footer)
  buttons: {
    uploadIcon: {
      key: 'uploadIcon',
      label: 'Upload icon',
      description: 'Upload ảnh sản phẩm',
    },
    viewButton: {
      key: 'viewButton',
      label: 'Nút xem',
      description: 'Nút xem chi tiết sản phẩm (dẫn về trang show)',
    },
    editButton: {
      key: 'editButton',
      label: 'Nút chỉnh sửa',
      description: 'Nút xem/chỉnh sửa sản phẩm',
    },
    deleteButton: {
      key: 'deleteButton',
      label: 'Nút xóa',
      description: 'Nút xóa sản phẩm',
    },
  },
} as const;

// Flatten để backward compatibility và dễ sử dụng
// Thứ tự: filters -> stats -> buttons (theo vị trí hiển thị từ trên xuống)
const flattenFeatures = () => {
  const flat: Record<string, FeatureConfig> = {};
  // Filters (trên cùng)
  Object.values(ADMIN_FEATURES.filters).forEach(f => {
    flat[f.key] = f;
  });
  // Stats (giữa)
  Object.values(ADMIN_FEATURES.stats).forEach(f => {
    flat[f.key] = f;
  });
  // Buttons (dưới cùng)
  Object.values(ADMIN_FEATURES.buttons).forEach(f => {
    flat[f.key] = f;
  });
  return flat;
};

export const ADMIN_FEATURES_FLAT = flattenFeatures() as Record<
  AdminFeatureKey,
  FeatureConfig
>;

export type AdminButtonKey = keyof typeof ADMIN_FEATURES.buttons;
export type AdminStatKey = keyof typeof ADMIN_FEATURES.stats;
export type AdminFilterKey = keyof typeof ADMIN_FEATURES.filters;
export type AdminFeatureKey = AdminButtonKey | AdminStatKey | AdminFilterKey;

/**
 * Hook để check và quản lý admin features
 *
 * @returns Object với isAdmin và các feature flags
 *
 * @example
 * ```tsx
 * // Check một feature
 * const { hasFeature, hasButton, hasStat, hasFilter } = useAdminFeatures();
 * if (hasFeature('priceDifference')) {
 *   // Render price difference
 * }
 *
 * // Check buttons
 * if (hasButton('viewButton')) {
 *   // Render view button
 * }
 *
 * // Check stats
 * if (hasStat('latestPriceDifference')) {
 *   // Render latest price difference stat
 * }
 *
 * // Check filters
 * if (hasFilter('priceDifference')) {
 *   // Render price difference filter
 * }
 *
 * // Check nhiều buttons
 * if (hasAnyButton(['uploadIcon', 'viewButton'])) {
 *   // Render nếu có ít nhất 1 button
 * }
 *
 * // Check nhiều stats
 * if (hasAllStats(['priceDifference', 'cost'])) {
 *   // Render nếu có tất cả stats
 * }
 * ```
 */
export const useAdminFeatures = () => {
  const { isAdmin } = useIsAdmin();

  /**
   * Check xem có feature nào không (buttons, stats, hoặc filters)
   */
  const hasFeature = (key: AdminFeatureKey): boolean => {
    if (!isAdmin) return false;
    return key in ADMIN_FEATURES_FLAT;
  };

  /**
   * Check xem có button nào không
   */
  const hasButton = (key: AdminButtonKey): boolean => {
    if (!isAdmin) return false;
    return key in ADMIN_FEATURES.buttons;
  };

  /**
   * Check xem có stat nào không
   */
  const hasStat = (key: AdminStatKey): boolean => {
    if (!isAdmin) return false;
    return key in ADMIN_FEATURES.stats;
  };

  /**
   * Check xem có filter nào không
   */
  const hasFilter = (key: AdminFilterKey): boolean => {
    if (!isAdmin) return false;
    return key in ADMIN_FEATURES.filters;
  };

  /**
   * Check xem có ít nhất 1 feature trong list không
   */
  const hasAnyFeature = (keys: AdminFeatureKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.some(key => key in ADMIN_FEATURES_FLAT);
  };

  /**
   * Check xem có tất cả features trong list không
   */
  const hasAllFeatures = (keys: AdminFeatureKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.every(key => key in ADMIN_FEATURES_FLAT);
  };

  /**
   * Check xem có ít nhất 1 button trong list không
   */
  const hasAnyButton = (keys: AdminButtonKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.some(key => key in ADMIN_FEATURES.buttons);
  };

  /**
   * Check xem có tất cả buttons trong list không
   */
  const hasAllButtons = (keys: AdminButtonKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.every(key => key in ADMIN_FEATURES.buttons);
  };

  /**
   * Check xem có ít nhất 1 stat trong list không
   */
  const hasAnyStat = (keys: AdminStatKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.some(key => key in ADMIN_FEATURES.stats);
  };

  /**
   * Check xem có tất cả stats trong list không
   */
  const hasAllStats = (keys: AdminStatKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.every(key => key in ADMIN_FEATURES.stats);
  };

  /**
   * Check xem có ít nhất 1 filter trong list không
   */
  const hasAnyFilter = (keys: AdminFilterKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.some(key => key in ADMIN_FEATURES.filters);
  };

  /**
   * Check xem có tất cả filters trong list không
   */
  const hasAllFilters = (keys: AdminFilterKey[]): boolean => {
    if (!isAdmin) return false;
    return keys.every(key => key in ADMIN_FEATURES.filters);
  };

  /**
   * Get feature config
   */
  const getFeature = (key: AdminFeatureKey) => {
    return ADMIN_FEATURES_FLAT[key];
  };

  /**
   * Get button config
   */
  const getButton = (key: AdminButtonKey) => {
    return ADMIN_FEATURES.buttons[key];
  };

  /**
   * Get stat config
   */
  const getStat = (key: AdminStatKey) => {
    return ADMIN_FEATURES.stats[key];
  };

  /**
   * Get filter config
   */
  const getFilter = (key: AdminFilterKey) => {
    return ADMIN_FEATURES.filters[key];
  };

  return {
    isAdmin,
    // Generic methods (backward compatible)
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
    getFeature,
    // Button-specific methods
    hasButton,
    hasAnyButton,
    hasAllButtons,
    getButton,
    // Stat-specific methods
    hasStat,
    hasAnyStat,
    hasAllStats,
    getStat,
    // Filter-specific methods
    hasFilter,
    hasAnyFilter,
    hasAllFilters,
    getFilter,
    // Helper để get tất cả enabled features
    enabledFeatures: isAdmin
      ? (Object.keys(ADMIN_FEATURES_FLAT) as AdminFeatureKey[])
      : [],
    enabledButtons: isAdmin
      ? (Object.keys(ADMIN_FEATURES.buttons) as AdminButtonKey[])
      : [],
    enabledStats: isAdmin
      ? (Object.keys(ADMIN_FEATURES.stats) as AdminStatKey[])
      : [],
    enabledFilters: isAdmin
      ? (Object.keys(ADMIN_FEATURES.filters) as AdminFilterKey[])
      : [],
  };
};
