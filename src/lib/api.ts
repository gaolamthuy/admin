import { createClientComponentClient } from "./supabase";

// Product types
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
  glt_visible: boolean;
  glt_sort_order: number;
  glt_note: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  kiotviet_id: number;
  code: string;
  name: string;
  contact_number: string;
  address: string;
  groups: string;
  glt_customer_group_name: string;
  glt_is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: number;
  kiotviet_id: number;
  code: string;
  purchase_date: string;
  customer_name: string;
  total: number;
  status: number;
  status_value: string;
  glt_paid: boolean;
  created_at: string;
  updated_at: string;
}

// API functions
export const getProducts = async (): Promise<Product[]> => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("kv_products")
    .select("*")
    .eq("glt_visible", true)
    .order("glt_sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const updateProduct = async (
  id: number,
  updates: Partial<Product>
): Promise<Product> => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("kv_products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getCustomers = async (): Promise<Customer[]> => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("kv_customers")
    .select("*")
    .eq("glt_is_active", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getInvoices = async (): Promise<Invoice[]> => {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from("kv_invoices")
    .select("*")
    .order("purchase_date", { ascending: false })
    .limit(100);

  if (error) throw error;
  return data || [];
};

export const getDashboardStats = async () => {
  const supabase = createClientComponentClient();
  const [productsResult, customersResult, invoicesResult] = await Promise.all([
    supabase
      .from("kv_products")
      .select("id", { count: "exact" })
      .eq("glt_visible", true),
    supabase
      .from("kv_customers")
      .select("id", { count: "exact" })
      .eq("glt_is_active", true),
    supabase.from("kv_invoices").select("id", { count: "exact" }),
  ]);

  return {
    totalProducts: productsResult.count || 0,
    totalCustomers: customersResult.count || 0,
    totalInvoices: invoicesResult.count || 0,
  };
};
