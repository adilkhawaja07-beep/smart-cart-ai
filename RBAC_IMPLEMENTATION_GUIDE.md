# Smart Cart AI - RBAC Implementation Guide
## Technical Specifications & Migration Scripts

---

## 1. SQL Migration Scripts

### 1.1 Create User Roles Enum

```sql
-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM (
  'customer',
  'duty_clerk',
  'shipping_clerk',
  'dispatch_rider',
  'management'
);

-- Create enum for order status (replace TEXT)
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'picking',
  'picked',
  'in_transit',
  'delivered',
  'cancelled'
);

-- Create enum for delivery proof type
CREATE TYPE public.proof_type AS ENUM (
  'photo',
  'signature',
  'none'
);
```

### 1.2 Add User Roles Table

```sql
-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create composite index for fast lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Add RLS to user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "users_read_own_role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'management'));

-- Policy: Only management can update roles
CREATE POLICY "management_update_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'management'))
  WITH CHECK (has_role(auth.uid(), 'management'));

-- Policy: Only management can insert roles
CREATE POLICY "management_insert_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'management'));
```

### 1.3 Update Orders Table

```sql
-- Add user_id FK to orders
ALTER TABLE public.orders
  ADD COLUMN user_id UUID REFERENCES auth.users(id),
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN status_changed_at TIMESTAMPTZ DEFAULT now();

-- Migrate existing orders based on email
UPDATE public.orders
SET user_id = auth.users.id
FROM auth.users
WHERE auth.users.email = orders.customer_email
  AND orders.user_id IS NULL;

-- Make user_id NOT NULL after migration
ALTER TABLE public.orders
  ALTER COLUMN user_id SET NOT NULL;

-- Add indexes
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

-- Update RLS policy for orders
DROP POLICY IF EXISTS "authenticated_read_orders" ON public.orders;

-- New policy: Users see only their orders, admins see all
CREATE POLICY "read_orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'management')
    OR has_role(auth.uid(), 'duty_clerk')
    OR has_role(auth.uid(), 'shipping_clerk')
    OR has_role(auth.uid(), 'dispatch_rider')
  );

-- New policy: Only system and staff can insert (no direct user inserts)
DROP POLICY IF EXISTS "authenticated_create_orders" ON public.orders;
CREATE POLICY "create_orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'management'));

-- New policy: Only authorized roles can update status
DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;
CREATE POLICY "update_order_status" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'management')
    OR has_role(auth.uid(), 'duty_clerk')
    OR has_role(auth.uid(), 'shipping_clerk')
    OR has_role(auth.uid(), 'dispatch_rider')
  )
  WITH CHECK (
    has_role(auth.uid(), 'management')
    OR has_role(auth.uid(), 'duty_clerk')
    OR has_role(auth.uid(), 'shipping_clerk')
    OR has_role(auth.uid(), 'dispatch_rider')
  );
```

### 1.4 Update Order Items Table

```sql
-- Add tracking fields to order_items
ALTER TABLE public.order_items
  ADD COLUMN picked BOOLEAN DEFAULT FALSE,
  ADD COLUMN picked_by UUID REFERENCES auth.users(id),
  ADD COLUMN picked_at TIMESTAMPTZ,
  ADD COLUMN quality_check JSONB,
  ADD COLUMN quality_issues TEXT;

-- Update RLS for order_items
DROP POLICY IF EXISTS "authenticated_read_order_items" ON public.order_items;

CREATE POLICY "read_order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE user_id = auth.uid()
        OR has_role(auth.uid(), 'management')
        OR has_role(auth.uid(), 'duty_clerk')
        OR has_role(auth.uid(), 'shipping_clerk')
        OR (has_role(auth.uid(), 'dispatch_rider') 
            AND status IN ('picked', 'in_transit', 'delivered'))
    )
  );

CREATE POLICY "update_picked_items" ON public.order_items
  FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'shipping_clerk')
    OR has_role(auth.uid(), 'management')
  )
  WITH CHECK (
    has_role(auth.uid(), 'shipping_clerk')
    OR has_role(auth.uid(), 'management')
  );
```

### 1.5 Audit Log Table

