import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

export const OrdersTab = ({
  orders,
  onUpdateStatus,
}: {
  orders: any[];
  onUpdateStatus: (id: string, status: string) => void;
}) => (
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
              {orders.map((order: any) => (
                <tr key={order.id} className="border-b border-border/50">
                  <td className="py-3 font-mono text-xs text-foreground">{order.id.slice(0, 8)}…</td>
                  <td className="py-3 font-medium text-foreground">{order.customer_name}</td>
                  <td className="py-3 font-semibold text-foreground">${Number(order.total).toFixed(2)}</td>
                  <td className="py-3">
                    <Badge className="bg-primary/10 text-primary capitalize">{order.status}</Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value)}
                      className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);
