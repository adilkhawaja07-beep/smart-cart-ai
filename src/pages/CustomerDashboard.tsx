/**
 * Customer Dashboard
 * Shows customer's order history with real-time tracking
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import OrderTimeline from '@/components/OrderTimeline';
import { Loader2 } from 'lucide-react';

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  picking: 'bg-yellow-100 text-yellow-800',
  picked: 'bg-yellow-200 text-yellow-900',
  in_transit: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function CustomerDashboard() {
  const { orders, loading, error, stats, filteredOrders, applyFilters, refreshOrders } = useOrders();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const handleFilterChange = () => {
    applyFilters({
      status: selectedStatus === 'all' 
        ? undefined 
        : [selectedStatus as any],
      searchTerm: searchTerm || undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground">📦 My Orders</h1>
              <p className="text-muted-foreground mt-1">Track your orders and delivery • Customer Dashboard</p>
            </div>
            <Link to="/shop">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Place Order
              </Button>
            </Link>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-primary">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.picking + stats.picked}</div>
                <p className="text-sm text-muted-foreground">Being Prepared</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-orange-600">{stats.in_transit}</div>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onBlur={handleFilterChange}
                />
              </div>
              <Select value={selectedStatus} onValueChange={(val) => {
                setSelectedStatus(val);
                setTimeout(handleFilterChange, 0);
              }}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="picking">Picking</SelectItem>
                  <SelectItem value="picked">Picked</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="gap-2"
                onClick={refreshOrders}
              >
                <Filter className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg">No orders found</p>
                <Link to="/shop">
                  <Button variant="link">Start shopping now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <CardContent className="pt-6">
                  {/* Order Header */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">Order #{order.id.slice(0, 8).toUpperCase()}</h3>
                        <Badge className={`${statusColors[order.status as keyof typeof statusColors]}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p className="font-medium text-foreground">{order.customer_name}</p>
                          <p>{order.customer_email}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Delivery Address</p>
                          <p>{order.delivery_address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="text-right space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        ${order.total.toFixed(2)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Expand Icon */}
                    <ChevronRight
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedOrder === order.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {/* Expanded Details */}
                  {expandedOrder === order.id && (
                    <div className="mt-6 border-t pt-6 space-y-6">
                      {/* Timeline */}
                      <div>
                        <h4 className="font-semibold mb-4">Delivery Timeline</h4>
                        <OrderTimeline
                          currentStatus={order.status}
                          createdAt={order.created_at}
                        />
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-semibold mb-3">Order Items</h4>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm py-2 px-3 bg-muted/50 rounded">
                              <div>
                                <p className="font-medium">{item.product_name}</p>
                                <p className="text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">${item.total.toFixed(2)}</p>
                                <p className="text-muted-foreground">${item.unit_price.toFixed(2)} each</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span>${order.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Delivery Fee</span>
                          <span>${order.delivery_fee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">${order.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {order.status === 'pending' && (
                        <Button variant="outline" className="w-full">
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDashboard;
