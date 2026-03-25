import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/ProductCard";
import { productImages } from "@/hooks/productImages";

import categoryFruits from "@/assets/category-fruits.jpg";
import categoryVegetables from "@/assets/category-vegetables.jpg";
import categoryDairy from "@/assets/category-dairy.jpg";
import categoryBakery from "@/assets/category-bakery.jpg";
import categoryMeatSeafood from "@/assets/category-meat-seafood.jpg";
import categoryBeverages from "@/assets/category-beverages.jpg";
import categorySnacks from "@/assets/category-snacks.jpg";
import categoryPantry from "@/assets/category-pantry.jpg";
import categoryFrozen from "@/assets/category-frozen.jpg";
import categoryOrganic from "@/assets/category-organic.jpg";

const categoryFallbackImages: Record<string, string> = {
  "Fresh Fruits": categoryFruits,
  Vegetables: categoryVegetables,
  "Dairy & Eggs": categoryDairy,
  Bakery: categoryBakery,
  "Meat & Seafood": categoryMeatSeafood,
  Beverages: categoryBeverages,
  "Snacks & Chips": categorySnacks,
  "Pantry & Grains": categoryPantry,
  "Frozen Foods": categoryFrozen,
  "Organic & Health": categoryOrganic,
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
  categories: { name: string; image_url: string | null } | null;
}

export interface DbCategory {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
}

// Map DB product to frontend Product shape
export function mapDbProduct(p: DbProduct): Product {
  // Use local product images first, fallback to category images
  const categoryName = p.categories?.name || "";
  
  // Case-insensitive product image lookup
  const productImageKey = Object.keys(productImages).find(
    key => key.toLowerCase() === p.name.toLowerCase()
  );
  
  // Case-insensitive category image lookup
  const categoryImageKey = Object.keys(categoryFallbackImages).find(
    key => key.toLowerCase() === categoryName.toLowerCase()
  );
  
  const imageUrl = 
    (productImageKey ? productImages[productImageKey] : null) || 
    (categoryImageKey ? categoryFallbackImages[categoryImageKey] : null) || 
    "/placeholder.svg";
  
  return {
    id: p.id,
    name: p.name,
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    image: imageUrl,
    category: categoryName || "Uncategorized",
    badge: p.badge || undefined,
    unit: p.unit,
    inStock: p.in_stock,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      // Fetch products with category info including image_url
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, image_url)")
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
      
      // Use local images for all categories with case-insensitive lookup
      return (data as DbCategory[]).map(cat => {
        const categoryImageKey = Object.keys(categoryFallbackImages).find(
          key => key.toLowerCase() === cat.name.toLowerCase()
        );
        return {
          ...cat,
          image_url: (categoryImageKey ? categoryFallbackImages[categoryImageKey] : null) || "/placeholder.svg",
        };
      });
    },
  });
}

export function useProductsByCategory(categoryId: string | null) {
  return useQuery({
    queryKey: ["products", "category", categoryId],
    queryFn: async () => {
      // Fetch products with category info including image_url
      let query = supabase.from("products").select("*, categories(name, image_url)");
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
      // Fetch products with category info including image_url
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name, image_url)")
        .ilike("name", `%${searchTerm}%`)
        .order("name");
      if (error) throw error;
      return (data as DbProduct[]).map(mapDbProduct);
    },
    enabled: searchTerm.length > 0,
  });
}
