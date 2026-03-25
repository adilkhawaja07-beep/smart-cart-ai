/**
 * Hook to fetch and manage orders
 * Filters by role: customers see their own, staff see assigned/all
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderFilters, OrderStats } from '@/types/orders';

interface UseOrdersReturn {
  orders: Order[];
  loading: boolean;
  error: string | null;
  stats: OrderStats | null;
  filteredOrders: Order[];
  applyFilters: (filters: OrderFilters) => void;
  refreshOrders: () => Promise<void>;
}

export function useOrders(filters?: OrderFilters): UseOrdersReturn {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [displayFilters, setDisplayFilters] = useState<OrderFilters>(filters || {});

  /**
   * Fetch orders based on user role
   */
  const fetchOrders = async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('orders').select('*');

      // Filter by role
      if (role === 'customer') {
        // Customers see only their own orders (enforced by RLS)
        query = query.eq('user_id', user.id);
      } else if (['duty_clerk', 'shipping_clerk', 'dispatch_rider'].includes(role || '')) {
        // Staff see orders in their queue (enforced by RLS)
        // All orders are visible to them
      } else if (role === 'management') {
        // Management sees all orders (enforced by RLS)
      }

      // Apply additional filters
      if (displayFilters.status && displayFilters.status.length > 0) {
        query = query.in('status', displayFilters.status);
      }

      const { data, error: queryError } = await query.order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      // Transform data - parse items from JSON if needed
      const transformedOrders: Order[] = (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));

      setOrders(transformedOrders);

      // Calculate stats
      calculateStats(transformedOrders);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders';
      console.error('Error fetching orders:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculate order statistics
   */
  function calculateStats(orderList: Order[]) {
    const stats: OrderStats = {
      total: orderList.length,
      pending: 0,
      confirmed: 0,
      picking: 0,
      picked: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
      averageValue: 0,
      totalRevenue: 0
    };

    let totalRevenue = 0;

    orderList.forEach(order => {
      stats[order.status] = (stats[order.status] || 0) + 1;
      totalRevenue += order.total;
    });

    stats.totalRevenue = totalRevenue;
    stats.averageValue = orderList.length > 0 ? totalRevenue / orderList.length : 0;

    setStats(stats);
  }

  /**
   * Apply filters to orders
   */
  const applyFilters = (newFilters: OrderFilters) => {
    setDisplayFilters(newFilters);
  };

  /**
   * Get filtered orders
   */
  const getFilteredOrders = (): Order[] => {
    let filtered = [...orders];

    if (displayFilters.searchTerm) {
      const term = displayFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        order =>
          order.customer_name.toLowerCase().includes(term) ||
          order.customer_email.toLowerCase().includes(term) ||
          order.id.toLowerCase().includes(term)
      );
    }

    if (displayFilters.dateRange) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        const start = new Date(displayFilters.dateRange!.start);
        const end = new Date(displayFilters.dateRange!.end);
        return orderDate >= start && orderDate <= end;
      });
    }

    return filtered;
  };

  // Fetch on mount and role change
  useEffect(() => {
    if (user && role) {
      fetchOrders();
    }
  }, [user, role]);

  // Refresh on filter changes
  useEffect(() => {
    if (orders.length > 0) {
      calculateStats(getFilteredOrders());
    }
  }, [displayFilters]);

  return {
    orders,
    loading,
    error,
    stats,
    filteredOrders: getFilteredOrders(),
    applyFilters,
    refreshOrders: fetchOrders
  };
}

export default useOrders;
