-- Migration: Create order audit log and tracking
-- Purpose: Track all order status changes for compliance and debugging
-- Risk: Low (new tables)
-- Rollback: DROP TABLE order_audit_log, DROP FUNCTION log_order_status_change, DROP TRIGGER

-- Step 1: Create order_audit_log table
CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  changed_by_role public.user_role,
  change_type TEXT NOT NULL,
  previous_status public.order_status,
  new_status public.order_status,
  change_reason TEXT,
  metadata JSONB,
  changed_at TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Step 2: Create indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_order_id ON public.order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON public.order_audit_log(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_changed_by ON public.order_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_change_type ON public.order_audit_log(change_type);

-- Step 3: Enable RLS on audit log (management only)
ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policy: Only management can read audit logs
CREATE POLICY IF NOT EXISTS "management_read_audit_log" ON public.order_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'management'
    )
  );

-- Step 4: Create function to log order status changes (automatically called via trigger)
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
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
      COALESCE(
        (SELECT role FROM public.user_roles WHERE user_id = NEW.updated_by),
        'customer'
      ),
      'status_change',
      OLD.status,
      NEW.status,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger to automatically log status changes
DROP TRIGGER IF EXISTS trigger_log_order_status ON public.orders;
CREATE TRIGGER trigger_log_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.log_order_status_change();

-- Step 6: Create function to insert manual audit logs
CREATE OR REPLACE FUNCTION public.log_order_change(
  p_order_id UUID,
  p_change_type TEXT,
  p_change_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.order_audit_log (
    order_id,
    changed_by,
    change_type,
    change_reason,
    metadata,
    changed_at
  ) VALUES (
    p_order_id,
    auth.uid(),
    p_change_type,
    p_change_reason,
    p_metadata,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Add comments
COMMENT ON TABLE public.order_audit_log IS 'Audit trail for all order changes - required for compliance';
COMMENT ON COLUMN public.order_audit_log.change_type IS 'Type of change: status_change, assignment, note, etc.';
COMMENT ON COLUMN public.order_audit_log.changed_by_role IS 'Role of user who made the change';
COMMENT ON FUNCTION public.log_order_status_change() IS 'Automatically log when order status changes';
