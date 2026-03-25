/**
 * Shipping Clerk Dashboard
 * Manage item picking workflow
 * Shipping clerks pick items from warehouse for confirmed orders
 */

import { useState } from 'react';
import { AlertCircle, Check, Package, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderItem } from '@/types/orders';

interface PickingState {
  [orderId: string]: {
    [itemId: number]: boolean; // item picked status
  };
}

export function ShippingClerkDashboard() {
  const { user } = useAuth();
  const { orders, loading, error, stats, refreshOrders } = useOrders({
    status: ['confirmed', 'picking']
  });
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [pickedItems, setPickedItems] = useState<PickingState>({});

  // Filter to show only confirmed/picking orders
  const pickingOrders = orders.filter(o => ['confirmed', 'picking'].includes(o.status));

  /**
   * Toggle item picked status
   */
  function toggleItemPicked(orderId: string, itemIndex: number) {
    setPickedItems(prev => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [itemIndex]: !prev[orderId]?.[itemIndex]
      }
    }));
  }

  /**
   * Check if all items are picked for an order
   */
  function areAllItemsPicked(order: Order): boolean {
    const orderPicked = pickedItems[order.id];
    if (!orderPicked) return false;
    return order.items.every((_, idx) => orderPicked[idx]);
  }

  /**
   * Get picked count for order
   */
  function getPickedCount(order: Order): number {
    return Object.values(pickedItems[order.id] || {}).filter(Boolean).length;
  }

  /**
   * Complete picking for an order
   */
  async function completePicking(order: Order) {
    if (!user) return;

    try {
      setUpdating(true);

      // Update order status to 'picked'
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'picked',
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
          new_status: 'picked',
          changed_by: user.id,
          change_reason: 'All items picked from warehouse',
          user_role: 'shipping_clerk'
        });

      // Clear picked items state for this order
      setPickedItems(prev => {
        const updated = { ...prev };
        delete updated[order.id];
        return updated;
      });

      toast({
        title: 'Success',
        description: 'Order moved to picked status',
      });

      await refreshOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete picking';
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
    <div className="min-h-screen bg-gradient-to-br from-background to-yellow-50/10">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">📦 Warehouse Picking</h1>
            <p className="text-muted-foreground mt-1">Pick items from confirmed orders • Shipping Clerk Dashboard</p>
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
                <div className="text-3xl font-bold text-blue-600">{stats.confirmed}</div>
                <p className="text-sm text-muted-foreground">Ready to Pick</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-yellow-600">{stats.picking}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">{stats.picked}</div>
                <p className="text-sm text-muted-foreground">Picked Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-primary">
                  {stats.confirmed + stats.picking}
                </div>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Picking Queue */}
        {pickingOrders.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No orders to pick</p>
              <p className="text-sm text-muted-foreground mt-2">All orders have been picked</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pickingOrders.map((order) => {
              const pickedCount = getPickedCount(order);
              const allPicked = areAllItemsPicked(order);

              return (
                <Card
                  key={order.id}
                  className={`hover:shadow-lg transition-all ${
                    allPicked ? 'border-green-500 bg-green-50/20' : ''
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
                              order.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                          {allPicked && (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="h-3 w-3 mr-1" />
                              Ready to Ship
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Customer: {order.customer_name}
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

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Picking Progress</span>
                        <span className="font-medium">
                          {pickedCount}/{order.items.length}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${
                              order.items.length > 0
                                ? (pickedCount / order.items.length) * 100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Expanded Items List */}
                    {expandedOrder === order.id && (
                      <>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm font-medium text-muted-foreground mb-3">
                            Items to Pick
                          </p>
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                            >
                              <Checkbox
                                checked={pickedItems[order.id]?.[idx] || false}
                                onCheckedChange={() =>
                                  toggleItemPicked(order.id, idx)
                                }
                                id={`item-${order.id}-${idx}`}
                              />
                              <label
                                htmlFor={`item-${order.id}-${idx}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex justify-between">
                                  <span className="font-medium">
                                    {item.product_name}
                                  </span>
                                  <span className="text-muted-foreground">
                                    Qty: {item.quantity}
                                  </span>
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Complete Picking Button */}
                        {allPicked && (
                          <Button
                            className="w-full gap-2 bg-green-600 hover:bg-green-700"
                            onClick={() => completePicking(order)}
                            disabled={updating}
                          >
                            <Check className="h-4 w-4" />
                            Complete Picking
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ShippingClerkDashboard;
