/**
 * Management Dashboard
 * System overview, analytics, and order management
 * Managers see all orders, staff performance, audit logs, and overall metrics
 */

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Eye,
  LogOut,
  Settings,
  AlertCircle,
  Search,
  Calendar,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderStatus } from '@/types/orders';
import { OrderTimeline } from '@/components/OrderTimeline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  order_id: string;
  previous_status: OrderStatus;
  new_status: OrderStatus;
  changed_by: string;
  change_reason?: string;
  user_role: string;
  created_at: string;
}

export function ManagementDashboard() {
  const { user } = useAuth();
  const { orders, loading, error, stats, refreshOrders, applyFilters } = useOrders();
  const { toast } = useToast();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const { data, error: err } = await supabase
        .from('order_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (err) throw err;
      setAuditLogs(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch audit logs';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAuditLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      !searchTerm ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const metrics = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.total, 0),
    averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
    completionRate: orders.length > 0
      ? ((orders.filter(o => o.status === 'delivered').length / orders.length) * 100).toFixed(1)
      : 0,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-purple-50/10">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">📊 System Overview</h1>
            <p className="text-muted-foreground mt-1">Monitor all orders and system activity • Management Dashboard</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshOrders}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-8">
            {error}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                  <div className="text-3xl font-bold">{metrics.totalOrders}</div>
                </div>
                <Package className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
                  <div className="text-3xl font-bold">₹{metrics.totalRevenue.toFixed(0)}</div>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Order Value</p>
                  <div className="text-3xl font-bold">₹{metrics.averageOrderValue.toFixed(0)}</div>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                  <div className="text-3xl font-bold">{metrics.completionRate}%</div>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Status Distribution */}
        {stats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {[
                  { status: 'Pending', count: stats.pending, color: 'bg-gray-100 text-gray-800' },
                  { status: 'Confirmed', count: stats.confirmed, color: 'bg-blue-100 text-blue-800' },
                  { status: 'Picking', count: stats.picking, color: 'bg-yellow-100 text-yellow-800' },
                  { status: 'Picked', count: stats.picked, color: 'bg-amber-100 text-amber-800' },
                  { status: 'In Transit', count: stats.in_transit, color: 'bg-indigo-100 text-indigo-800' },
                  { status: 'Delivered', count: stats.delivered, color: 'bg-green-100 text-green-800' },
                  { status: 'Cancelled', count: stats.cancelled || 0, color: 'bg-red-100 text-red-800' },
                ].map(({ status, count, color }) => (
                  <div key={status} className="text-center">
                    <div className="text-2xl font-bold mb-2">{count}</div>
                    <Badge className={color} variant="secondary">{status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Orders & Audit Logs */}
        <div className="space-y-8">
          {/* Orders Tab */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">All Orders</h2>
              <Button
                variant={auditLoading ? 'secondary' : 'outline'}
                onClick={fetchAuditLogs}
                disabled={auditLoading}
              >
                {auditLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading Logs
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    View Audit Log
                  </>
                )}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="picking">Picking</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">No orders found</p>
                  <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">
                              Order #{order.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <Badge
                              className={
                                order.status === 'pending'
                                  ? 'bg-gray-100 text-gray-800'
                                  : order.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.status === 'picking'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : order.status === 'picked'
                                  ? 'bg-amber-100 text-amber-800'
                                  : order.status === 'in_transit'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : order.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name} • {order.customer_email}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {order.items.length} items • ₹{order.total.toFixed(2)} • Created {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedOrder(
                              expandedOrder === order.id ? null : order.id
                            )
                          }
                        >
                          {expandedOrder === order.id ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>

                      {/* Expanded Order Details */}
                      {expandedOrder === order.id && (
                        <div className="mt-4 border-t pt-4 space-y-4">
                          {/* Timeline */}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Order Timeline</p>
                            <OrderTimeline
                              currentStatus={order.status}
                              createdAt={order.created_at}
                              confirmedAt={order.confirmed_at}
                              pickedAt={order.picked_at}
                              deliveredAt={order.delivered_at}
                              compact={false}
                            />
                          </div>

                          {/* Customer & Delivery Info */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/30 p-3 rounded text-sm">
                              <p className="font-medium mb-1">Delivery Address</p>
                              <p className="text-muted-foreground">{order.delivery_address}</p>
                            </div>
                            <div className="bg-muted/30 p-3 rounded text-sm">
                              <p className="font-medium mb-1">Phone</p>
                              <p className="text-muted-foreground">{order.customer_phone}</p>
                            </div>
                          </div>

                          {/* Items */}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Items</p>
                            <div className="space-y-1">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm p-2 bg-muted/20 rounded">
                                  <span>{item.product_name} x{item.quantity}</span>
                                  <span className="font-medium">₹{(item.unit_price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Cost Breakdown */}
                          <div className="bg-muted/30 p-3 rounded space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{order.subtotal?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>₹{order.tax?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Delivery:</span>
                              <span>₹{order.delivery_fee?.toFixed(2)}</span>
                            </div>
                            <div className="border-t border-muted pt-1 flex justify-between font-semibold">
                              <span>Total:</span>
                              <span>₹{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Audit Log Tab */}
          {auditLogs.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Recent Audit Log</h2>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <Card key={log.id} className="border-l-4 border-l-primary">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">
                            Order #{log.order_id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Status changed: {log.previous_status} → {log.new_status}
                          </p>
                          {log.change_reason && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Reason: {log.change_reason}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            By {log.user_role} • {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="secondary" className="whitespace-nowrap ml-2">
                          {log.user_role}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagementDashboard;
