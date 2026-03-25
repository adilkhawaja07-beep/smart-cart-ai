import { useState, useEffect } from "react";
import { AnalyticsRepository } from "@/lib/repositories/analyticsRepository";
import { OrderRepository } from "@/lib/repositories/orderRepository";
import { ProductRepository, InventoryRepository } from "@/lib/repositories/productRepository";
import { AnalyticsService } from "@/lib/services/analyticsService";
import { toast } from "@/hooks/use-toast";

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

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalProfit: 0,
    lowStockCount: 0,
    totalOrders: 0,
    grossMargin: 0,
    avgOrderValue: 0,
    totalUnitsSold: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  });
  const [salesByProduct, setSalesByProduct] = useState<SalesByProduct[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState<any | null>(null);

  const fetchData = async () => {
    try {
      // Fetch all data in parallel using repositories
      const [products, inventory, salesData, orders] = await Promise.all([
        ProductRepository.fetchProducts(),
        InventoryRepository.fetchInventory(),
        AnalyticsRepository.fetchSalesData(100),
        OrderRepository.fetchOrders(50),
      ]);

      setAllProducts(products || []);
      setInventory(inventory || []);
      setRecentOrders(orders || []);

      // Fetch categories
      const categories = await ProductRepository.fetchCategories();
      setAllCategories(categories || []);

      // Use AnalyticsService for calculations
      const computedStats = AnalyticsService.computeStats(products, inventory, salesData, orders);
      setStats(computedStats);

      // Compute sales by product
      const salesByProd = AnalyticsService.computeSalesByProduct(salesData);
      setSalesByProduct(salesByProd);

      // Compute category revenue
      const catRevenue = AnalyticsService.computeCategoryRevenue(salesData);
      setCategoryRevenue(catRevenue);

      // Compute daily sales
      const dailySalesData = AnalyticsService.computeDailySales(salesData);
      setDailySales(dailySalesData);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast({ title: "Error", description: "Failed to load dashboard data" });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await OrderRepository.updateOrderStatus(orderId, newStatus);
      toast({ title: "Order Updated", description: `Order marked as ${newStatus}` });
      setRecentOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    stats,
    salesByProduct,
    categoryRevenue,
    dailySales,
    inventory,
    recentOrders,
    allProducts,
    allCategories,
    editProduct,
    editCategory,
    setEditProduct,
    setEditCategory,
    fetchData,
    updateOrderStatus,
  };
};
