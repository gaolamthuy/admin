import { useCallback, useState } from 'react';

type ViewMode = 'list' | 'card';

interface UsePurchaseOrderViewReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleView: () => void;
}

const DEFAULT_VIEW_MODE: ViewMode = 'list';

/**
 * usePurchaseOrderView Hook
 * Quản lý view mode (list/card) - mặc định là list view
 * Không lưu vào localStorage, mỗi lần vào trang sẽ reset về list view
 */
export const usePurchaseOrderView = (): UsePurchaseOrderViewReturn => {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW_MODE);

  /**
   * Set view mode (không lưu vào localStorage)
   * @param mode - View mode ('list' | 'card')
   */
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  /**
   * Toggle giữa list và card view
   */
  const toggleView = useCallback(() => {
    setViewMode(viewMode === 'list' ? 'card' : 'list');
  }, [viewMode, setViewMode]);

  return {
    viewMode,
    setViewMode,
    toggleView,
  };
};

export default usePurchaseOrderView;
