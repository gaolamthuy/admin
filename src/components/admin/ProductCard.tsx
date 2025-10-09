"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Heart, Upload } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "../ui/switch";
import { Spinner } from "../ui/spinner";
import { createClientComponentClient } from "@/lib/supabase";
import {
  updateProductMarkup,
  updateProductPromotion,
  uploadProductImage,
} from "@/lib/api";
import { toast } from "sonner";

export interface AdminProductCardProps {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category: string;
  imageUrl?: string;
  code?: string;
  favorite?: boolean;
  markup?: number;
  promotion?: boolean;
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
  markup = 0,
  promotion = false,
}: AdminProductCardProps) {
  const [isFavorite, setIsFavorite] = useState<boolean>(Boolean(favorite));
  const [markupValue, setMarkupValue] = useState<string>(String(markup));
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [isPromotion, setIsPromotion] = useState<boolean>(Boolean(promotion));
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsFavorite(Boolean(favorite));
  }, [favorite]);

  useEffect(() => {
    setMarkupValue(String(markup));
  }, [markup]);

  useEffect(() => {
    setIsPromotion(Boolean(promotion));
  }, [promotion]);

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
      window.dispatchEvent(
        new CustomEvent("favorite-changed", {
          detail: { code, favorite: next },
        })
      );
    }
  };

  const handleMarkupChange = async (value: string) => {
    if (!code) return;
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue) || numericValue < 0 || numericValue > 10000) {
      toast.error("Giá trị markup phải từ 0 đến 10,000");
      setMarkupValue(String(markup));
      return;
    }

    setIsUpdating(true);
    try {
      await updateProductMarkup(code, numericValue);
      setMarkupValue(value);
      toast.success("Đã cập nhật markup thành công");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating markup:", error);
      toast.error("Lỗi khi cập nhật markup");
      setMarkupValue(String(markup));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMarkupValue(value);
  };

  const handleInputBlur = () => {
    if (markupValue !== String(markup)) {
      void handleMarkupChange(markupValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleMarkupChange(markupValue);
    }
  };

  const handlePromotionToggle = async () => {
    if (!code) return;
    const next = !isPromotion;
    setIsUpdating(true);
    try {
      await updateProductPromotion(code, next);
      setIsPromotion(next);
      toast.success(next ? "Đã bật khuyến mãi" : "Đã tắt khuyến mãi");
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating promotion:", error);
      toast.error("Lỗi khi cập nhật khuyến mãi");
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Xử lý upload ảnh sản phẩm
   * Gửi file lên webhook để xử lý và cập nhật ảnh sản phẩm
   */
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    // Kiểm tra loại file
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Kiểm tra kích thước file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Kích thước file không được vượt quá 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadProductImage(file, id);
      toast.success("Ảnh đang được xử lý...");
      // eslint-disable-next-line no-console
      console.log("Upload result:", result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error uploading image:", error);
      toast.error("Lỗi khi upload ảnh");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  /**
   * Mở dialog chọn file ảnh
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
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
        <button
          className="absolute top-2 right-12 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/70"
          onClick={handleUploadClick}
          disabled={isUploading}
          aria-label="Upload ảnh"
          title="Upload ảnh"
        >
          {isUploading ? (
            <Spinner size="small" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
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
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={`markup-${code}`} className="text-sm font-medium">
            Baseprice Markup
          </Label>
          <Input
            id={`markup-${code}`}
            type="number"
            min="0"
            max="10000"
            value={markupValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            placeholder="0"
            disabled={isUpdating}
            className="w-full"
          />
          {/* Spinner moved to promotion row */}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`promotion-${code}`} className="text-sm">
            Khuyến mãi bán lẻ
          </Label>
          <div className="flex items-center gap-2">
            {isUpdating && <Spinner size="small" />}
            <Switch
              id={`promotion-${code}`}
              checked={isPromotion}
              onCheckedChange={() => void handlePromotionToggle()}
              disabled={isUpdating}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
