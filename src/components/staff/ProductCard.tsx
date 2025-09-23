"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Heart, MoreHorizontal, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from "@/lib/supabase";

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
  onCustom?: () => void;
}

export function ProductCard({
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
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState<string>("1");
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(favorite));

  // Sync internal state when parent prop changes (e.g., after refilter or reload)
  useEffect(() => {
    setIsFavorite(Boolean(favorite));
  }, [favorite]);

  const webhookBase = process.env.NEXT_PUBLIC_WEBHOOK_URL ?? "";
  const buildUrl = (qty: number | string) => {
    const q = String(qty).trim();
    const safeCode = encodeURIComponent(code ?? "");
    return `${webhookBase}/print?printType=label-product&code=${safeCode}&quantity=${encodeURIComponent(
      q
    )}`;
  };

  const openWindow = (qty: number | string) => {
    if (!code || !webhookBase) return;
    const url = buildUrl(qty);
    window.open(url, "_blank");
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
        <Button className="w-full" onClick={() => openWindow(10)}>
          <Printer className="mr-2 h-4 w-4" /> In 10kg
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => openWindow(5)}
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nhập số lượng (kg)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Ví dụ: 1, 2, 2.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                type="text"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setQuantity("1")}>
                  1kg
                </Button>
                <Button variant="outline" onClick={() => setQuantity("2")}>
                  2kg
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  openWindow(quantity);
                  setOpen(false);
                }}
              >
                In
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
