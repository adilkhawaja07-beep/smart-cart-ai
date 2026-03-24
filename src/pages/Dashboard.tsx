import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import {
  BarChart3, Package, DollarSign, TrendingUp, AlertTriangle,
  Send, ArrowLeft, ShoppingBag, MessageCircle, Trash2,
  CheckCircle, Clock, Truck, XCircle, Activity, Users,
  ArrowUpRight, ArrowDownRight, Target, Percent, PlusCircle,
} from "lucide-react";
import AddProductForm from "@/components/AddProductForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";

interface DashboardStats {
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

interface SalesByProduct {
  name: string;
  revenue: number;
  profit: number;
  quantity: number;
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

interface CategoryRevenue {
  name: string;
  revenue: number;
}

const CHART_COLORS = [
  "hsl(145, 45%, 32%)",
  "hsl(38, 60%, 55%)",
  "hsl(16, 55%, 55%)",
  "hsl(95, 50%, 50%)",
  "hsl(200, 60%, 50%)",
  "hsl(270, 50%, 55%)",
];

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

const statusConfig: Record<string, { icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bgColor: "bg-amber-100 text-amber-700" },
  processing: { icon: Activity, color: "text-blue-600", bgColor: "bg-blue-100 text-blue-700" },
  shipped: { icon: Truck, color: "text-purple-600", bgColor: "bg-purple-100 text-purple-700" },
  delivered: { icon: CheckCircle, color: "text-primary", bgColor: "bg-primary/10 text-primary" },
  cancelled: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10 text-destructive" },
};

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0, totalRevenue: 0, totalProfit: 0, lowStockCount: 0,
    totalOrders: 0, grossMargin: 0, avgOrderValue: 0, totalUnitsSold: 0,
    pendingOrders: 0, deliveredOrders: 0,
  });
  const [salesByProduct, setSalesByProduct] = useState<SalesByProduct[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenue[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "inventory" | "orders" | "ai">("overview");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [prodRes, invRes, salesRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)"),
      supabase.from("inventory").select("*, products(name, price)"),
      supabase.from("sales_log").select("*, products(name, categories(name))"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
    ]);

    setInventory(invRes.data || []);
    setRecentOrders(ordersRes.data || []);

    const sales = salesRes.data || [];
    const orders = ordersRes.data || [];
    const totalRevenue = sales.reduce((s, r) => s + Number(r.revenue), 0);
    const totalProfit = sales.reduce((s, r) => s + Number(r.profit || 0), 0);
    const totalUnits = sales.reduce((s, r) => s + Number(r.quantity), 0);
    const lowStock = (invRes.data || []).filter((i: any) => i.quantity <= i.reorder_level).length;
    const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
    const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;

    setStats({
      totalProducts: prodRes.data?.length || 0,
      totalRevenue,
      totalProfit,
      lowStockCount: lowStock,
      totalOrders: orders.length,
      grossMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      avgOrderValue: orders.length > 0 ? orders.reduce((s: number, o: any) => s + Number(o.total), 0) / orders.length : 0,
      totalUnitsSold: totalUnits,
      pendingOrders,
      deliveredOrders,
    });

    // Sales by product
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
    setSalesByProduct(
      Array.from(productMap.entries())
        .map(([name, data]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    );

    // Category revenue
    const catMap = new Map<string, number>();
    sales.forEach((s: any) => {
      const catName = (s.products as any)?.categories?.name || "Other";
      catMap.set(catName, (catMap.get(catName) || 0) + Number(s.revenue));
    });
    setCategoryRevenue(
      Array.from(catMap.entries()).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue)
    );

    // Daily sales
    const dayMap = new Map<string, { revenue: number; orders: number; profit: number }>();
    sales.forEach((s: any) => {
      const date = new Date(s.sold_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = dayMap.get(date) || { revenue: 0, orders: 0, profit: 0 };
      dayMap.set(date, {
        revenue: existing.revenue + Number(s.revenue),
        orders: existing.orders + 1,
        profit: existing.profit + Number(s.profit || 0),
      });
    });
    setDailySales(Array.from(dayMap.entries()).map(([date, data]) => ({ date, ...data })).slice(-14));
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Order Updated", description: `Order marked as ${newStatus}` });
    setRecentOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Store
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Management Console</h1>
          </div>
          <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="container flex gap-1 overflow-x-auto">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "sales", label: "Sales", icon: DollarSign },
            { key: "inventory", label: "Inventory", icon: Package },
            { key: "orders", label: "Orders", icon: ShoppingBag },
            { key: "ai", label: "AI Insights", icon: MessageCircle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="container py-8">
        {activeTab === "overview" && <OverviewTab stats={stats} salesByProduct={salesByProduct} dailySales={dailySales} categoryRevenue={categoryRevenue} />}
        {activeTab === "sales" && <SalesTab salesByProduct={salesByProduct} dailySales={dailySales} categoryRevenue={categoryRevenue} stats={stats} />}
        {activeTab === "inventory" && <InventoryTab inventory={inventory} />}
        {activeTab === "orders" && <OrdersTab orders={recentOrders} onUpdateStatus={updateOrderStatus} />}
        {activeTab === "ai" && <AIInsightsTab />}
      </div>
    </div>
  );
};

/* ─── OVERVIEW TAB ─── */
const OverviewTab = ({
  stats, salesByProduct, dailySales, categoryRevenue,
}: {
  stats: DashboardStats; salesByProduct: SalesByProduct[]; dailySales: DailySales[]; categoryRevenue: CategoryRevenue[];
}) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-primary", sub: `${stats.totalOrders} orders` },
        { title: "Total Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp, color: "text-fresh-leaf", sub: `${stats.grossMargin.toFixed(1)}% margin` },
        { title: "Avg Order Value", value: `$${stats.avgOrderValue.toFixed(2)}`, icon: Target, color: "text-warm-honey", sub: `${stats.totalUnitsSold} units sold` },
        { title: "Pending Orders", value: stats.pendingOrders, icon: Clock, color: "text-amber-500", sub: `${stats.deliveredOrders} delivered` },
      ].map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue Trend */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Revenue & Profit Trend</CardTitle></CardHeader>
        <CardContent>
          {dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(145, 45%, 32%)" fill="hsl(145, 45%, 32%)" fillOpacity={0.15} strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke="hsl(38, 60%, 55%)" fill="hsl(38, 60%, 55%)" fillOpacity={0.15} strokeWidth={2} name="Profit" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet</p>}
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Revenue by Category</CardTitle></CardHeader>
        <CardContent>
          {categoryRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryRevenue} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="revenue" nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryRevenue.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-12 text-center text-sm text-muted-foreground">No data</p>}
        </CardContent>
      </Card>
    </div>

    {/* Quick health indicators */}
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Percent className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gross Margin</p>
              <p className="text-2xl font-bold text-foreground">{stats.grossMargin > 0 ? `${stats.grossMargin.toFixed(1)}%` : "N/A"}</p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(stats.grossMargin, 100)}%` }} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
              <p className="text-2xl font-bold text-foreground">{stats.lowStockCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">of {stats.totalProducts} products need restocking</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fresh-leaf/10">
              <ShoppingBag className="h-5 w-5 text-fresh-leaf" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{stats.totalUnitsSold} total units sold</p>
        </CardContent>
      </Card>
    </div>
  </div>
);

/* ─── SALES TAB ─── */
const SalesTab = ({
  salesByProduct, dailySales, categoryRevenue, stats,
}: {
  salesByProduct: SalesByProduct[]; dailySales: DailySales[]; categoryRevenue: CategoryRevenue[]; stats: DashboardStats;
}) => (
  <div className="space-y-6">
    {/* KPI row */}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-3xl font-bold text-foreground">${stats.totalRevenue.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Total Profit</p>
          <p className="text-3xl font-bold text-foreground">${stats.totalProfit.toFixed(2)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Units Sold</p>
          <p className="text-3xl font-bold text-foreground">{stats.totalUnitsSold}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Avg Order Value</p>
          <p className="text-3xl font-bold text-foreground">${stats.avgOrderValue.toFixed(2)}</p>
        </CardContent>
      </Card>
    </div>

    {/* Top Selling Products */}
    <Card>
      <CardHeader><CardTitle className="font-display text-base">Top Selling Products</CardTitle></CardHeader>
      <CardContent>
        {salesByProduct.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={salesByProduct} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Bar dataKey="revenue" fill="hsl(145, 45%, 32%)" radius={[0, 4, 4, 0]} name="Revenue" />
              <Bar dataKey="profit" fill="hsl(38, 60%, 55%)" radius={[0, 4, 4, 0]} name="Profit" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="py-12 text-center text-sm text-muted-foreground">No sales data</p>}
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue by Category */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Revenue by Category</CardTitle></CardHeader>
        <CardContent>
          {categoryRevenue.length > 0 ? (
            <div className="space-y-3">
              {categoryRevenue.map((cat, i) => {
                const maxRev = categoryRevenue[0]?.revenue || 1;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground">{cat.name}</span>
                      <span className="text-muted-foreground">${cat.revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(cat.revenue / maxRev) * 100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="py-8 text-center text-sm text-muted-foreground">No data</p>}
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      <Card>
        <CardHeader><CardTitle className="font-display text-base">Product Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 font-semibold text-muted-foreground">Product</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-right">Qty</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-right">Revenue</th>
                  <th className="pb-2 font-semibold text-muted-foreground text-right">Profit</th>
                </tr>
              </thead>
              <tbody>
                {salesByProduct.map((p) => (
                  <tr key={p.name} className="border-b border-border/50">
                    <td className="py-2 font-medium text-foreground">{p.name}</td>
                    <td className="py-2 text-right text-foreground">{p.quantity}</td>
                    <td className="py-2 text-right text-foreground">${p.revenue.toFixed(2)}</td>
                    <td className="py-2 text-right">
                      <span className={p.profit >= 0 ? "text-primary" : "text-destructive"}>${p.profit.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

/* ─── INVENTORY TAB ─── */
const InventoryTab = ({ inventory }: { inventory: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display">Inventory Levels</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-semibold text-muted-foreground">Product</th>
              <th className="pb-3 font-semibold text-muted-foreground">Stock</th>
              <th className="pb-3 font-semibold text-muted-foreground">Reorder Level</th>
              <th className="pb-3 font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item: any) => {
              const isLow = item.quantity <= item.reorder_level;
              const isOut = item.quantity === 0;
              return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">{item.products?.name || "Unknown"}</td>
                  <td className="py-3 text-foreground">{item.quantity}</td>
                  <td className="py-3 text-muted-foreground">{item.reorder_level}</td>
                  <td className="py-3">
                    <Badge variant={isOut ? "destructive" : isLow ? "outline" : "default"}
                      className={isOut ? "" : isLow ? "border-amber-500 text-amber-600" : "bg-primary/10 text-primary"}>
                      {isOut ? "Out of Stock" : isLow ? "Low Stock" : "In Stock"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);

/* ─── ORDERS TAB ─── */
const OrdersTab = ({ orders, onUpdateStatus }: { orders: any[]; onUpdateStatus: (id: string, status: string) => void }) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display">Order Management</CardTitle>
      <p className="text-sm text-muted-foreground">Update order status — inventory is deducted when an order is placed</p>
    </CardHeader>
    <CardContent>
      {orders.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No orders yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-muted-foreground">Order</th>
                <th className="pb-3 font-semibold text-muted-foreground">Customer</th>
                <th className="pb-3 font-semibold text-muted-foreground">Total</th>
                <th className="pb-3 font-semibold text-muted-foreground">Status</th>
                <th className="pb-3 font-semibold text-muted-foreground">Date</th>
                <th className="pb-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => {
                const cfg = statusConfig[order.status] || statusConfig.pending;
                return (
                  <tr key={order.id} className="border-b border-border/50">
                    <td className="py-3 font-mono text-xs text-foreground">{order.id.slice(0, 8)}…</td>
                    <td className="py-3 font-medium text-foreground">{order.customer_name}</td>
                    <td className="py-3 font-semibold text-foreground">${Number(order.total).toFixed(2)}</td>
                    <td className="py-3">
                      <Badge className={cfg.bgColor + " capitalize"}>{order.status}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="py-3">
                      <select
                        value={order.status}
                        onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                        className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

/* ─── AI INSIGHTS TAB ─── */
const AIInsightsTab = () => {
  const { messages, isLoading, send, clearMessages } = useChat("management");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput("");
  };

  const quickPrompts = [
    "What are my top selling products?",
    "Show me profitability analysis by product",
    "Which products need restocking?",
    "Calculate inventory turnover ratios",
    "Give me strategic recommendations for growth",
    "What's my days sales of inventory (DSI)?",
    "Suggest pricing optimizations",
    "What products should I promote next?",
  ];

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <MessageCircle className="h-5 w-5 text-primary" />
              AI Business Intelligence
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Ask about sales, inventory, profitability, and strategy</p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-4 py-8">
              <p className="text-sm text-muted-foreground text-center">Try one of these queries:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt) => (
                  <button key={prompt} onClick={() => send(prompt)}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors">
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                ) : msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, profitability, inventory..."
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading} />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default Dashboard;
