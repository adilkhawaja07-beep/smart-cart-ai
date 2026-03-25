-- Migration: Create user roles enum and table
-- Purpose: Support 5 distinct user roles for RBAC
-- Risk: Low (new structures)
-- Rollback: DROP TABLE user_roles, DROP TYPE user_role

-- Step 1: Create user_role enum type
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM (
    'customer',
    'duty_clerk',
    'shipping_clerk',
    'dispatch_rider',
    'management'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Step 2: Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Step 4: Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for user_roles
-- Drop existing policies first (PostgreSQL doesn't support IF NOT EXISTS with CREATE POLICY)
DROP POLICY IF EXISTS "users_read_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "management_read_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "management_update_roles" ON public.user_roles;
DROP POLICY IF EXISTS "management_insert_roles" ON public.user_roles;

-- Users can read their own role
CREATE POLICY "users_read_own_role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Management can read all roles
CREATE POLICY "management_read_all_roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role = 'management'
    )
  );

-- Only management can update roles
CREATE POLICY "management_update_roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role = 'management'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role = 'management'
    )
  );

-- Only management can insert roles
CREATE POLICY "management_insert_roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur2
      WHERE ur2.user_id = auth.uid() AND ur2.role = 'management'
    )
  );

-- Step 6: Create function to get user role (for use in RLS policies)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS public.user_role AS $$
  SELECT COALESCE(role, 'customer')
  FROM public.user_roles
  WHERE user_id = $1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Step 7: Create function to check if user has role
CREATE OR REPLACE FUNCTION public.user_has_role(user_id UUID, required_role public.user_role)
RETURNS BOOLEAN AS $$
  SELECT COALESCE(role = required_role, FALSE)
  FROM public.user_roles
  WHERE user_id = $1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Step 8: Create function to check multiple roles (OR condition)
CREATE OR REPLACE FUNCTION public.user_has_any_role(user_id UUID, required_roles public.user_role[])
RETURNS BOOLEAN AS $$
  SELECT COALESCE(role = ANY(required_roles), FALSE)
  FROM public.user_roles
  WHERE user_id = $1
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Step 9: Create trigger to auto-create customer role on user signup
CREATE OR REPLACE FUNCTION public.create_customer_role_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

create trigger trigger_create_customer_role_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_customer_role_on_signup();

-- Step 10: Add comments
COMMENT ON TABLE public.user_roles IS 'Maps users to their roles for RBAC';
COMMENT ON COLUMN public.user_roles.role IS 'User role: customer, duty_clerk, shipping_clerk, dispatch_rider, management';
