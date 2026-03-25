/**
 * Order-related types and interfaces
 */

/**
 * Order status enum - matches database order_status type
 */
export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'picking'
  | 'picked'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';

/**
 * Order item in cart/order
 */
export interface OrderItem {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  picked?: boolean;
  picked_by?: string;
  picked_at?: string;
  quality_check?: boolean;
  quality_issues?: string;
}

/**
 * Order details
 */
export interface Order {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string;
  customer_phone?: string;
  delivery_address: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
  status_changed_at?: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Order with audit information
 */
export interface OrderWithAudit extends Order {
  audit_log?: OrderAuditLog[];
}

/**
 * Audit log entry for order changes
 */
export interface OrderAuditLog {
  id: string;
  order_id: string;
  previous_status?: OrderStatus;
  new_status: OrderStatus;
  changed_by: string;
  changed_at: string;
  change_reason?: string;
  user_role?: string;
}

/**
 * Order filter options
 */
export interface OrderFilters {
  status?: OrderStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

/**
 * Order statistics
 */
export interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  picking: number;
  picked: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
  averageValue: number;
  totalRevenue: number;
}
