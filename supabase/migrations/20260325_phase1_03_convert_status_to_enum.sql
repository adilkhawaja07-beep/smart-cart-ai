-- Migration: Convert order status to ENUM type
-- Purpose: Ensure only valid status values, better data integrity
-- Risk: Medium (changes column type)
-- Rollback: ALTER COLUMN status TYPE TEXT, DROP TYPE order_status

-- Step 1: Create order_status enum type
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'picking',
    'picked',
    'in_transit',
    'delivered',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Validate all current status values are valid
-- List any invalid statuses that need fixing
SELECT DISTINCT status FROM public.orders
WHERE status NOT IN ('pending', 'confirmed', 'picking', 'picked', 'in_transit', 'delivered', 'cancelled')
LIMIT 10;

-- Step 3: Fix any invalid statuses to 'pending' (review these manually!)
-- WARNING: Only run if you've reviewed the results above
-- UPDATE public.orders SET status = 'pending' 
-- WHERE status NOT IN ('pending', 'confirmed', 'picking', 'picked', 'in_transit', 'delivered', 'cancelled');

-- Step 4: Use a temporary column approach for safe migration
ALTER TABLE public.orders
  ADD COLUMN status_new public.order_status;

-- Step 5: Copy and convert data
UPDATE public.orders
SET status_new = status::public.order_status;

-- Step 6: Drop old column and rename
ALTER TABLE public.orders
  DROP COLUMN status;

ALTER TABLE public.orders
  RENAME COLUMN status_new TO status;

-- Step 7: Set default value
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending'::public.order_status;

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Step 9: Create comment
COMMENT ON COLUMN public.orders.status IS 'Order status: pending, confirmed, picking, picked, in_transit, delivered, cancelled';
