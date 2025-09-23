"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Printer, Package, DollarSign, Hash, Plus, Minus } from "lucide-react";
import { createClientComponentClient } from "@/lib/supabase";
import { toast } from "sonner";
import {
  ProductFilter,
  ProductCategoryItem,
} from "@/components/staff/ProductFilter";
import { ProductCard } from "@/components/staff/ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  barcode: string;
  category: string;
  imageUrl?: string;
  code?: string;
  favorite?: boolean;
}

export default function PrintLabelRetailPage() {
  const [selectedProducts, setSelectedProducts] = useState<{
    [key: string]: number;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("__favorite");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch products from Supabase kv_products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const supabase = createClientComponentClient();
        const { data, error } = await supabase
          .from("view_product")
          .select(
            "kiotviet_id,code,full_name,base_price,category_name,images,glt_gallery_thumbnail_url,glt_labelprint_favorite"
          )
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

  // Reflect favorite toggles immediately in current list (so favorite filter updates without reload)
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

  const handleQuantityChange = (productId: string, change: number) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + change),
    }));
  };

  const handlePrint = () => {
    const productsToPrint = Object.entries(selectedProducts)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        return { ...product, quantity };
      });

    if (productsToPrint.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm để in");
      return;
    }

    // TODO: Implement actual print functionality
    console.log("Printing products:", productsToPrint);
    alert(`Đang in ${productsToPrint.length} loại sản phẩm...`);
  };

  const totalSelected = Object.values(selectedProducts).reduce(
    (sum, qty) => sum + qty,
    0
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">In tem nhãn bán lẻ</h1>
        <p className="text-muted-foreground">
          Chọn sản phẩm và số lượng để in tem
        </p>
      </div>

      <div className="space-y-6">
        {/* Product Selection */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Chọn sản phẩm
              </CardTitle>
              <CardDescription>
                Tìm kiếm và chọn sản phẩm cần in tem
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category Filter only */}
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
                      onPrint10kg={() => handleQuantityChange(product.id, 1)}
                      onPrint5kg={() => handleQuantityChange(product.id, 1)}
                      onCustom={() => handleQuantityChange(product.id, 1)}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Full-width grid above; no right panel */}
      </div>
    </div>
  );
}
