"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useState } from "react";
import { createClientComponentClient } from "@/lib/supabase";

export interface ProductCategoryItem {
  key: string;
  label: string;
  count: number;
}

interface ProductFilterProps {
  selectedKey: string;
  onSelect: (key: string) => void;
}

export function ProductFilter({ selectedKey, onSelect }: ProductFilterProps) {
  // Always fetch from DB
  const [dbCategories, setDbCategories] = useState<ProductCategoryItem[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClientComponentClient();
      const [{ data }, favResp] = await Promise.all([
        supabase
          .from("v_products")
          .select("category_name, category_rank")
          .order("category_rank", { ascending: true }),
        supabase
          .from("v_products")
          .select("glt_labelprint_favorite", { count: "exact", head: true })
          .eq("glt_labelprint_favorite", true),
      ]);

      const orderMap = new Map<string, number>();
      const countMap = new Map<string, number>();
      (data || []).forEach((row: any) => {
        const name = row.category_name as string;
        if (!name) return;
        if (!orderMap.has(name))
          orderMap.set(name, Number(row.category_rank ?? 9999));
        countMap.set(name, (countMap.get(name) || 0) + 1);
      });

      const uniqueNames = Array.from(orderMap.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([name]) => name);

      const mapped: ProductCategoryItem[] = uniqueNames.map((name) => ({
        key: name,
        label: name,
        count: countMap.get(name) || 0,
      }));

      const favorite: ProductCategoryItem = {
        key: "__favorite",
        label: "Yêu thích",
        count: (favResp as any)?.count ?? 0,
      };
      setDbCategories([
        favorite,
        { key: "all", label: "Tất cả", count: (data || []).length },
        ...mapped,
      ]);
    };
    void fetchCategories();
  }, []);

  // Refresh favorite count when heart toggled
  useEffect(() => {
    const handler = () => {
      // re-fetch on event
      (async () => {
        const supabase = createClientComponentClient();
        const { count } = await supabase
          .from("v_products")
          .select("glt_labelprint_favorite", { count: "exact", head: true })
          .eq("glt_labelprint_favorite", true);
        setDbCategories((prev) =>
          prev.map((c) =>
            c.key === "__favorite" ? { ...c, count: count || 0 } : c
          )
        );
      })();
    };
    window.addEventListener("favorite-changed", handler as EventListener);
    return () =>
      window.removeEventListener("favorite-changed", handler as EventListener);
  }, []);

  const items: ProductCategoryItem[] = useMemo(
    () => dbCategories,
    [dbCategories]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) => (
        <button
          key={c.key}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm",
            selectedKey === c.key
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card"
          )}
          onClick={() => onSelect(c.key)}
        >
          <span>{c.label}</span>
          <Badge
            variant={selectedKey === c.key ? "secondary" : "outline"}
            className="rounded-full"
          >
            {c.count}
          </Badge>
        </button>
      ))}
    </div>
  );
}
