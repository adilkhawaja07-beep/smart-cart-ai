import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/ProductCard";

import categoryFruits from "@/assets/category-fruits.jpg";
import categoryVegetables from "@/assets/category-vegetables.jpg";
import categoryDairy from "@/assets/category-dairy.jpg";
import categoryBakery from "@/assets/category-bakery.jpg";

const categoryFallbackImages: Record<string, string> = {
  "Fresh Fruits": categoryFruits,
  Vegetables: categoryVegetables,
  "Dairy & Eggs": categoryDairy,
  Bakery: categoryBakery,
};

export interface DbProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  unit: string;
  badge: string | null;
  in_stock: boolean;
  description: string | null;
  category_id: string | null;
  cost_price: number | null;
  categories: { name: string } | null;
}

export interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

// Map DB product to frontend Product shape
export function mapDbProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    image: p.image_url || categoryFallbackImages[p.categories?.name || ""] || "/placeholder.svg",
    category: p.categories?.name || "Uncategorized",
    badge: p.badge || undefined,
    unit: p.unit,
    inStock: p.in_stock,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DbProduct[]).map(mapDbProduct);
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as DbCategory[];
    },
  });
}

export function useProductsByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ["products", "category", categoryId],
    queryFn: async () => {
      let query = supabase.from("products").select("*, categories(name)");
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data as DbProduct[]).map(mapDbProduct);
    },
  });
}

export function useSearchProducts(searchTerm: string) {
  return useQuery({
    queryKey: ["products", "search", searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .ilike("name", `%${searchTerm}%`)
        .order("name");
      if (error) throw error;
      return (data as DbProduct[]).map(mapDbProduct);
    },
    enabled: searchTerm.length > 0,
  });
}
