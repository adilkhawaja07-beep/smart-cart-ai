import { DashboardStats, SalesByProduct, DailySales, CategoryRevenue } from "@/hooks/useDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(145, 45%, 32%)",
  "hsl(38, 60%, 55%)",
  "hsl(16, 55%, 55%)",
  "hsl(95, 50%, 50%)",
  "hsl(200, 60%, 50%)",
  "hsl(270, 50%, 55%)",
];

export const SalesTab = ({
  salesByProduct,
  dailySales,
  categoryRevenue,
  stats,
}: {
  salesByProduct: SalesByProduct[];
  dailySales: DailySales[];
  categoryRevenue: CategoryRevenue[];
  stats: DashboardStats;
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
      <CardHeader>
        <CardTitle className="font-display text-base">Top Selling Products</CardTitle>
      </CardHeader>
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
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">No sales data</p>
        )}
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      {/* Revenue by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Revenue by Category</CardTitle>
        </CardHeader>
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
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(cat.revenue / maxRev) * 100}%`,
                          backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
          )}
        </CardContent>
      </Card>

      {/* Product Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Product Performance</CardTitle>
        </CardHeader>
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
