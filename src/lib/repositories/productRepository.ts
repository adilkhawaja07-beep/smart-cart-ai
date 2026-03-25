import { supabase } from "@/integrations/supabase/client";
import type { DbProduct, DbCategory } from "@/hooks/useProducts";

/**
 * Product Repository - handles all product data access
 * Abstracts Supabase calls to provide a clean interface
 */

export class ProductRepository {
  static async fetchProducts(): Promise<DbProduct[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async fetchCategories(): Promise<DbCategory[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  }

  static async fetchProductsByCategory(categoryId: string): Promise<DbProduct[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .eq("category_id", categoryId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async searchProducts(searchTerm: string): Promise<DbProduct[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)")
      .ilike("name", `%${searchTerm}%`)
      .order("name");
    if (error) throw error;
    return data || [];
  }

  static async createProduct(product: {
    name: string;
    price: number;
    original_price?: number | null;
    cost_price?: number | null;
    unit: string;
    badge?: string | null;
    description?: string | null;
    category_id?: string | null;
    image_url?: string | null;
    in_stock?: boolean;
  }) {
    const { data, error } = await supabase
      .from("products")
      .insert(product)
      .select("id")
      .single();
    if (error) throw error;
    return data;
  }

  static async updateProduct(
    productId: string,
    updates: Partial<DbProduct>
  ) {
    const { error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId);
    if (error) throw error;
  }

  static async deleteProduct(productId: string) {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);
    if (error) throw error;
  }
}

/**
 * Inventory Repository - handles inventory stock tracking
 */
export class InventoryRepository {
  static async createInventory(inventoryData: {
    product_id: string;
    quantity: number;
    reorder_level: number;
  }) {
    const { error } = await supabase.from("inventory").insert(inventoryData);
    if (error) throw error;
  }

  static async fetchInventory() {
    const { data, error } = await supabase
      .from("inventory")
      .select("*, products(name, price)");
    if (error) throw error;
    return data || [];
  }

  static async findLowStockItems() {
    const { data, error } = await supabase
      .from("inventory")
      .select("*, products(name)")
      .filter("quantity", "lte", "reorder_level");
    if (error) throw error;
    return data || [];
  }
}

/**
 * Category Repository - handles category data access
 */
export class CategoryRepository {
  static async fetchCategories(): Promise<DbCategory[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data || [];
  }

  static async createCategory(category: {
    name: string;
    description?: string | null;
    image_url?: string | null;
  }) {
    const { data, error } = await supabase
      .from("categories")
      .insert(category)
      .select("id")
      .single();
    if (error) throw error;
    return data;
  }

  static async updateCategory(
    categoryId: string,
    updates: Partial<DbCategory>
  ) {
    const { error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", categoryId);
    if (error) throw error;
  }

  static async deleteCategory(categoryId: string) {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);
    if (error) throw error;
  }
}
