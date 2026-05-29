/**
 * Product-related types and interfaces
 * Centralized type definitions for product domain
 */

/**
 * Full Product interface representing a product in the system
 * @interface Product
 * @property {number} id - Unique product identifier
 * @property {number} kiotviet_id - KiotViet product ID
 * @property {string} code - Product code
 * @property {string} name - Product name
 * @property {string} full_name - Full product name
 * @property {number} category_id - Category ID
 * @property {string} category_name - Category name
 * @property {number} base_price - Product base price in VND
 * @property {number} weight - Product weight
 * @property {string} unit - Unit of measurement
 * @property {boolean} is_active - Whether product is active
 * @property {boolean} allows_sale - Whether product allows sale
 * @property {number} type - Product type
 * @property {boolean} has_variants - Whether product has variants
 * @property {string} description - Product description
 * @property {string[]} images - Array of product image URLs
 * @property {boolean} glt_visible - Whether product is visible to customers
 * @property {boolean} glt_retail_promotion - Whether product has retail promotion
 * @property {boolean} glt_labelprint_favorite - Whether product is marked as favorite for label printing
 * @property {string} glt_created_at - Creation timestamp
 * @property {string} glt_updated_at - Last update timestamp
 * @property {string} created_date - Creation date
 * @property {string} modified_date - Last modified date
 */
export interface Product {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  full_name: string;
  category_id: number;
  category_name: string;
  base_price: number;
  weight: number;
  unit: string;
  is_active: boolean;
  allows_sale: boolean;
  type: number;
  has_variants: boolean;
  description: string;
  images: string[];
  glt_visible: boolean;
  glt_retail_promotion: boolean;
  glt_labelprint_favorite: boolean;
  glt_created_at: string;
  glt_updated_at: string;
  created_date: string;
  modified_date: string;
  order_template?: string | null;
}

/**
 * Simplified ProductCard interface for card view display
 * @interface ProductCard
 * @property {string} id - Product ID as string
 * @property {number} kiotviet_id - KiotViet product ID
 * @property {string} code - Product code
 * @property {string} name - Product name
 * @property {string} full_name - Full product name
 * @property {string} category_name - Category name
 * @property {number} base_price - Product base price
 * @property {string[]} images - Product images
 * @property {boolean} is_active - Active status
 * @property {boolean} glt_visible - Visibility status
 * @property {boolean} glt_labelprint_favorite - Favorite for label printing
 */
export interface ProductCard {
  id: string;
  kiotviet_id?: number;
  code?: string;
  name: string;
  full_name?: string;
  category_name?: string;
  base_price: number;
  images?: string[];
  is_active?: boolean;
  glt_visible?: boolean;
  glt_labelprint_favorite?: boolean;
  order_template?: string | null;
}

/**
 * KiotViet status check result for cost vs basecost
 * @interface KiotVietCostStatus
 */
export interface KiotVietCostStatus {
  inventory_cost: number | null;
  basecost_price: number | null;
  status: 'matched' | 'mismatched' | 'no_inventory_cost' | 'no_basecost_price';
  difference: number | null;
}

/**
 * KiotViet status object from v_products_admin view
 * @interface KiotVietStatus
 */
export interface KiotVietStatus {
  cost_vs_basecost: KiotVietCostStatus;
}

export interface CostAnalysisChildUnitPrice {
  code: string;
  full_name: string;
  base_price: number;
  conversion_value: number;
  price_per_master_unit: number | null;
}

export interface CostAnalysis {
  cost_diff: number | null;
  cost_diff_dir: 'up' | 'down' | null;
  inventory_cost: number | null;
  latest_po_price: number | null;
  latest_po_extra_cost: number | null;
  glt_extra_cost: number | null;
}

export interface PricingInfo {
  base_price: number;
  glt_baseprice_markup: number;
  glt_baseprice_round_step: number;
  new_baseprice_suggestion: number | null;
  child_unit_prices: CostAnalysisChildUnitPrice[];
}

export interface CalculateFromPoChildUnit {
  kiotviet_id: number;
  code: string;
  full_name: string;
  unit: string;
  conversion_value: number;
  current_baseprice: number;
  new_baseprice: number;
  diff: number;
  diff_per_cv: number;
}

export interface CalculateFromPo {
  current_baseprice: number;
  current_inventory_cost: number | null;
  latest_purchase_order_id: number;
  latest_purchase_date: string;
  latest_purchase_order_code: string;
  latest_supplier_name: string;
  latest_raw_price: number;
  latest_base_cost: number;
  latest_extra_cost_per_unit: number;
  latest_total_cost_per_unit: number;
  product_extra_cost: number;
  new_cost: number;
  new_baseprice: number;
  baseprice_diff: number;
  child_unit_prices: CalculateFromPoChildUnit[];
}

export interface ProductWithPriceDifference extends ProductCard {
  priceDifference?: number | null;
  priceDifferencePercent?: number | null;
  inventoryCost?: number | null;
  latestPriceDifference?: number | null;
  latestPriceDifferencePercent?: number | null;
  latestPurchaseCost?: number | null;
  costDiffFromLatestPo?: number | null;
  kiotviet_status?: KiotVietStatus | null;
  cost_analysis?: CostAnalysis | null;
  pricing_info?: PricingInfo | null;
  calculate_from_po?: CalculateFromPo | null;
  changelog?: Record<string, Array<{
    old: string;
    new: string;
    diff?: number;
    pct?: number;
    dir?: 'up' | 'down';
    src?: string;
    at: string;
  }>> | null;
}

/**
 * Category interface
 * @interface Category
 * @property {string} id - Category ID
 * @property {string | null} name - Category name
 * @property {number} rank - Category rank/order
 */
export interface Category {
  id: string;
  name: string | null;
  rank?: number;
}

/**
 * Category option for select/dropdown
 * @interface CategoryOption
 * @property {string} id - Category ID
 * @property {string | null} name - Category name
 * @property {number} rank - Category rank/order
 */
export interface CategoryOption {
  id: string;
  name: string | null;
  rank?: number;
}

/**
 * ProductCategoryFilter component props
 * @interface ProductCategoryFilterProps
 * @property {string | null} value - Selected category ID
 * @property {(value: string | null) => void} onChange - Callback when category changes
 * @property {string} placeholder - Placeholder text
 * @property {boolean} allowClear - Allow clearing selection
 * @property {string} className - Additional CSS classes
 * @property {boolean} disabled - Disable the filter
 * @property {'default' | 'outline' | 'ghost'} variant - Button variant
 * @property {'sm' | 'md' | 'lg'} size - Button size
 */
export interface ProductCategoryFilterProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  allowClear?: boolean;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}
