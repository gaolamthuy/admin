/**
 * useProductFilters Hook
 * Quản lý filters cho product list với type safety
 */

import { useState, useMemo, useCallback } from 'react';
import { ProductFilter, ProductTableFilters } from '../types/product-list';

/**
 * Hook quản lý filters cho product list
 * @returns Object chứa filter state và functions
 */
export const useProductFilters = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(true); // Auto active favorite filter
  const [isActive, setIsActive] = useState<boolean>(true);

  /**
   * Tạo base filters cho table
   * @returns Array of ProductFilter
   */
  const baseFilters = useMemo(
    (): ProductFilter[] => [
      {
        field: 'is_active',
        operator: 'eq',
        value: true,
      },
      {
        field: 'master_unit_id',
        operator: 'null',
        value: true,
      },
      {
        field: 'kv_product_categories.glt_is_active',
        operator: 'eq',
        value: true,
      },
    ],
    []
  );

  /**
   * Tạo dynamic filters dựa trên state
   * @returns Array of ProductFilter
   */
  const dynamicFilters = useMemo((): ProductFilter[] => {
    const filters: ProductFilter[] = [];

    // Add favorite filter if enabled
    if (isFavorite) {
      filters.push({
        field: 'glt_labelprint_favorite',
        operator: 'eq',
        value: true,
      });
    }

    // Add category filter if selected
    if (selectedCategory) {
      const categoryId = parseInt(selectedCategory, 10);
      if (!isNaN(categoryId)) {
        filters.push({
          field: 'kv_product_categories.category_id',
          operator: 'eq',
          value: categoryId,
        });
      }
    }

    return filters;
  }, [selectedCategory, isFavorite]);

  /**
   * Combine base và dynamic filters
   * @returns Complete filter array
   */
  const allFilters = useMemo(
    (): ProductFilter[] => [...baseFilters, ...dynamicFilters],
    [baseFilters, dynamicFilters]
  );

  /**
   * Reset all filters về default state
   */
  const resetFilters = useCallback(() => {
    setSelectedCategory(null);
    setIsFavorite(true);
    setIsActive(true);
  }, []);

  /**
   * Clear category filter
   */
  const clearCategoryFilter = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  /**
   * Toggle favorite filter
   */
  const toggleFavoriteFilter = useCallback(() => {
    setIsFavorite(prev => !prev);
  }, []);

  /**
   * Get current filter state
   * @returns ProductTableFilters object
   */
  const getFilterState = useCallback(
    (): ProductTableFilters => ({
      selectedCategory,
      isFavorite,
      isActive,
    }),
    [selectedCategory, isFavorite, isActive]
  );

  return {
    // State
    selectedCategory,
    isFavorite,
    isActive,

    // Setters
    setSelectedCategory,
    setIsFavorite,
    setIsActive,

    // Computed
    filters: allFilters,
    baseFilters,
    dynamicFilters,

    // Actions
    resetFilters,
    clearCategoryFilter,
    toggleFavoriteFilter,
    getFilterState,
  };
};
