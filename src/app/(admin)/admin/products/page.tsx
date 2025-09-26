"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ProductFilter,
  ProductCategoryItem,
} from "@/components/staff/ProductFilter";
import { ProductCard } from "@/components/admin/ProductCard";

interface Product {
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

/**
 * Trang quản lý sản phẩm cho admin
 * Hiển thị danh sách sản phẩm với khả năng tìm kiếm và lọc theo danh mục
 * @returns React component quản lý sản phẩm
 */
export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("__favorite");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  /**
   * Lấy danh sách sản phẩm từ Supabase view_product
   * Bao gồm thông tin cơ bản và trạng thái yêu thích
   */
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from("view_product")
          .select(
            "kiotviet_id,code,full_name,base_price,category_name,images,glt_gallery_thumbnail_url,glt_labelprint_favorite,glt_baseprice_markup,glt_retail_promotion"
          )
          .order("base_price", { ascending: true })
          .order("category_name", { ascending: true })
          .limit(500);
        if (error) throw error;

        const mapped: Product[] = (data || []).map((p: any) => ({
          id: String(p.kiotviet_id ?? p.code ?? Math.random()),
          name: p.full_name ?? "",
          price: Number(p.base_price ?? 0),
          barcode: p.code ?? "",
          category: p.category_name ?? "Khác",
          code: p.code ?? undefined,
          favorite:
            p.glt_labelprint_favorite === true ||
            (typeof p.glt_labelprint_favorite === "string" &&
              p.glt_labelprint_favorite.toLowerCase() === "t") ||
            p.glt_labelprint_favorite === 1,
          markup: Number(p.glt_baseprice_markup ?? 0),
          promotion:
            p.glt_retail_promotion === true ||
            (typeof p.glt_retail_promotion === "string" &&
              p.glt_retail_promotion.toLowerCase() === "t") ||
            p.glt_retail_promotion === 1,
          imageUrl:
            Array.isArray(p.images) && p.images.length > 0
              ? String(p.images[0])
              : undefined,
        }));
        setProducts(mapped);
      } catch (e) {
        toast.error("Không tải được danh sách sản phẩm");
        // eslint-disable-next-line no-console
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    void fetchProducts();
  }, []);

  /**
   * Tạo danh sách danh mục từ sản phẩm hiện có
   * Bao gồm tất cả sản phẩm và các danh mục riêng biệt
   */
  const categories = useMemo<ProductCategoryItem[]>(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const key = p.category || "Khác";
      map.set(key, (map.get(key) || 0) + 1);
    });
    const items: ProductCategoryItem[] = [
      { key: "all", label: "Tất cả", count: products.length },
      ...Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, count]) => ({ key, label: key, count })),
    ];
    return items;
  }, [products]);

  /**
   * Lọc sản phẩm theo từ khóa tìm kiếm và danh mục được chọn
   * Hỗ trợ tìm kiếm theo tên sản phẩm
   */
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        term.length === 0 || product.name.toLowerCase().includes(term);
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "__favorite" && product.favorite) ||
        product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  /**
   * Lắng nghe sự kiện thay đổi trạng thái yêu thích
   * Cập nhật danh sách sản phẩm ngay lập tức
   */
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { code?: string; favorite?: boolean }
        | undefined;
      if (!detail?.code) return;
      setProducts((prev) =>
        prev.map((p) =>
          p.code === detail.code
            ? { ...p, favorite: Boolean(detail.favorite) }
            : p
        )
      );
    };
    window.addEventListener("favorite-changed", handler as EventListener);
    return () =>
      window.removeEventListener("favorite-changed", handler as EventListener);
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
        <p className="text-muted-foreground">
          Quản lý và in tem nhãn cho sản phẩm
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Selection */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Danh sách sản phẩm
              </CardTitle>
              <CardDescription>
                Tìm kiếm và quản lý sản phẩm trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter */}
              <div className="flex gap-4">
                <div className="w-full">
                  <ProductFilter
                    selectedKey={selectedCategory}
                    onSelect={setSelectedCategory}
                  />
                </div>
              </div>

              {/* Product List */}
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Đang tải sản phẩm...
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Không có sản phẩm phù hợp
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      barcode={product.barcode}
                      category={product.category}
                      imageUrl={product.imageUrl}
                      code={product.code}
                      favorite={product.favorite}
                      markup={product.markup}
                      promotion={product.promotion}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