```sql
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_by_role public.user_role,
  change_type TEXT NOT NULL, -- 'status_change', 'assignment', 'note'
  previous_status public.order_status,
  new_status public.order_status,
  change_reason TEXT,
  metadata JSONB,
  changed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create indexes for audit queries
CREATE INDEX idx_audit_order_id ON public.order_audit_log(order_id);
CREATE INDEX idx_audit_changed_at ON public.order_audit_log(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON public.order_audit_log(changed_by);

-- RLS for audit log (only management can read)
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "management_read_audit" ON public.order_audit_log
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'management'));

-- Trigger to automatically log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.order_audit_log (
      order_id,
      changed_by,
      changed_by_role,
      change_type,
      previous_status,
      new_status,
      changed_at
    ) VALUES (
      NEW.id,
      NEW.updated_by,
      (SELECT role FROM public.user_roles WHERE user_id = NEW.updated_by),
      'status_change',
      OLD.status,
      NEW.status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();
```

### 1.6 Order Assignments Table

```sql
CREATE TABLE IF NOT EXISTS public.order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_user_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_role public.user_role NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'escalated'
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_assignments_order_id ON public.order_assignments(order_id);
CREATE INDEX idx_assignments_user_id ON public.order_assignments(assigned_user_id);
CREATE INDEX idx_assignments_role ON public.order_assignments(assigned_role);
CREATE INDEX idx_assignments_status ON public.order_assignments(status);

-- RLS for assignments
ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_assignments" ON public.order_assignments
  FOR SELECT TO authenticated
  USING (
    assigned_user_id = auth.uid()
    OR has_role(auth.uid(), 'management')
  );

CREATE POLICY "management_manage_assignments" ON public.order_assignments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'management'))
  WITH CHECK (has_role(auth.uid(), 'management'));
```

### 1.7 Delivery Proof Table

```sql
CREATE TABLE IF NOT EXISTS public.delivery_proof (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES auth.users(id),
  proof_type public.proof_type DEFAULT 'photo',
  proof_url TEXT,
  recipient_name TEXT,
  recipient_signature_url TEXT,
  delivered_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_delivery_proof_order_id ON public.delivery_proof(order_id);
CREATE INDEX idx_delivery_proof_rider_id ON public.delivery_proof(rider_id);

-- RLS for delivery proof
ALTER TABLE public.delivery_proof ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_delivery_proof" ON public.delivery_proof
  FOR SELECT TO authenticated
  USING (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
    OR has_role(auth.uid(), 'management')
    OR rider_id = auth.uid()
  );

CREATE POLICY "riders_submit_proof" ON public.delivery_proof
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'dispatch_rider') AND rider_id = auth.uid());
```

---

## 2. TypeScript Enums & Types

### 2.1 Role Enums

```typescript
// src/types/roles.ts

export enum UserRole {
  CUSTOMER = 'customer',
  DUTY_CLERK = 'duty_clerk',
  SHIPPING_CLERK = 'shipping_clerk',
  DISPATCH_RIDER = 'dispatch_rider',
  MANAGEMENT = 'management',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PICKING = 'picking',
  PICKED = 'picked',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum DeliveryProofType {
  PHOTO = 'photo',
  SIGNATURE = 'signature',
  NONE = 'none',
}

// Valid status transitions by role
export const STATUS_TRANSITIONS: Record<UserRole, OrderStatus[]> = {
  [UserRole.CUSTOMER]: [], // Customers can't change status
  [UserRole.DUTY_CLERK]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [UserRole.SHIPPING_CLERK]: [OrderStatus.PICKING, OrderStatus.PICKED],
  [UserRole.DISPATCH_RIDER]: [OrderStatus.IN_TRANSIT, OrderStatus.DELIVERED],
  [UserRole.MANAGEMENT]: Object.values(OrderStatus), // All transitions
};

// Data visibility rules
export const DATA_VISIBILITY: Record<UserRole, Record<string, boolean>> = {
  [UserRole.CUSTOMER]: {
    'own_orders': true,
    'other_orders': false,
    'pricing': true,
    'cost_price': false,
    'profit_margin': false,
    'customer_email': true,
    'rider_name': true,
    'rider_phone': false, // Until in_transit
  },
  [UserRole.DUTY_CLERK]: {
    'own_orders': false,
    'other_orders': false,
    'pending_orders': true,
    'pricing': true,
    'cost_price': true,
    'profit_margin': false,
    'inventory': true,
    'rider_name': false,
  },
  // ... etc for other roles
};
```

### 2.2 Type Definitions

