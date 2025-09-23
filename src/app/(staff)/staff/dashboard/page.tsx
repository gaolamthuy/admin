"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, FileText } from "lucide-react";

export default function StaffDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Chọn chức năng in tem nhãn</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {/* Ưu tiên: In tem nhãn bán lẻ */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-primary" />
              In tem nhãn bán lẻ
            </CardTitle>
            <CardDescription>
              In nhãn sản phẩm cho bán lẻ với thông tin giá, mã vạch
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <Button
              onClick={() => router.push("/staff/print/label-retail")}
              className="w-full bg-primary hover:bg-primary/90 mt-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              In nhãn bán lẻ
            </Button>
          </CardContent>
        </Card>

        {/* Thứ hai: In tem nhãn nhập hàng */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-muted-foreground" />
              In tem nhãn nhập hàng
            </CardTitle>
            <CardDescription>
              In nhãn đơn hàng mua (trống) cho quá trình nhập kho
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col h-full">
            <Button
              onClick={() => router.push("/staff/print/label-purchase-order")}
              className="w-full mt-auto"
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              In nhãn nhập hàng
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
