/**
 * ProductCategoryFilter Component
 * Filters products by category with search functionality
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  // DropdownMenuLabel,
  // DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
// import { Input } from '@/components/ui/input';
import { supabaseClient } from '@/utility';
import { ProductCategoryFilterProps, CategoryOption } from '@/types';
import { AlertCircle, ChevronDown } from 'lucide-react';

/**
 * Interface for category data from Supabase
 * @interface CategoryData
 * @property {number} category_id - Category ID
 * @property {string} category_name - Category name
 * @property {number} rank - Category rank/order
 */
interface CategoryData {
  category_id: number;
  category_name: string;
  rank: number;
}

/**
 * Error types for category loading
 */
type CategoryError = {
  type: 'network' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
};

export const ProductCategoryFilter = ({
  value,
  onChange,
  placeholder = 'Chọn danh mục',
  // allowClear is not used in current implementation but kept for API compatibility
  // allowClear: _allowClear = true,
  className = '',
  disabled = false,
  variant = 'outline',
  size = 'md',
}: ProductCategoryFilterProps) => {
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<CategoryError | null>(null);
  // const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Convert single value to array for checkbox support
  const selectedValues = useMemo(() => {
    return value ? [value] : [];
  }, [value]);

  // Fetch categories from Supabase
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        .from('kv_product_categories')
        .select('category_id, category_name, rank')
        .eq('glt_is_active', true)
        .order('rank', { ascending: true });

      if (fetchError) {
        throw {
          type: 'network' as const,
          message: fetchError.message || 'Lỗi kết nối đến máy chủ',
          retryable: true,
        };
      }

      if (!data || data.length === 0) {
        setOptions([]);
        setError({
          type: 'validation',
          message: 'Không có danh mục nào',
          retryable: false,
        });
        return;
      }

      const mappedOptions: CategoryOption[] = (
        (data as CategoryData[]) || []
      ).map((c: CategoryData) => ({
        id: c.category_id.toString(),
        name: c.category_name,
        rank: c.rank,
      }));

      setOptions(mappedOptions);
    } catch (err) {
      console.error('Failed to load categories:', err);
      const errorObj = err as CategoryError;
      setError(
        errorObj || {
          type: 'unknown',
          message: 'Không thể tải danh mục',
          retryable: true,
        }
      );
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Debounce search term for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm('');
    }, 300);

    return () => clearTimeout(timer);
  }, []); // Remove searchTerm dependency

  // Filter options based on debounced search term (memoized for performance)
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm) return options;
    return options.filter(
      option =>
        option.name
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        option.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [options, debouncedSearchTerm]);

  // Get selected option label
  const selectedLabel = useMemo(() => {
    if (!value) return placeholder;
    const selected = options.find(opt => opt.id === value);
    return selected?.name || placeholder;
  }, [value, options, placeholder]);

  // Size classes - đồng nhất với ProductFavoriteFilter (size="lg" = h-10)
  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base',
  };

  // Variant classes
  // const variantClasses = {
  //   default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  //   outline: 'border border-input bg-background hover:bg-accent',
  //   ghost: 'hover:bg-accent hover:text-accent-foreground',
  // };

  if (loading) {
    return <Skeleton className={`${sizeClasses[size]} w-32 ${className}`} />;
  }

  if (error) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error.message}</span>
        </div>
        {error.retryable && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setRetryCount(prev => prev + 1);
              fetchCategories();
            }}
            className="h-auto p-0"
          >
            Thử lại {retryCount > 0 && `(${retryCount})`}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            disabled={disabled || options.length === 0}
            className={`${sizeClasses[size]} w-32 justify-between bg-background hover:bg-accent hover:text-accent-foreground border-border`}
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-64" align="start">
          <div className="max-h-[200px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? 'Không tìm thấy danh mục'
                  : 'Không có danh mục nào'}
              </div>
            ) : (
              filteredOptions.map(option => (
                <DropdownMenuCheckboxItem
                  key={option.id}
                  checked={selectedValues.includes(option.id)}
                  onCheckedChange={checked => {
                    if (checked) {
                      onChange?.(option.id);
                    } else {
                      onChange?.(null);
                    }
                  }}
                >
                  {option.name || 'Không có tên'}
                </DropdownMenuCheckboxItem>
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProductCategoryFilter;
