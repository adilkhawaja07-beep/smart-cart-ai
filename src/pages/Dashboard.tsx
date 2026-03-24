import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import {
  BarChart3, Package, DollarSign, TrendingUp, AlertTriangle,
  Send, ArrowLeft, ShoppingBag, MessageCircle, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  totalProfit: number;
  lowStockCount: number;
  totalOrders: number;
  grossMargin: number;
}

interface SalesByProduct {
  name: string;
  revenue: number;
  profit: number;
}

interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}

const CHART_COLORS = [
  "hsl(145, 45%, 32%)",
  "hsl(38, 60%, 55%)",
  "hsl(16, 55%, 55%)",
  "hsl(95, 50%, 50%)",
  "hsl(200, 60%, 50%)",
  "hsl(270, 50%, 55%)",
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0, totalRevenue: 0, totalProfit: 0, lowStockCount: 0, totalOrders: 0, grossMargin: 0,
  });
  const [salesByProduct, setSalesByProduct] = useState<SalesByProduct[]>([]);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "orders" | "ai">("overview");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [prodRes, invRes, salesRes, ordersRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)"),
      supabase.from("inventory").select("*, products(name, price)"),
      supabase.from("sales_log").select("*, products(name)"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(20),
    ]);

    setInventory(invRes.data || []);
    setRecentOrders(ordersRes.data || []);

    const sales = salesRes.data || [];
    const totalRevenue = sales.reduce((s, r) => s + Number(r.revenue), 0);
    const totalProfit = sales.reduce((s, r) => s + Number(r.profit || 0), 0);
    const lowStock = (invRes.data || []).filter((i: any) => i.quantity <= i.reorder_level).length;

    setStats({
      totalProducts: prodRes.data?.length || 0,
      totalRevenue,
      totalProfit,
      lowStockCount: lowStock,
      totalOrders: ordersRes.data?.length || 0,
      grossMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
    });

    // Sales by product aggregation
    const productMap = new Map<string, { revenue: number; profit: number }>();
    sales.forEach((s: any) => {
      const name = s.products?.name || "Unknown";
      const existing = productMap.get(name) || { revenue: 0, profit: 0 };
      productMap.set(name, {
        revenue: existing.revenue + Number(s.revenue),
        profit: existing.profit + Number(s.profit || 0),
      });
    });
    setSalesByProduct(
      Array.from(productMap.entries())
        .map(([name, data]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)
    );

    // Daily sales aggregation
    const dayMap = new Map<string, { revenue: number; orders: number }>();
    sales.forEach((s: any) => {
      const date = new Date(s.sold_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const existing = dayMap.get(date) || { revenue: 0, orders: 0 };
      dayMap.set(date, { revenue: existing.revenue + Number(s.revenue), orders: existing.orders + 1 });
    });
    setDailySales(
      Array.from(dayMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .slice(-14)
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
            <h1 className="font-display text-xl font-bold text-foreground">Management Dashboard</h1>
          </div>
          <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
        </div>
      </header>

      <div className="border-b border-border bg-card">
        <div className="container flex gap-1 overflow-x-auto">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
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
        {activeTab === "overview" && <OverviewTab stats={stats} salesByProduct={salesByProduct} dailySales={dailySales} />}
        {activeTab === "inventory" && <InventoryTab inventory={inventory} />}
        {activeTab === "orders" && <OrdersTab orders={recentOrders} />}
        {activeTab === "ai" && <AIInsightsTab />}
      </div>
    </div>
  );
};

const OverviewTab = ({
  stats,
  salesByProduct,
  dailySales,
}: {
  stats: DashboardStats;
  salesByProduct: SalesByProduct[];
  dailySales: DailySales[];
}) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "Total Products", value: stats.totalProducts, icon: ShoppingBag, color: "text-primary" },
        { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-fresh-leaf" },
        { title: "Total Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp, color: "text-warm-honey" },
        { title: "Low Stock", value: stats.lowStockCount, icon: AlertTriangle, color: "text-destructive" },
      ].map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue by Product */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Revenue by Product</CardTitle>
        </CardHeader>
        <CardContent>
          {salesByProduct.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesByProduct}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="revenue" fill="hsl(145, 45%, 32%)" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="profit" fill="hsl(38, 60%, 55%)" radius={[4, 4, 0, 0]} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Daily Sales Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(145, 45%, 32%)" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Gross Margin Card */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Gross Margin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-primary">
            {stats.grossMargin > 0 ? `${stats.grossMargin.toFixed(1)}%` : "N/A"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Revenue: ${stats.totalRevenue.toFixed(2)} · Cost: ${(stats.totalRevenue - stats.totalProfit).toFixed(2)}
          </p>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(stats.grossMargin, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Product Category Split */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {salesByProduct.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={salesByProduct.slice(0, 6)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {salesByProduct.slice(0, 6).map((_, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No data</p>
          )}
        </CardContent>
      </Card>
    </div>
  </div>
);

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
              return (
                <tr key={item.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">{item.products?.name || "Unknown"}</td>
                  <td className="py-3 text-foreground">{item.quantity}</td>
                  <td className="py-3 text-muted-foreground">{item.reorder_level}</td>
                  <td className="py-3">
                    <Badge variant={isLow ? "destructive" : "default"} className={isLow ? "" : "bg-primary/10 text-primary"}>
                      {isLow ? "Low Stock" : "In Stock"}
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

const OrdersTab = ({ orders }: { orders: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="font-display">Recent Orders</CardTitle>
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
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-3 font-mono text-xs text-foreground">{order.id.slice(0, 8)}…</td>
                  <td className="py-3 font-medium text-foreground">{order.customer_name}</td>
                  <td className="py-3 font-semibold text-foreground">${Number(order.total).toFixed(2)}</td>
                  <td className="py-3">
                    <Badge className="bg-primary/10 text-primary capitalize">{order.status}</Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);

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
            <p className="text-sm text-muted-foreground mt-1">
              Ask questions about sales, inventory, profitability, and strategy
            </p>
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
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
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
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, profitability, inventory..."
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
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
