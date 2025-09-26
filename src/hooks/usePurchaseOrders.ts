"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

/**
 * Interface định nghĩa cấu trúc dữ liệu Purchase Order Detail
 * Dựa trên JSONB details trong view_purchase_orders mới
 */
export interface PurchaseOrderDetail {
  id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  price: number;
  discount: number;
  glt_note?: string;
  glt_status?: string;
  glt_admin_note?: string;
  base_price?: number;
  description?: string;
  glt_baseprice_markup?: number;
  inventory_cost?: number;
  glt_extra_cost_per_unit: number;
  cost_suggestion: number;
  cost_difference: number;
  baseprice_suggestion: number;
  baseprice_diff?: number;
}

/**
 * Interface định nghĩa cấu trúc dữ liệu Purchase Order Summary
 * Dựa trên view_purchase_orders mới với JSONB details
 */
export interface PurchaseOrder {
  id: number;
  kiotviet_id?: number;
  code?: string;
  description?: string;
  supplier_name: string;
  supplier_code?: string;
  purchase_date: string;
  total?: number;
  total_payment?: number;
  discount?: number;
  discount_ratio?: number;
  ex_return_suppliers?: number;
  ex_return_third_party?: number;
  status?: number;
  created_at: string;
  updated_at: string;
  created_date?: string;
  total_items: number;
  total_quantity: number;
  avg_price: number;
  overall_status: string;
  combined_notes?: string;
  combined_admin_notes?: string;
  details: PurchaseOrderDetail[];
}

/**
 * Hook để fetch dữ liệu purchase orders từ Supabase
 * Tự động fetch 8 purchase orders gần nhất theo purchase_date
 * Sử dụng view_purchase_orders từ database schema
 *
 * @returns Object chứa data, loading state, error state và refetch function
 */
export const usePurchaseOrders = () => {
  const [data, setData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  /**
   * Fetch purchase orders từ Supabase view_purchase_orders
   * Lấy 8 records gần nhất theo purchase_date
   */
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query từ view_purchase_orders với limit 8 và order by purchase_date desc
      const { data: purchaseOrders, error: fetchError } = await supabase
        .from("v_purchase_orders")
        .select("*")
        .neq("supplier_name", "lâm test supplier")
        .order("purchase_date", { ascending: false })
        .limit(8);

      if (fetchError) {
        throw new Error(`Lỗi khi tải dữ liệu: ${fetchError.message}`);
      }

      if (!purchaseOrders) {
        throw new Error("Không có dữ liệu purchase orders");
      }

      // Transform data với nested details từ JSONB
      const transformedData: PurchaseOrder[] = purchaseOrders.map((order) => ({
        id: order.id,
        kiotviet_id: order.kiotviet_id,
        code: order.code,
        description: order.description,
        supplier_name: order.supplier_name,
        supplier_code: order.supplier_code,
        purchase_date: order.purchase_date,
        total: order.total,
        total_payment: order.total_payment,
        discount: order.discount,
        discount_ratio: order.discount_ratio,
        ex_return_suppliers: order.ex_return_suppliers,
        ex_return_third_party: order.ex_return_third_party,
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        created_date: order.created_date,
        total_items: order.total_items,
        total_quantity: order.total_quantity,
        avg_price: order.avg_price,
        overall_status: order.overall_status,
        combined_notes: order.combined_notes,
        combined_admin_notes: order.combined_admin_notes,
        details: order.details || [], // JSONB array của details
      }));

      setData(transformedData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Có lỗi xảy ra khi tải dữ liệu";
      setError(errorMessage);
      console.error("Error fetching purchase orders:", err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refetch data manually
   */
  const refetch = () => {
    fetchPurchaseOrders();
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