```typescript
// src/types/models.ts

import { UserRole, OrderStatus } from './roles';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string | null;
  address: string;
  city: string;
  zip_code: string;
  subtotal: number;
  delivery_fee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  created_by: string | null;
  updated_at: string;
  updated_by: string | null;
  status_changed_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  picked: boolean;
  picked_by: string | null;
  picked_at: string | null;
  quality_check: Record<string, any> | null;
  quality_issues: string | null;
}

export interface OrderAuditLog {
  id: string;
  order_id: string;
  changed_by: string;
  changed_by_role: UserRole;
  change_type: 'status_change' | 'assignment' | 'note';
  previous_status: OrderStatus | null;
  new_status: OrderStatus | null;
  change_reason: string | null;
  metadata: Record<string, any> | null;
  changed_at: string;
}

export interface OrderAssignment {
  id: string;
  order_id: string;
  assigned_user_id: string;
  assigned_role: UserRole;
  assigned_at: string;
  completed_at: string | null;
  status: 'pending' | 'in_progress' | 'completed' | 'escalated';
  notes: string | null;
}

export interface DeliveryProof {
  id: string;
  order_id: string;
  rider_id: string;
  proof_type: DeliveryProofType;
  proof_url: string | null;
  recipient_name: string | null;
  recipient_signature_url: string | null;
  delivered_at: string;
  notes: string | null;
}
```

---

## 3. API Service Functions

### 3.1 Order Status Update (With Validation & Audit)

```typescript
// src/lib/services/orderService.ts

import { supabase } from '@/integrations/supabase/client';
import { OrderStatus, STATUS_TRANSITIONS, UserRole } from '@/types/roles';
import type { Order, OrderAuditLog } from '@/types/models';

export class OrderService {
  /**
   * Update order status with validation and audit logging
   */
  static async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Get user role
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError || !userRole) throw new Error('User role not found');

      const currentRole = userRole.role as UserRole;

      // Get current order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) throw new Error('Order not found');

      const currentStatus = order.status as OrderStatus;

      // Validate status transition for this role
      const allowedTransitions = STATUS_TRANSITIONS[currentRole];
      if (!allowedTransitions.includes(newStatus)) {
        return {
          success: false,
          error: `Role ${currentRole} cannot change status to ${newStatus}`,
        };
      }

      // Validate logical transition
      const validNextStatuses = this.getValidNextStatuses(currentStatus);
      if (!validNextStatuses.includes(newStatus)) {
        return {
          success: false,
          error: `Cannot transition from ${currentStatus} to ${newStatus}`,
        };
      }

      // Update order
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
          status_changed_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Audit log is created automatically via trigger

      return { success: true };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update order status',
      };
    }
  }

  /**
   * Get valid next statuses for current status
   */
  static getValidNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PICKING, OrderStatus.CANCELLED],
      [OrderStatus.PICKING]: [OrderStatus.PICKED],
      [OrderStatus.PICKED]: [OrderStatus.IN_TRANSIT],
      [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };
    return transitions[currentStatus] || [];
  }

  /**
   * Assign order to a staff member
   */
  static async assignOrder(
    orderId: string,
    userId: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      // Only management can assign
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (userRole?.role !== UserRole.MANAGEMENT) {
        return {
          success: false,
          error: 'Only management can assign orders',
        };
      }

      const { error } = await supabase
        .from('order_assignments')
        .insert({
          order_id: orderId,
          assigned_user_id: userId,
          assigned_role: role,
          created_by: user.id,
        });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to assign order',
      };
    }
  }

  /**
   * Get orders for current user based on their role
   */
  static async getOrdersForUser(): Promise<Order[]> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Not authenticated');

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!userRole) throw new Error('User role not found');

      let query = supabase.from('orders').select('*');

      if (userRole.role === UserRole.CUSTOMER) {
        // Customers see only their orders
        query = query.eq('user_id', user.id);
      } else if (userRole.role === UserRole.DUTY_CLERK) {
        // Duty clerks see pending orders
        query = query.eq('status', OrderStatus.PENDING);
      } else if (userRole.role === UserRole.SHIPPING_CLERK) {
        // Shipping clerks see confirmed & picking orders
        query = query.in('status', [OrderStatus.CONFIRMED, OrderStatus.PICKING]);
      } else if (userRole.role === UserRole.DISPATCH_RIDER) {
        // Riders see picked & in_transit orders assigned to them
        const { data: assignments } = await supabase
          .from('order_assignments')
          .select('order_id')
          .eq('assigned_user_id', user.id)
          .eq('assigned_role', UserRole.DISPATCH_RIDER);

        const orderIds = assignments?.map((a) => a.order_id) || [];
        query = query.in('id', orderIds);
      }
      // Management sees all orders (default)

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }
}
```

