-- Migration: Create hardcoded admin user
-- Purpose: Set up admin@admin.com with management role and skip email confirmation
-- Manual Step Required: Create auth user via Supabase Dashboard or CLI
--
-- HOW TO CREATE ADMIN USER:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Create user/invite new user"
-- 3. Email: admin@admin.com
-- 4. Password: admin1234
-- 5. Confirm password: admin1234
-- 6. IMPORTANT: Check "Auto confirm user" checkbox ✓
-- 7. Click "Create user"
-- 8. Note the UUID of the created user
-- 9. Run this migration with the UUID substituted
--
-- OR run in Supabase SQL Editor:
-- SELECT auth.create_user(email:='admin@admin.com', password:='admin1234', email_confirmed:=true);
--
-- This file assumes admin user UUID is known and creates the role assignment

-- Step 1: Insert admin role for the hardcoded admin user
-- NOTE: Replace 'ADMIN_UUID_HERE' with actual UUID from step above
-- You can get the UUID by running: SELECT id FROM auth.users WHERE email = 'admin@admin.com';

INSERT INTO public.user_roles (user_id, role)
VALUES ('ADMIN_UUID_HERE', 'management')
ON CONFLICT (user_id) DO UPDATE
SET role = 'management';

-- Step 2: Add comment explaining this entry
COMMENT ON TABLE public.user_roles IS 'Maps users to their roles for RBAC - admin@admin.com is hardcoded management user';

-- Step 3: Verify the admin user was created
-- Run this query to verify: SELECT ur.user_id, ur.role, auth.users.email FROM public.user_roles ur JOIN auth.users ON ur.user_id = auth.users.id WHERE ur.role = 'management';
