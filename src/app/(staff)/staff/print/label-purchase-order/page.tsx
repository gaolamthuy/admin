"use client";

import { PurchaseOrderCard } from "@/components/staff/PurchaseOrderCard";
import { usePurchaseOrders } from "@/hooks/usePurchaseOrders";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, RefreshCw, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Component hiển thị trang Print Label Purchase Order
 * Hiển thị 8 purchase orders gần nhất trong grid 4 cột
 * Cho phép in nhãn cho từng purchase order
 */
export default function PrintLabelPurchaseOrderPage() {
  const { data: purchaseOrders, loading, error, refetch } = usePurchaseOrders();

  /**
   * Xử lý sự kiện in nhãn cho purchase order cụ thể
   * @param purchaseOrderId - ID của purchase order cần in
   */
  const handlePrint = (purchaseOrderId: number) => {
    // TODO: Implement print functionality
    console.log(`Printing purchase order label for ID: ${purchaseOrderId}`);
  };

  /**
   * Xử lý refresh dữ liệu
   */
  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Print Label Purchase Order</h1>
          <p className="text-muted-foreground">
            In nhãn đơn hàng mua - 8 đơn hàng gần nhất
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Purchase Orders Grid */}
      {!loading && !error && purchaseOrders && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {purchaseOrders.map((purchaseOrder) => (
            <div key={purchaseOrder.id} className="relative group">
              <PurchaseOrderCard purchaseOrder={purchaseOrder} />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && purchaseOrders && purchaseOrders.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Không có dữ liệu</CardTitle>
            <CardDescription>
              Hiện tại không có purchase order nào để hiển thị
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại dữ liệu
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
