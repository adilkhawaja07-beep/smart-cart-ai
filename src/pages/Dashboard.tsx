import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useChat } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import {
  BarChart3, Package, DollarSign, TrendingUp, AlertTriangle,
  Send, ArrowLeft, ShoppingBag, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRef, useEffect as useEffect2 } from "react";

interface DashboardStats {
  totalProducts: number;
  totalRevenue: number;
  totalProfit: number;
  lowStockCount: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0, totalRevenue: 0, totalProfit: 0, lowStockCount: 0,
  });
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "inventory" | "ai">("overview");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [prodRes, invRes, salesRes] = await Promise.all([
      supabase.from("products").select("*, categories(name)"),
      supabase.from("inventory").select("*, products(name, price)"),
      supabase.from("sales_log").select("revenue, profit"),
    ]);

    setProducts(prodRes.data || []);
    setInventory(invRes.data || []);

    const totalRevenue = salesRes.data?.reduce((s, r) => s + Number(r.revenue), 0) || 0;
    const totalProfit = salesRes.data?.reduce((s, r) => s + Number(r.profit || 0), 0) || 0;
    const lowStock = (invRes.data || []).filter((i: any) => i.quantity <= i.reorder_level).length;

    setStats({
      totalProducts: prodRes.data?.length || 0,
      totalRevenue,
      totalProfit,
      lowStockCount: lowStock,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Back to Store
            </Link>
            <h1 className="font-display text-xl font-bold text-foreground">Management Dashboard</h1>
          </div>
          <Badge variant="outline" className="text-primary border-primary">Admin</Badge>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-border bg-card">
        <div className="container flex gap-1">
          {[
            { key: "overview", label: "Overview", icon: BarChart3 },
            { key: "inventory", label: "Inventory", icon: Package },
            { key: "ai", label: "AI Insights", icon: MessageCircle },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
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
        {activeTab === "overview" && <OverviewTab stats={stats} />}
        {activeTab === "inventory" && <InventoryTab inventory={inventory} products={products} />}
        {activeTab === "ai" && <AIInsightsTab />}
      </div>
    </div>
  );
};

const OverviewTab = ({ stats }: { stats: DashboardStats }) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        { title: "Total Products", value: stats.totalProducts, icon: ShoppingBag, color: "text-primary" },
        { title: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-fresh-leaf" },
        { title: "Total Profit", value: `$${stats.totalProfit.toFixed(2)}`, icon: TrendingUp, color: "text-warm-honey" },
        { title: "Low Stock Alerts", value: stats.lowStockCount, icon: AlertTriangle, color: "text-destructive" },
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

    <Card>
      <CardHeader>
        <CardTitle className="font-display">Gross Margin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">
          {stats.totalRevenue > 0
            ? `${((stats.totalProfit / stats.totalRevenue) * 100).toFixed(1)}%`
            : "N/A"}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Revenue: ${stats.totalRevenue.toFixed(2)} | Cost: ${(stats.totalRevenue - stats.totalProfit).toFixed(2)}
        </p>
      </CardContent>
    </Card>
  </div>
);

const InventoryTab = ({ inventory, products }: { inventory: any[]; products: any[] }) => (
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

const AIInsightsTab = () => {
  const { messages, isLoading, send, clearMessages } = useChat("management");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect2(() => {
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
  ];

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="border-b border-border">
        <CardTitle className="flex items-center gap-2 font-display">
          <MessageCircle className="h-5 w-5 text-primary" />
          AI Business Intelligence
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions about sales, inventory, profitability, and strategy
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-4">
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
