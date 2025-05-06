import { Customer } from "../types";

export const DEFAULT_CUSTOMER: Customer = {
  id: 0,
  kiotviet_id: 0,
  code: "",
  name: "Khách lẻ",
  contact_number: "",
  location_name: "",
  glt_customer_group_name: "khách lẻ",
};

export const DEFAULT_SETTINGS = {
  autoPrint: true,
};

export const TOAST_DURATION = 3000; // 3 seconds

export const SUPABASE_TABLES = {
  CUSTOMERS: "customers",
  PRODUCTS: "products",
  INVOICES: "invoices",
  SETTINGS: "settings",
};
