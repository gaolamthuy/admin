"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Package, Printer } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import { TemplateEngine } from "@/lib/template-engine";

dayjs.extend(relativeTime);
dayjs.locale("vi");

interface PurchaseOrderDetail {
  id: number;
  product_name: string;
  quantity: number;
  price?: number;
  previous_purchase_info?: {
    prev_purchase_date: string;
    prev_price?: number;
    prev_quantity?: number;
  };
}

interface PurchaseOrderSummary {
  id: number;
  code?: string;
  supplier_name: string;
  purchase_date: string;
  overall_status: string;
  details: PurchaseOrderDetail[];
}

interface Props {
  purchaseOrder: PurchaseOrderSummary;
}

export const PurchaseOrderCard: React.FC<Props> = ({ purchaseOrder }) => {
  const fromNow = dayjs(purchaseOrder.purchase_date).fromNow();

  /**
   * Xử lý in đơn hàng sử dụng template từ database
   */
  const handlePrint = async () => {
    try {
      // Chuẩn bị data cho template
      const templateData = {
        company_name: "Gạo Lâm Thúy",
        purchase_order: {
          ...purchaseOrder,
          purchase_date: dayjs(purchaseOrder.purchase_date).format(
            "DD/MM/YYYY HH:mm"
          ),
          total: purchaseOrder.details.reduce(
            (sum, detail) => sum + (detail.price || 0),
            0
          ),
          details: purchaseOrder.details.map((detail) => ({
            ...detail,
            previous_purchase_info: detail.previous_purchase_info
              ? {
                  ...detail.previous_purchase_info,
                  prev_purchase_date: dayjs(
                    detail.previous_purchase_info.prev_purchase_date
                  ).format("DD/MM/YYYY"),
                }
              : undefined,
          })),
        },
      };

      // Sử dụng TemplateEngine để in
      await TemplateEngine.printTemplate("purchase_order", templateData);
    } catch (error) {
      console.error("Error printing purchase order:", error);
      alert("Lỗi khi in đơn hàng. Vui lòng thử lại.");
    }
  };

  /**
   * Xử lý in chi tiết đơn hàng riêng lẻ
   * @param detail - Chi tiết đơn hàng cần in
   */
  const handlePrintDetail = async (detail: PurchaseOrderDetail) => {
    try {
      // Chuẩn bị data cho template chỉ với detail được chọn
      const templateData = {
        company_name: "Gạo Lâm Thúy",
        purchase_order: {
          ...purchaseOrder,
          purchase_date: dayjs(purchaseOrder.purchase_date).format(
            "DD/MM/YYYY HH:mm"
          ),
          total: detail.price || 0,
          details: [
            {
              ...detail,
              previous_purchase_info: detail.previous_purchase_info
                ? {
                    ...detail.previous_purchase_info,
                    prev_purchase_date: dayjs(
                      detail.previous_purchase_info.prev_purchase_date
                    ).format("DD/MM/YYYY"),
                  }
                : undefined,
            },
          ],
        },
      };

      // Sử dụng TemplateEngine để in detail riêng lẻ (sử dụng template purchase_order có sẵn)
      await TemplateEngine.printTemplate("purchase_order", templateData);
    } catch (error) {
      console.error("Error printing purchase order detail:", error);
      alert("Lỗi khi in chi tiết đơn hàng. Vui lòng thử lại.");
    }
  };

  return (
    <Card className="h-full hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-900/20 transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {purchaseOrder.supplier_name}
          </CardTitle>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {dayjs(purchaseOrder.purchase_date).format(
              "DD/MM/YYYY HH:mm"
            )} · {fromNow}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex flex-col h-full">
        <div className="text-sm text-muted-foreground">Sản phẩm</div>
        <ul className="space-y-1 max-h-64 overflow-y-auto">
          {purchaseOrder.details.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md p-2 transition-colors"
              onClick={() => handlePrintDetail(d)}
              title="Click để in chi tiết sản phẩm này"
            >
              <span className="truncate flex-1">{d.product_name}</span>
              <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                <Package className="h-4 w-4" /> x
                {Number(d.quantity).toLocaleString("vi-VN")}
              </span>
            </li>
          ))}
        </ul>

        {/* spacer to push actions to bottom */}
        <div className="mt-2 flex-1" />

        {/* Actions */}
        <div className="mt-auto">
          <Button className="w-full h-9 justify-center" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
