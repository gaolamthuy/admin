/**
 * Supabase client configuration
 * Cấu hình client Supabase để kết nối với database
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Supabase client instance
 * Instance chính để tương tác với Supabase
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Tự động refresh token
    autoRefreshToken: true,
    // Persist session trong localStorage
    persistSession: true,
    // Detect session trong URL
    detectSessionInUrl: true,
  },
});

/**
 * Database types interface
 * Định nghĩa types cho database tables
 */
export interface Database {
  public: {
    Tables: {
      glt_users: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "staff";
          created_at: string;
          note?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "admin" | "staff";
          created_at?: string;
          note?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "admin" | "staff";
          created_at?: string;
          note?: string;
        };
      };
      kv_products: {
        Row: {
          id: number;
          kiotviet_id: number;
          code?: string;
          name?: string;
          base_price?: number;
          glt_visible: boolean;
          glt_labelprint_favorite?: boolean;
          glt_created_at?: string;
          glt_updated_at?: string;
        };
        Insert: {
          id?: number;
          kiotviet_id: number;
          code?: string;
          name?: string;
          base_price?: number;
          glt_visible?: boolean;
          glt_labelprint_favorite?: boolean;
          glt_created_at?: string;
          glt_updated_at?: string;
        };
        Update: {
          id?: number;
          kiotviet_id?: number;
          code?: string;
          name?: string;
          base_price?: number;
          glt_visible?: boolean;
          glt_labelprint_favorite?: boolean;
          glt_created_at?: string;
          glt_updated_at?: string;
        };
      };
      kv_customers: {
        Row: {
          id: number;
          kiotviet_id: number;
          code?: string;
          name?: string;
          contact_number?: string;
          address?: string;
          glt_is_active: boolean;
        };
        Insert: {
          id?: number;
          kiotviet_id: number;
          code?: string;
          name?: string;
          contact_number?: string;
          address?: string;
          glt_is_active?: boolean;
        };
        Update: {
          id?: number;
          kiotviet_id?: number;
          code?: string;
          name?: string;
          contact_number?: string;
          address?: string;
          glt_is_active?: boolean;
        };
      };
      kv_invoices: {
        Row: {
          id: number;
          kiotviet_id?: number;
          code?: string;
          customer_name?: string;
          total?: number;
          status?: number;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: number;
          kiotviet_id?: number;
          code?: string;
          customer_name?: string;
          total?: number;
          status?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          kiotviet_id?: number;
          code?: string;
          customer_name?: string;
          total?: number;
          status?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      kv_product_categories: {
        Row: {
          category_id: number;
          parent_id?: number;
          category_name: string;
          retailer_id: number;
          rank: number;
          created_at: string;
          updated_at: string;
          glt_color_border?: string;
          glt_is_active: boolean;
        };
        Insert: {
          category_id?: number;
          parent_id?: number;
          category_name: string;
          retailer_id: number;
          rank?: number;
          created_at?: string;
          updated_at?: string;
          glt_color_border?: string;
          glt_is_active?: boolean;
        };
        Update: {
          category_id?: number;
          parent_id?: number;
          category_name?: string;
          retailer_id?: number;
          rank?: number;
          created_at?: string;
          updated_at?: string;
          glt_color_border?: string;
          glt_is_active?: boolean;
        };
      };
    };
  };
}
