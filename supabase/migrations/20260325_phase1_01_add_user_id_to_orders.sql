-- Migration: Add user_id to orders and order_items tables
-- Purpose: Link orders to authenticated users for proper access control
-- Risk: Medium (requires data migration)
-- Rollback: DROP COLUMN user_id FROM orders, order_items

-- Step 1: Add user_id column to orders table (nullable initially for migration)
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Step 2: Add metadata columns for audit trail
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT now();

-- Step 3: Backfill user_id from customer_email (best-effort migration)
-- WARNING: This assumes customer_email matches auth.users.email
UPDATE public.orders o
SET user_id = u.id
FROM auth.users u
WHERE u.email = o.customer_email 
  AND o.user_id IS NULL
  AND o.customer_email IS NOT NULL;

-- Step 4: For orders without matching email, assign to a fallback/system user
-- (You may need to adjust this based on your needs - consider leaving as NULL for manual review)
-- UPDATE public.orders SET user_id = gen_random_uuid() WHERE user_id IS NULL;

-- Step 5: Add user_id to order_items table
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS picked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS picked_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS picked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quality_check JSONB,
  ADD COLUMN IF NOT EXISTS quality_issues TEXT;

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_picked ON public.order_items(picked);

-- Step 7: Add comments for documentation
COMMENT ON COLUMN public.orders.user_id IS 'Foreign key to authenticated user who placed the order';
COMMENT ON COLUMN public.orders.created_by IS 'User ID of admin who created order (if manually created)';
COMMENT ON COLUMN public.orders.updated_by IS 'User ID of staff member who last updated order status';
COMMENT ON COLUMN public.order_items.picked_by IS 'User ID of shipping clerk who picked this item';
