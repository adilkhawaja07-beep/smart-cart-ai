import { DashboardStats, SalesByProduct, DailySales, CategoryRevenue } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { DollarSign, TrendingUp, Target, Clock, Percent, AlertTriangle, ShoppingBag } from "lucide-react";

const CHART_COLORS = [
  "hsl(145, 45%, 32%)",
  "hsl(38, 60%, 55%)",
  "hsl(16, 55%, 55%)",
  "hsl(95, 50%, 50%)",
  "hsl(200, 60%, 50%)",
  "hsl(270, 50%, 55%)",
];

export const OverviewTab = ({
  stats,
  salesByProduct,
  dailySales,
  categoryRevenue,
}: {
  stats: DashboardStats;
  salesByProduct: SalesByProduct[];
  dailySales: DailySales[];
  categoryRevenue: CategoryRevenue[];
}) => (
  <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[
        {
          title: "Total Revenue",
          value: `$${stats.totalRevenue.toFixed(2)}`,
          icon: DollarSign,
          color: "text-primary",
          sub: `${stats.totalOrders} orders`,
        },
        {
          title: "Total Profit",
          value: `$${stats.totalProfit.toFixed(2)}`,
          icon: TrendingUp,
          color: "text-fresh-leaf",
          sub: `${stats.grossMargin.toFixed(1)}% margin`,
        },
        {
          title: "Avg Order Value",
          value: `$${stats.avgOrderValue.toFixed(2)}`,
          icon: Target,
          color: "text-warm-honey",
          sub: `${stats.totalUnitsSold} units sold`,
        },
        {
          title: "Pending Orders",
          value: stats.pendingOrders,
          icon: Clock,
          color: "text-amber-500",
          sub: `${stats.deliveredOrders} delivered`,
        },
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
        <CardHeader>
          <CardTitle className="font-display text-base">Revenue & Profit Trend</CardTitle>
        </CardHeader>
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
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Revenue by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryRevenue}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="revenue"
                  nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryRevenue.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
