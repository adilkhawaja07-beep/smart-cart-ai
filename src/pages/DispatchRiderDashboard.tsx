/**
 * Dispatch Rider Dashboard
 * Manage delivery tracking and proof of delivery
 * Dispatch riders take picked orders and deliver to customers
 */

import { useState } from 'react';
import { Truck, MapPin, Phone, Mail, Check, Navigation, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/orders';
import { OrderTimeline } from '@/components/OrderTimeline';

interface DeliveryState {
  [orderId: string]: {
    startedAt?: string;
    currentLocation?: string;
  };
}

export function DispatchRiderDashboard() {
  const { user } = useAuth();
  const { orders, loading, error, stats, refreshOrders } = useOrders({
    status: ['picked', 'in_transit', 'delivered']
  });
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [deliveryState, setDeliveryState] = useState<DeliveryState>({});

  // Filter to show only picked/in_transit orders
  const deliveryOrders = orders.filter(o => ['picked', 'in_transit'].includes(o.status));
  const completedDeliveries = orders.filter(o => o.status === 'delivered');

  /**
   * Start delivery for an order
   */
  async function startDelivery(order: Order) {
    if (!user) return;

    try {
      setUpdating(true);

      // Update order status to 'in_transit'
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'in_transit',
          updated_at: new Date().toISOString(),
          updated_by: user.id,
          status_changed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Log the change
      await supabase
        .from('order_audit_log')
        .insert({
          order_id: order.id,
          previous_status: order.status,
          new_status: 'in_transit',
          changed_by: user.id,
          change_reason: 'Delivery started',
          user_role: 'dispatch_rider'
        });

      // Update delivery state
      setDeliveryState(prev => ({
        ...prev,
        [order.id]: {
          ...prev[order.id],
          startedAt: new Date().toISOString()
        }
      }));

      toast({
        title: 'Success',
        description: 'Delivery started for order',
      });

      await refreshOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start delivery';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  /**
   * Mark order as delivered
   */
  async function markDelivered(order: Order) {
    if (!user) return;

    try {
      setUpdating(true);

      // Update order status to 'delivered'
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          updated_at: new Date().toISOString(),
          updated_by: user.id,
          status_changed_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Log the change
      await supabase
        .from('order_audit_log')
        .insert({
          order_id: order.id,
          previous_status: order.status,
          new_status: 'delivered',
          changed_by: user.id,
          change_reason: 'Order delivered to customer',
          user_role: 'dispatch_rider'
        });

      // Clear delivery state for this order
      setDeliveryState(prev => {
        const updated = { ...prev };
        delete updated[order.id];
        return updated;
      });

      setExpandedOrder(null);

      toast({
        title: 'Success',
        description: 'Order marked as delivered',
      });

      await refreshOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark delivery';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-blue-50/10">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">🚚 Delivery Tracking</h1>
            <p className="text-muted-foreground mt-1">Track and complete customer deliveries • Dispatch Rider Dashboard</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshOrders}
            disabled={updating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 mb-8">
            {error}
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-amber-600">{stats.picked}</div>
                <p className="text-sm text-muted-foreground">Ready to Deliver</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-blue-600">{stats.in_transit}</div>
                <p className="text-sm text-muted-foreground">Out for Delivery</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">{stats.delivered}</div>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-primary">
                  {stats.picked + stats.in_transit}
                </div>
                <p className="text-sm text-muted-foreground">In Your Queue</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Active Deliveries */}
        {deliveryOrders.length === 0 ? (
          <Card className="border-2 border-dashed mb-8">
            <CardContent className="py-16 text-center">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No active deliveries</p>
              <p className="text-sm text-muted-foreground mt-2">All deliveries completed for today</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Active Deliveries</h2>
            <div className="space-y-4 mb-8">
              {deliveryOrders.map((order) => (
                <Card
                  key={order.id}
                  className={`hover:shadow-lg transition-all ${
                    order.status === 'in_transit' ? 'border-blue-500 bg-blue-50/20' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="font-semibold text-lg">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </h3>
                          <Badge
                            className={
                              order.status === 'picked'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }
                          >
                            {order.status === 'picked' ? 'Ready to Deliver' : 'In Transit'}
                          </Badge>
                        </div>
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

                    {/* Customer Info Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Customer</p>
                        <p className="font-semibold">{order.customer_name}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="text-primary hover:underline"
                          >
                            {order.customer_phone}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="text-primary hover:underline"
                          >
                            {order.customer_email}
                          </a>
                        </div>
                      </div>

                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
                        <div className="flex gap-2 mt-2">
                          <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">{order.delivery_address}</p>
                            {order.delivery_notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Notes: {order.delivery_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedOrder === order.id && (
                      <>
                        {/* Order Timeline */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Order Timeline
                          </p>
                          <OrderTimeline
                            currentStatus={order.status}
                            createdAt={order.created_at}
                            confirmedAt={order.confirmed_at}
                            pickedAt={order.picked_at}
                            deliveredAt={order.delivered_at}
                            compact={false}
                          />
                        </div>

                        {/* Items Summary */}
                        <div className="mb-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Items ({order.items.length})
                          </p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between p-2 bg-muted/30 rounded">
                                <span className="font-Medium">{item.product_name}</span>
                                <span className="text-muted-foreground">Qty: {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cost Breakdown */}
                        <div className="bg-muted/30 p-3 rounded-lg mb-4 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span>₹{order.subtotal?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tax (5%):</span>
                            <span>₹{order.tax?.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Delivery Fee:</span>
                            <span>₹{order.delivery_fee?.toFixed(2)}</span>
                          </div>
                          <div className="border-t border-muted pt-1 mt-1 flex justify-between font-semibold">
                            <span>Total:</span>
                            <span>₹{order.total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {order.status === 'picked' && (
                            <Button
                              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                              onClick={() => startDelivery(order)}
                              disabled={updating}
                            >
                              <Navigation className="h-4 w-4" />
                              Start Delivery
                            </Button>
                          )}
                          {order.status === 'in_transit' && (
                            <Button
                              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                              onClick={() => markDelivered(order)}
                              disabled={updating}
                            >
                              <Check className="h-4 w-4" />
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Completed Deliveries */}
        {completedDeliveries.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-4 mt-8">Today's Completed Deliveries</h2>
            <div className="space-y-2">
              {completedDeliveries.map((order) => (
                <Card key={order.id} className="border-green-200 bg-green-50/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer_name} → {order.delivery_address}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          <Check className="h-3 w-3 mr-1" />
                          Delivered
                        </Badge>
                        <span className="text-lg font-semibold">₹{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default DispatchRiderDashboard;
