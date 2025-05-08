export interface Customer {
  search_priority?: number;
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  contact_number: string;
  location_name: string;
  address?: string;
  retailer_id?: number;
  branch_id?: number;
  ward_name?: string;
  modified_date?: string;
  created_date?: string;
  type?: number;
  glt_customer_group_name: string;
  groups?: string;
  debt?: number;
  comments?: string;
}

export interface Product {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  category_name: string;
  unit: string;
  base_price: number;
  cost?: number;
  full_name: string;
  order_template?: string;
  is_active?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  total: number;
}

export interface Settings {
  autoPrint: boolean;
}

export interface Invoice {
  id: number;
  kiotviet_id?: number;
  code: string;
  kiotviet_customer_id: number;
  total: number;
  subtotal: number;
  purchase_date: Date | string;
  status_value: string;
}

export interface InvoiceDetail {
  id?: number;
  kiotviet_invoice_id: number;
  kiotviet_product_id: number;
  product_name: string;
  quantity: number;
  price: number;
  sub_total: number;
}

// Pricebook entries override product prices per customer group
export interface PricebookEntry {
  id: number;
  customer_group_title: string | null;
  product_id: number; // references Product.kiotviet_id
  adjustment_type: string; // e.g. 'fixed', 'percentage'
  adjustment_value: number;
  created_at?: string;
  updated_at?: string;
}
