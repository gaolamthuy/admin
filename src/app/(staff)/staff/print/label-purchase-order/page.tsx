"use client";

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
import { Printer } from "lucide-react";

export default function PrintLabelPurchaseOrderPage() {
  const handlePrint = () => {
    // TODO: Implement print functionality
    console.log("Printing purchase order label...");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Print Label Purchase Order</h1>
        <p className="text-muted-foreground">In nhãn đơn hàng mua (trống)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin đơn hàng mua</CardTitle>
          <CardDescription>
            Nhập thông tin để in nhãn đơn hàng mua
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Nhà cung cấp</Label>
              <Input id="supplier" placeholder="Nhập tên nhà cung cấp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-number">Số đơn hàng</Label>
              <Input id="order-number" placeholder="Nhập số đơn hàng" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Ngày đặt hàng</Label>
              <Input id="date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng</Label>
              <Input id="quantity" placeholder="1" type="number" />
            </div>
          </div>

          <Button onClick={handlePrint} className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            In nhãn đơn hàng mua
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
