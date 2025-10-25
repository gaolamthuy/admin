import { useCallback, useState } from 'react';

type ViewMode = 'list' | 'card';

interface UseProductViewReturn {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleView: () => void;
}

const DEFAULT_VIEW_MODE: ViewMode = 'card';

/**
 * useProductView Hook
 * Quản lý view mode (list/card) - mặc định là card view
 * Không lưu vào localStorage, mỗi lần vào trang sẽ reset về card view
 */
export const useProductView = (): UseProductViewReturn => {
  const [viewMode, setViewModeState] = useState<ViewMode>(DEFAULT_VIEW_MODE);

  // Set view mode (không lưu vào localStorage)
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
  }, []);

  // Toggle giữa list và card view
  const toggleView = useCallback(() => {
    setViewMode(viewMode === 'list' ? 'card' : 'list');
  }, [viewMode, setViewMode]);

  return {
    viewMode,
    setViewMode,
    toggleView,
  };
};

export default useProductView;