### 3.2 Role-Based Authorization Hook

```typescript
// src/hooks/useAuthorization.ts

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserRole, DATA_VISIBILITY } from '@/types/roles';

export function useAuthorization() {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          setUserRole(null);
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(UserRole.CUSTOMER);
        } else {
          setUserRole((data?.role || UserRole.CUSTOMER) as UserRole);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!userRole) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(userRole);
  };

  /**
   * Check if user can see a specific piece of data
   */
  const canSeeData = (dataKey: string): boolean => {
    if (!userRole) return false;
    const visibility = DATA_VISIBILITY[userRole];
    return visibility?.[dataKey] ?? false;
  };

  /**
   * Check if user can view a specific order
   */
  const canViewOrder = (orderUserId: string): boolean => {
    if (!userRole || !userId) return false;
    // Customers can only see their own
    if (userRole === UserRole.CUSTOMER) return userId === orderUserId;
    // Staff and management can see all (with RLS filtering)
    return [
      UserRole.DUTY_CLERK,
      UserRole.SHIPPING_CLERK,
      UserRole.DISPATCH_RIDER,
      UserRole.MANAGEMENT,
    ].includes(userRole);
  };

  return {
    loading,
    userRole,
    userId,
    hasRole,
    canSeeData,
    canViewOrder,
  };
}
```

---

## 4. Protected Route Component

```typescript
// src/components/RoleProtectedRoute.tsx

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthorization } from '@/hooks/useAuthorization';
import { UserRole } from '@/types/roles';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole | UserRole[];
  fallback?: ReactNode;
}

export function RoleProtectedRoute({
  children,
  allowedRoles,
  fallback = <Navigate to="/" replace />,
}: RoleProtectedRouteProps) {
  const { loading, hasRole } = useAuthorization();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole(allowedRoles)) {
    return fallback as JSX.Element;
  }

  return children as JSX.Element;
}
```

---

## 5. Role-Based Navigation Routes

```typescript
// src/routes.tsx

import { UserRole } from '@/types/roles';
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';

// Customer routes
<Route path="/my-orders" element={
  <RoleProtectedRoute allowedRoles={UserRole.CUSTOMER}>
    <MyOrdersPage />
  </RoleProtectedRoute>
} />

// Duty Clerk routes
<Route path="/dashboard/duty-clerk" element={
  <RoleProtectedRoute allowedRoles={UserRole.DUTY_CLERK}>
    <DutyClerkDashboard />
  </RoleProtectedRoute>
} />

// Shipping Clerk routes
<Route path="/dashboard/shipping" element={
  <RoleProtectedRoute allowedRoles={UserRole.SHIPPING_CLERK}>
    <ShippingClerkDashboard />
  </RoleProtectedRoute>
} />

// Dispatch Rider routes
<Route path="/dashboard/dispatch" element={
  <RoleProtectedRoute allowedRoles={UserRole.DISPATCH_RIDER}>
    <DispatchRiderDashboard />
  </RoleProtectedRoute>
} />

// Management routes
<Route path="/dashboard/management" element={
  <RoleProtectedRoute allowedRoles={UserRole.MANAGEMENT}>
    <ManagementDashboard />
  </RoleProtectedRoute>
} />
```

---

## 6. Testing Checklist

- [ ] Customer can only see their own orders
- [ ] Duty clerk can only see pending orders
- [ ] Shipping clerk can only see confirmed & picking orders
- [ ] Dispatch rider can only see assigned orders
- [ ] Invalid status transitions are rejected
- [ ] Unauthorized roles cannot update order status
- [ ] Audit log captures all status changes
- [ ] Order assignments are created correctly
- [ ] Delivery proof is submitted only by riders
- [ ] All RLS policies are enforced
- [ ] Performance: queries with RLS < 200ms
- [ ] No N+1 query problems in dashboards

---

## 7. Deployment Checklist

Before deploying these changes to production:

- [ ] Back up production database
- [ ] Test migrations on staging environment
- [ ] Verify RLS policies block unauthorized access
- [ ] Load test with concurrent users
- [ ] Test each role workflow end-to-end
- [ ] Verify email notifications trigger correctly
- [ ] Monitor Supabase logs for RLS violations
- [ ] Document new APIs for frontend team
- [ ] Create admin guide for role management
- [ ] Set up alerting for failed status transitions
- [ ] Schedule team training on new role features

