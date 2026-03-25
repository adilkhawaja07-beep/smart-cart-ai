/**
 * Analytics Service - computes dashboard statistics and data aggregations
 * Separates business logic from component rendering
 */

export interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  totalProfit: number;
  lowStockCount: number;
  totalOrders: number;
  grossMargin: number;
  avgOrderValue: number;
  totalUnitsSold: number;
  pendingOrders: number;
  deliveredOrders: number;
}

export interface SalesByProduct {
  name: string;
  revenue: number;
  profit: number;
  quantity: number;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface CategoryRevenue {
  name: string;
  revenue: number;
}

export class AnalyticsService {
  /**
   * Compute dashboard statistics from raw data
   */
  static computeStats(
    products: any[],
    inventory: any[],
    sales: any[],
    orders: any[]
  ): DashboardStats {
    const totalRevenue = sales.reduce((s, r) => s + Number(r.revenue), 0);
    const totalProfit = sales.reduce((s, r) => s + Number(r.profit || 0), 0);
    const totalUnits = sales.reduce((s, r) => s + Number(r.quantity), 0);
    const lowStock = inventory.filter((i: any) => i.quantity <= i.reorder_level).length;
    const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
    const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;

    return {
      totalProducts: products.length,
      totalRevenue,
      totalProfit,
      lowStockCount: lowStock,
      totalOrders: orders.length,
      grossMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      avgOrderValue:
        orders.length > 0
          ? orders.reduce((s: number, o: any) => s + Number(o.total), 0) / orders.length
          : 0,
      totalUnitsSold: totalUnits,
      pendingOrders,
      deliveredOrders,
    };
  }

  /**
   * Compute sales by product
   */
  static computeSalesByProduct(sales: any[]): SalesByProduct[] {
    const productMap = new Map<string, { revenue: number; profit: number; quantity: number }>();

    sales.forEach((s: any) => {
      const name = s.products?.name || "Unknown";
      const existing = productMap.get(name) || { revenue: 0, profit: 0, quantity: 0 };
      productMap.set(name, {
        revenue: existing.revenue + Number(s.revenue),
        profit: existing.profit + Number(s.profit || 0),
        quantity: existing.quantity + Number(s.quantity),
      });
    });

    return Array.from(productMap.entries())
      .map(([name, data]) => ({
        name: name.length > 15 ? name.slice(0, 15) + "…" : name,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }

  /**
   * Compute category revenue
   */
  static computeCategoryRevenue(sales: any[]): CategoryRevenue[] {
    const catMap = new Map<string, number>();

    sales.forEach((s: any) => {
      const catName = (s.products as any)?.categories?.name || "Other";
      catMap.set(catName, (catMap.get(catName) || 0) + Number(s.revenue));
    });

    return Array.from(catMap.entries())
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Compute daily sales trends
   */
  static computeDailySales(sales: any[]): DailySales[] {
    const dayMap = new Map<string, { revenue: number; orders: number; profit: number }>();

    sales.forEach((s: any) => {
      const date = new Date(s.sold_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = dayMap.get(date) || { revenue: 0, orders: 0, profit: 0 };
      dayMap.set(date, {
        revenue: existing.revenue + Number(s.revenue),
        orders: existing.orders + 1,
        profit: existing.profit + Number(s.profit || 0),
      });
    });

    return Array.from(dayMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .slice(-14); // Last 14 days
  }

  /**
   * Identify low stock products
   */
  static identifyLowStockProducts(inventory: any[]): any[] {
    return inventory
      .filter((i: any) => i.quantity <= i.reorder_level)
      .sort((a: any, b: any) => a.quantity - b.quantity);
  }
}

export default AnalyticsService;
