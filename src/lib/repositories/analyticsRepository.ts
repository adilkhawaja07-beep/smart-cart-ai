import { supabase } from "@/integrations/supabase/client";

/**
 * Analytics Repository - handles dashboard and analytics data
 */
export class AnalyticsRepository {
  static async fetchSalesData(limit: number = 100) {
    const { data, error } = await supabase
      .from("sales_log")
      .select("*, products(name, categories(name))")
      .order("sold_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  static async fetchInventoryForAnalytics(limit: number = 100) {
    const { data, error } = await supabase
      .from("inventory")
      .select("*, products(name, price)")
      .limit(limit);
    if (error) throw error;
    return data || [];
  }

  static async fetchProductsWithCategories() {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name)");
    if (error) throw error;
    return data || [];
  }

  static async fetchOrders() {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data || [];
  }
}
