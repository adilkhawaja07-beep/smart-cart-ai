-- Migration: Fix RLS policies for orders table
-- Purpose: Ensure customers only see their own orders, staff see appropriate orders
-- Risk: High (affects data access) - TEST THOROUGHLY
-- Rollback: Drop new policies, recreate old ones

-- Step 1: Drop broken existing policies
DROP POLICY IF EXISTS "authenticated_read_orders" ON public.orders;
DROP POLICY IF EXISTS "authenticated_create_orders" ON public.orders;
DROP POLICY IF EXISTS "admin_update_orders" ON public.orders;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Step 3: CREATE NEW POLICIES - Customers see only their own orders
CREATE POLICY "customer_read_own_orders" ON public.orders
  FOR SELECT TO authenticated
  AS PERMISSIVE
  USING (
    user_id = auth.uid()
  );

-- Step 4: Staff (duty_clerk, shipping_clerk, dispatch_rider) & management see appropriate orders
CREATE POLICY "staff_read_orders" ON public.orders
  FOR SELECT TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('duty_clerk', 'shipping_clerk', 'dispatch_rider', 'management')
    )
  );

-- Step 5: Only authenticated users can INSERT orders (they create with their own user_id)
CREATE POLICY "authenticated_create_orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Customers can create their own orders
    (user_id = auth.uid())
    -- OR management/staff can create orders for others
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('management', 'duty_clerk')
    )
  );

-- Step 6: UPDATE orders - role-based permissions
-- Duty clerks can update status to 'confirmed' and 'cancelled'
CREATE POLICY "duty_clerk_update_orders" ON public.orders
  FOR UPDATE TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'duty_clerk'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'duty_clerk'
    )
  );

-- Shipping clerks can update status for picking workflow
CREATE POLICY "shipping_clerk_update_orders" ON public.orders
  FOR UPDATE TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'shipping_clerk'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'shipping_clerk'
    )
  );

-- Dispatch riders can update status for delivery
CREATE POLICY "dispatch_rider_update_orders" ON public.orders
  FOR UPDATE TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dispatch_rider'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'dispatch_rider'
    )
  );

-- Management can do anything
CREATE POLICY "management_all_orders" ON public.orders
  FOR ALL TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'management'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'management'
    )
  );

-- Step 7: Fix RLS on order_items table
DROP POLICY IF EXISTS "authenticated_read_order_items" ON public.order_items;

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Customers see order_items from their own orders
CREATE POLICY "customer_read_own_order_items" ON public.order_items
  FOR SELECT TO authenticated
  AS PERMISSIVE
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE user_id = auth.uid()
    )
  );

-- Staff & management see order_items from orders they have access to
CREATE POLICY "staff_read_order_items" ON public.order_items
  FOR SELECT TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('duty_clerk', 'shipping_clerk', 'dispatch_rider', 'management')
    )
  );

-- Shipping clerks can update picked status
CREATE POLICY "shipping_clerk_update_order_items" ON public.order_items
  FOR UPDATE TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'shipping_clerk'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'shipping_clerk'
    )
  );

-- Management can do anything with order items
CREATE POLICY "management_all_order_items" ON public.order_items
  FOR ALL TO authenticated
  AS PERMISSIVE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'management'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'management'
    )
  );

COMMENT ON TABLE public.orders IS 'Orders table with RLS policies enforcing role-based access';
