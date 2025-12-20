/**
 * AdminFeature Component
 * Conditional render dựa trên feature flags
 * Hỗ trợ cả buttons và stats
 *
 * @module components/admin/AdminFeature
 */

import {
  useAdminFeatures,
  type AdminFeatureKey,
  type AdminButtonKey,
  type AdminStatKey,
  type AdminFilterKey,
} from '@/hooks/useAdminFeatures';
import type { PropsWithChildren } from 'react';

interface AdminFeatureProps extends PropsWithChildren {
  /**
   * Feature key cần check (buttons, stats, hoặc filters)
   */
  feature?: AdminFeatureKey;
  /**
   * Button key cần check (chỉ buttons)
   */
  button?: AdminButtonKey;
  /**
   * Stat key cần check (chỉ stats)
   */
  stat?: AdminStatKey;
  /**
   * Filter key cần check (chỉ filters)
   */
  filter?: AdminFilterKey;
  /**
   * Fallback component để render khi không có feature
   */
  fallback?: React.ReactNode;
  /**
   * Nếu true, sẽ check nhiều features (OR logic)
   */
  any?: AdminFeatureKey[];
  /**
   * Nếu true, sẽ check nhiều features (AND logic)
   */
  all?: AdminFeatureKey[];
  /**
   * Nếu true, sẽ check nhiều buttons (OR logic)
   */
  anyButton?: AdminButtonKey[];
  /**
   * Nếu true, sẽ check nhiều buttons (AND logic)
   */
  allButtons?: AdminButtonKey[];
  /**
   * Nếu true, sẽ check nhiều stats (OR logic)
   */
  anyStat?: AdminStatKey[];
  /**
   * Nếu true, sẽ check nhiều stats (AND logic)
   */
  allStats?: AdminStatKey[];
  /**
   * Nếu true, sẽ check nhiều filters (OR logic)
   */
  anyFilter?: AdminFilterKey[];
  /**
   * Nếu true, sẽ check nhiều filters (AND logic)
   */
  allFilters?: AdminFilterKey[];
}

/**
 * AdminFeature Component
 * Chỉ render children nếu admin có feature đó
 *
 * @example
 * ```tsx
 * // Single feature (backward compatible)
 * <AdminFeature feature="priceDifference">
 *   <PriceDifferenceBadge />
 * </AdminFeature>
 *
 * // Button-specific
 * <AdminFeature button="uploadIcon">
 *   <UploadButton />
 * </AdminFeature>
 *
 * // Stat-specific
 * <AdminFeature stat="priceDifference">
 *   <PriceDifferenceBadge />
 * </AdminFeature>
 *
 * // Filter-specific
 * <AdminFeature filter="priceDifference">
 *   <PriceDifferenceFilter />
 * </AdminFeature>
 *
 * // Multiple buttons (OR)
 * <AdminFeature anyButton={['uploadIcon', 'viewButton']}>
 *   <ActionButtons />
 * </AdminFeature>
 *
 * // Multiple stats (AND)
 * <AdminFeature allStats={['priceDifference', 'cost']}>
 *   <FullPriceInfo />
 * </AdminFeature>
 *
 * // Multiple filters (OR)
 * <AdminFeature anyFilter={['priceDifference']}>
 *   <FilterSection />
 * </AdminFeature>
 * ```
 */
export const AdminFeature: React.FC<AdminFeatureProps> = ({
  children,
  feature,
  button,
  stat,
  filter,
  fallback = null,
  any,
  all,
  anyButton,
  allButtons,
  anyStat,
  allStats,
  anyFilter,
  allFilters,
}) => {
  const {
    hasFeature,
    hasButton,
    hasStat,
    hasFilter,
    hasAnyFeature,
    hasAllFeatures,
    hasAnyButton,
    hasAllButtons,
    hasAnyStat,
    hasAllStats,
    hasAnyFilter,
    hasAllFilters,
  } = useAdminFeatures();

  let shouldRender = false;

  // Priority: specific (button/stat/filter) > generic (feature) > multiple checks
  if (button) {
    shouldRender = hasButton(button);
  } else if (stat) {
    shouldRender = hasStat(stat);
  } else if (filter) {
    shouldRender = hasFilter(filter);
  } else if (feature) {
    shouldRender = hasFeature(feature);
  } else if (anyButton) {
    shouldRender = hasAnyButton(anyButton);
  } else if (allButtons) {
    shouldRender = hasAllButtons(allButtons);
  } else if (anyStat) {
    shouldRender = hasAnyStat(anyStat);
  } else if (allStats) {
    shouldRender = hasAllStats(allStats);
  } else if (anyFilter) {
    shouldRender = hasAnyFilter(anyFilter);
  } else if (allFilters) {
    shouldRender = hasAllFilters(allFilters);
  } else if (any) {
    shouldRender = hasAnyFeature(any);
  } else if (all) {
    shouldRender = hasAllFeatures(all);
  }

  if (!shouldRender) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * AdminButtons Component
 * Wrapper cho tất cả buttons - chỉ render nếu admin
 */
export const AdminButtons: React.FC<PropsWithChildren> = ({ children }) => {
  const { isAdmin } = useAdminFeatures();
  if (!isAdmin) return null;
  return <>{children}</>;
};

/**
 * AdminStats Component
 * Wrapper cho tất cả stats - chỉ render nếu admin
 */
export const AdminStats: React.FC<PropsWithChildren> = ({ children }) => {
  const { isAdmin } = useAdminFeatures();
  if (!isAdmin) return null;
  return <>{children}</>;
};

/**
 * AdminFilters Component
 * Wrapper cho tất cả filters - chỉ render nếu admin
 */
export const AdminFilters: React.FC<PropsWithChildren> = ({ children }) => {
  const { isAdmin } = useAdminFeatures();
  if (!isAdmin) return null;
  return <>{children}</>;
};
