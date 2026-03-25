/**
 * Duty Clerk Dashboard
 * Manage order confirmation workflow
 * Duty clerks receive orders and confirm them to proceed to picking
 */

import { useState } from 'react';
import { AlertCircle, Check, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useOrders } from '@/hooks/useOrders';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderAction {
  orderId: string;
  action: 'confirm' | 'cancel';
  reason?: string;
}

export function DutyClerkDashboard() {
  const { user } = useAuth();
  const { orders, loading, error, stats, refreshOrders } = useOrders({
    status: ['pending']
  });
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');

  // Filter to show only pending orders
  const pendingOrders = orders.filter(o => o.status === 'pending');

  /**
   * Handle order confirmation or cancellation
   */
  async function handleOrderAction() {
    if (!selectedOrder || !actionType || !user) return;

    try {
      setUpdating(true);

      const newStatus = actionType === 'confirm' ? 'confirmed' : 'cancelled';

      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
          status_changed_at: new Date().toISOString()
        })
        .eq('id', selectedOrder);

      if (updateError) throw updateError;

      // Log the change manually (or it will be auto-logged by trigger)
      await supabase
        .from('order_audit_log')
        .insert({
          order_id: selectedOrder,
          previous_status: 'pending',
          new_status: newStatus,
          changed_by: user.id,
          change_reason: reason || undefined,
          user_role: 'duty_clerk'
        });

      toast({
        title: 'Success',
        description: `Order ${actionType === 'confirm' ? 'confirmed' : 'cancelled'} successfully`,
      });

      setSelectedOrder(null);
      setActionType(null);
      setReason('');
      await refreshOrders();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update order';
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
            <h1 className="text-4xl font-bold text-foreground">✅ Order Confirmation</h1>
            <p className="text-muted-foreground mt-1">Confirm pending orders and manage queue • Duty Clerk Dashboard</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-red-600">{stats.pending}</div>
                <p className="text-sm text-muted-foreground">Pending Confirmation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-blue-600">{stats.confirmed}</div>
                <p className="text-sm text-muted-foreground">Confirmed Today</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders Queue */}
        {pendingOrders.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No pending orders</p>
              <p className="text-sm text-muted-foreground mt-2">All orders have been reviewed</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  {/* Order Info */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Customer Info */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Customer</p>
                        <p className="font-medium">{order.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                        {order.customer_phone && (
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        )}
                      </div>

                      {/* Delivery Info */}
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Delivery Address</p>
                        <p className="text-sm">{order.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Items ({order.items.length})</p>
                    <div className="space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.product_name} x {item.quantity}</span>
                          <span className="font-medium">${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-2 pt-2 flex justify-between font-semibold">
                      <span>Total Order Value</span>
                      <span className="text-primary">${order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedOrder(order.id);
                        setActionType('confirm');
                      }}
                      disabled={updating || selectedOrder === order.id}
                    >
                      <Check className="h-4 w-4" />
                      Confirm Order
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSelectedOrder(order.id);
                        setActionType('cancel');
                      }}
                      disabled={updating || selectedOrder === order.id}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={selectedOrder !== null} onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setActionType(null);
            setReason('');
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === 'confirm' ? 'Confirm Order' : 'Cancel Order'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Order #{selectedOrder?.slice(0, 8).toUpperCase()}
              </p>

              {actionType === 'cancel' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for cancellation</label>
                  <Textarea
                    placeholder="Explain why you're cancelling this order..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {actionType === 'confirm' && (
                <p className="text-sm text-muted-foreground">
                  Confirming this order will move it to the picking queue for the shipping team.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Cancel
              </Button>
              <Button
                className={actionType === 'cancel' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={handleOrderAction}
                disabled={updating}
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  actionType === 'confirm' ? 'Confirm Order' : 'Cancel Order'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default DutyClerkDashboard;
