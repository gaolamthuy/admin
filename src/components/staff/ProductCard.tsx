"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Heart, MoreHorizontal, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { createClientComponentClient } from "@/lib/supabase";
import { TemplateEngine } from "@/lib/template-engine";
import dayjs from "dayjs";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category: string;
  imageUrl?: string;
  code?: string;
  favorite?: boolean;
  onPrint10kg?: () => void;
  onPrint5kg?: () => void;
  onCustom?: (quantity: string) => void;
}

export function ProductCard({
  id,
  name,
  price,
  barcode,
  category,
  imageUrl,
  code,
  favorite,
  onPrint10kg,
  onPrint5kg,
  onCustom,
}: ProductCardProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(favorite));
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState<string>("1");

  // Sync internal state when parent prop changes (e.g., after refilter or reload)
  useEffect(() => {
    setIsFavorite(Boolean(favorite));
  }, [favorite]);

  const handlePrint = async (qty: number | string) => {
    try {
      const qtyStr = String(qty).trim();
      const qtyNum = Number(qtyStr.replace(",", "."));

      const quantityValue = isNaN(qtyNum) ? Number(qtyStr) || qtyStr : qtyNum;
      const numericQty =
        typeof quantityValue === "number"
          ? quantityValue
          : Number(quantityValue) || 0;
      const total = price * numericQty;

      const templateData = {
        // Thông tin công ty hiển thị footer (nếu template có dùng)
        company_name: "Gạo Lâm Thúy",

        // Giữ nguyên object product để template có thể dùng nếu cần
        product: {
          id,
          name,
          price,
          barcode,
          category,
          code,
          imageUrl,
        },

        // Map theo template nêu trong yêu cầu
        full_name: name,
        order_template: "",
        base_price: price,
        unit: "kg",
        quantity: quantityValue,
        total,
        now: dayjs().format("HH:mm:ss DD/MM/YYYY"),
      };

      await TemplateEngine.printTemplate("label-product-retail", templateData);
    } catch (error) {
      console.error("Error printing product label:", error);
      alert("Lỗi khi in tem sản phẩm. Vui lòng thử lại.");
    }
  };

  const handlePrintRetailPriceList = async () => {
    try {
      if (!code) {
        alert("Không tìm thấy mã sản phẩm");
        return;
      }

      // Fetch detailed product data from view_product
      const supabase = createClientComponentClient();
      const { data: productData, error } = await supabase
        .from("view_product")
        .select(
          "full_name, order_template, base_price, child_units, glt_retail_promotion"
        )
        .eq("code", code)
        .single();

      if (error || !productData) {
        alert("Không tìm thấy thông tin sản phẩm");
        return;
      }

      // Get retail price from child_units.base_price_per_masterunit
      let base_price_per_masterunit = price; // fallback to current price
      if (
        productData.child_units &&
        Array.isArray(productData.child_units) &&
        productData.child_units.length > 0
      ) {
        const firstUnit = productData.child_units[0];
        if (firstUnit.base_price_per_masterunit) {
          base_price_per_masterunit = firstUnit.base_price_per_masterunit;
        }
      }

      // Get child_units data for template
      let child_units_base_price = price;
      let unit = "kg";
      if (
        productData.child_units &&
        Array.isArray(productData.child_units) &&
        productData.child_units.length > 0
      ) {
        const firstUnit = productData.child_units[0];
        child_units_base_price = firstUnit.base_price || price;
        unit = firstUnit.unit || "kg";
      }

      const templateData = {
        full_name: productData.full_name || name,
        order_template: productData.order_template || "",
        base_price: productData.base_price || price,
        base_price_per_masterunit: base_price_per_masterunit,
        child_units_base_price: child_units_base_price,
        unit: unit,
        promotion: productData.glt_retail_promotion || "",
        now_timestamp: dayjs().format("HH:mm:ss DD/MM/YYYY"),
      };

      await TemplateEngine.printTemplate("retail-price-list", templateData);
    } catch (error) {
      console.error("Error printing retail price list:", error);
      alert("Lỗi khi in bảng giá bán lẻ. Vui lòng thử lại.");
    }
  };

  const toggleFavorite = async () => {
    if (!code) return;
    const supabase = createClientComponentClient();
    const { error } = await supabase
      .from("kv_products")
      .update({ glt_labelprint_favorite: !isFavorite })
      .eq("code", code);
    if (!error) {
      const next = !isFavorite;
      setIsFavorite(next);
      // Notify listeners (e.g., ProductFilter and Page) to refresh state
      window.dispatchEvent(
        new CustomEvent("favorite-changed", {
          detail: { code, favorite: next },
        })
      );
    }
  };

  // Staff card is print-focused; no admin update controls here
  return (
    <Card className="w-full border overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/3] bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
            className="object-cover"
            priority
          />
        ) : null}
        <div className="absolute top-2 left-2">
          <Badge variant="secondary" className="shrink-0">
            {category}
          </Badge>
        </div>
        <button
          className="absolute top-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/70"
          onClick={toggleFavorite}
          aria-label="Yêu thích"
          title="Yêu thích"
        >
          <Heart
            fill={isFavorite ? "currentColor" : "none"}
            className={isFavorite ? "text-red-500" : "text-muted-foreground"}
          />
        </button>
      </div>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="truncate" title={name}>
            {name}
          </span>
          <div />
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span className="font-medium text-foreground">
            {price.toLocaleString()}đ
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          className="w-full"
          onClick={() => {
            void handlePrint(10);
            if (onPrint10kg) onPrint10kg();
          }}
        >
          <Printer className="mr-2 h-4 w-4" /> In 10kg
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              void handlePrint(5);
              if (onPrint5kg) onPrint5kg();
            }}
            className="flex-[4]"
          >
            In 5kg
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setOpen(true)}
            className="flex-[1]"
            aria-label="Tùy chọn"
            title="Tùy chọn"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="flex flex-col gap-3 min-h-[320px]">
            <DialogHeader>
              <DialogTitle>Tùy chọn in</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="by-qty" className="w-full flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="by-qty">Theo số lượng</TabsTrigger>
                <TabsTrigger value="price-list">Bảng giá</TabsTrigger>
              </TabsList>
              <TabsContent value="by-qty" className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    className="w-24"
                    placeholder="1-50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    type="number"
                    min={1}
                    max={50}
                    step={1}
                  />
                  <Button variant="outline" onClick={() => setQuantity("1")}>
                    1kg
                  </Button>
                  <Button variant="outline" onClick={() => setQuantity("2")}>
                    2kg
                  </Button>
                  <Button variant="outline" onClick={() => setQuantity("5")}>
                    5kg
                  </Button>
                  <Button variant="outline" onClick={() => setQuantity("10")}>
                    10kg
                  </Button>
                </div>
                <DialogFooter className="p-0">
                  <Button
                    onClick={() => {
                      void handlePrint(quantity);
                      if (onCustom) onCustom(quantity);
                      setOpen(false);
                    }}
                  >
                    In tem bán lẻ
                  </Button>
                </DialogFooter>
              </TabsContent>
              <TabsContent value="price-list" className="mt-4">
                <Button
                  className="w-full"
                  variant="default"
                  onClick={handlePrintRetailPriceList}
                >
                  In bảng giá bán lẻ
                </Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
