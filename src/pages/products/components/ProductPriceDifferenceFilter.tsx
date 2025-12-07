import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';

/**
 * Props cho ProductPriceDifferenceFilter
 */
interface ProductPriceDifferenceFilterProps {
  /**
   * Trạng thái filter có đang active không
   */
  pressed: boolean;
  /**
   * Callback khi filter thay đổi
   */
  onPressedChange: (pressed: boolean) => void;
  /**
   * Aria label cho accessibility
   */
  'aria-label'?: string;
  /**
   * Size của button
   */
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Component filter để hiển thị sản phẩm có chênh lệch giá lớn nhất
 * Tương tự ProductFavoriteFilter nhưng cho price difference
 */
export const ProductPriceDifferenceFilter: React.FC<
  ProductPriceDifferenceFilterProps
> = ({
  pressed,
  onPressedChange,
  'aria-label': ariaLabel,
  size = 'default',
}) => {
  return (
    <Button
      variant={pressed ? 'default' : 'outline'}
      size={size}
      onClick={() => onPressedChange(!pressed)}
      aria-label={ariaLabel}
      className="gap-2"
    >
      <TrendingUp className="h-4 w-4" />
      <span className="hidden sm:inline">Giá chênh lệch</span>
    </Button>
  );
};
