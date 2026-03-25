# Phase 1 Critical Fixes - Deployment Guide

**Status**: Ready for deployment  
**Risk Level**: 🟠 MEDIUM (database schema changes)  
**Estimated time**: 15-30 minutes  
**Backup Required**: YES ✅  

---

## Pre-Deployment Checklist

### Before You Deploy:
- [ ] Back up production database
- [ ] Switch to staging environment first
- [ ] Test migrations on staging for 24 hours
- [ ] Review all 5 migration files below
- [ ] Have rollback procedure ready
- [ ] Notify stakeholders
- [ ] Schedule during low-traffic hours

---

## Migration Files (Execute in Order)

### 1️⃣ `20260325_phase1_01_add_user_id_to_orders.sql`
**What it does**:
- Adds `user_id` FK to orders & order_items
- Adds audit columns (created_by, updated_by, updated_at)
- Backfills existing orders from customer_email → user_id
- Creates performance indexes

**Expected output**: 
```
ALTER TABLE
UPDATE X rows
CREATE INDEX
```

**Rollback**: `ALTER TABLE orders DROP COLUMN user_id;`

---

### 2️⃣ `20260325_phase1_02_create_user_roles.sql`
**What it does**:
- Creates `user_role` enum (5 roles)
- Creates `user_roles` table
- Creates RLS policies for role management
- Creates helper functions for role checking
- Creates trigger to auto-assign customer role

**Expected output**:
```
CREATE TYPE
CREATE TABLE
CREATE INDEX
CREATE POLICY
CREATE FUNCTION
CREATE TRIGGER
```

**Rollback**: `DROP TABLE user_roles; DROP TYPE user_role;`

---

### 3️⃣ `20260325_phase1_03_convert_status_to_enum.sql`
**What it does**:
- Creates `order_status` enum (7 statuses)
- Safely migrates status column from TEXT to ENUM
- Validates all current values are valid

**Expected output**:
```
CREATE TYPE
ALTER TABLE
UPDATE X rows
CREATE INDEX
```

**Rollback**: `ALTER TABLE orders ALTER COLUMN status TYPE TEXT;`

---

### 4️⃣ `20260325_phase1_04_create_audit_log.sql`
**What it does**:
- Creates `order_audit_log` table
- Creates trigger to auto-log status changes
- Creates helper functions for manual audit logging
- Enables audit log RLS

**Expected output**:
```
CREATE TABLE
CREATE INDEX
CREATE POLICY
CREATE FUNCTION
CREATE TRIGGER
```

**Rollback**: `DROP TABLE order_audit_log; DROP FUNCTION log_order_status_change;`

---

### 5️⃣ `20260325_phase1_05_fix_rls_policies.sql`
**What it does**:
- 🔴 FIXES CRITICAL SECURITY ISSUE: Drops broken RLS policies
- Implements proper role-based access control
- Customers only see their own orders
- Staff see orders in their queue
- Management sees all orders

**Expected output**:
```
DROP POLICY
CREATE POLICY (×8)
```

**Rollback**: Manual restoration of old policies

---

## Deployment Steps

### Step 1: Prepare
```bash
# Backup database first (ask your Supabase project owner)
# Go to Supabase Dashboard → Project Settings → Database

# Download backup to local
# Verify backup exists
```

### Step 2: Execute Migrations in Supabase

**Option A: Using Supabase Dashboard (recommended for first test)**
1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Copy contents of migration file #1
4. Execute and wait for success
5. Repeat for files #2, #3, #4, #5

**Option B: Using CLI (faster)**
```bash
cd supabase

# Make sure you're connected to right project
supabase projects list

# Push migrations
supabase db push

# Run migrations
supabase db pull  # to sync local schema
```

### Step 3: Verify Each Migration

```bash
# After each migration, verify success:
# Go to Supabase → Table Editor and check:

# ✅ Migration 1 verification:
# - orders table has: user_id, created_by, updated_by, updated_at
# - order_items table has: picked, picked_by, picked_at, quality_check
# - Indexes exist: idx_orders_user_id, idx_orders_status

# ✅ Migration 2 verification:
# - user_roles table exists
# - user_role enum exists with 5 values
# - user_roles has sample rows

# ✅ Migration 3 verification:
# - orders.status is ENUM type (not TEXT)
# - All status values are valid: pending, confirmed, etc.

# ✅ Migration 4 verification:
# - order_audit_log table exists
# - Indexes exist: idx_audit_order_id, idx_audit_changed_at

# ✅ Migration 5 verification:
# - RLS policies are active
# - Try querying as different roles (if possible)
```

---

## Testing After Deployment

### Test 1: User Identity
```sql
-- Verify user_id is set correctly
SELECT id, customer_email, user_id FROM orders LIMIT 5;

-- Result should show user_id filled for existing orders
-- If user_id is NULL, run migration 1 again with adjusted backfill logic
```

### Test 2: Role Assignment
```sql
-- Verify user_roles table populated for admin
SELECT user_id, role FROM user_roles WHERE role = 'management' LIMIT 5;

-- Result should show at least 1 management user
-- If empty, manually insert your admin user:
INSERT INTO user_roles (user_id, role) 
VALUES ('YOUR_ADMIN_USER_ID', 'management');
```

### Test 3: RLS Policies (SQL Editor)
```sql
-- Login as customer user in browser
-- Run this in Supabase SQL Editor:
SELECT id, customer_name, user_id FROM orders;

-- Expected: Only see orders where user_id = auth.uid()
-- If you see all orders: RLS policy not working!
```

### Test 4: Status ENUM
```sql
-- Try inserting invalid status (should fail)
UPDATE orders SET status = 'invalid_status' WHERE id = 'test_id';

-- Expected error: invalid_status is not a valid order_status
-- If it succeeds: ENUM not working!
```

### Test 5: Audit Log
```sql
-- Make a status change
UPDATE orders SET status = 'confirmed', updated_by = auth.uid() 
WHERE id = 'some_order_id';

-- Verify it was logged
SELECT * FROM order_audit_log ORDER BY changed_at DESC LIMIT 1;

-- Expected: See the status change recorded with timestamp
```

---

## Troubleshooting

### ❌ Error: "user_id column already exists"
**Cause**: Migration partially applied before  
**Fix**: Drop and re-run from migration 1
```sql
ALTER TABLE orders DROP COLUMN user_id;
-- Then re-run migration file 1
```

### ❌ Error: "duplicate key value violates unique constraint"
**Cause**: Multiple orders from same email address  
**Fix**: Check the data and manually assign user_ids
```sql
-- Check duplicates
SELECT customer_email, COUNT(*) FROM orders 
GROUP BY customer_email HAVING COUNT(*) > 1;

-- Manually fix if needed
UPDATE orders SET user_id = 'specific_user_id' WHERE customer_email = 'email@example.com';
```

### ❌ Error: "status has invalid type"
**Cause**: Invalid status value exists in database  
**Fix**: Find and fix invalid statuses before migration
```sql
-- Find invalid statuses
SELECT DISTINCT status FROM orders 
WHERE status NOT IN ('pending', 'confirmed', 'picking', 'picked', 'in_transit', 'delivered', 'cancelled');

-- Fix them
UPDATE orders SET status = 'pending' WHERE status NOT IN (...);
```

### ❌ Error: "RLS policies blocking access"
**Cause**: Policies too strict after deployment  
**Fix**: Temporarily disable RLS for testing
```sql
-- Check if RLS enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'orders';

-- If need to disable temporarily
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- But RE-ENABLE after testing!
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

---

## Rollback Plan

### If Something Breaks:
```bash
# Option 1: Restore from backup
# Go to Supabase Dashboard → Database → Backups
# Click "Restore" on most recent backup

# Option 2: Manual rollback
# Order of execution (REVERSE order):

# Step 5: Rollback RLS
# (Complex - recommend backup restore instead)

# Step 4: Rollback Audit Log
DROP TRIGGER IF EXISTS trigger_log_order_status ON orders;
DROP FUNCTION IF EXISTS log_order_status_change;
DROP TABLE IF EXISTS order_audit_log;

# Step 3: Rollback Status ENUM
ALTER TABLE orders ALTER COLUMN status TYPE TEXT;
DROP TYPE IF EXISTS order_status;

# Step 2: Rollback Roles
DROP TABLE IF EXISTS user_roles;
DROP FUNCTION IF EXISTS create_customer_role_on_signup;
DROP TRIGGER IF EXISTS trigger_create_customer_role_on_signup ON auth.users;
DROP TYPE IF EXISTS user_role;

# Step 1: Rollback user_id
ALTER TABLE order_items DROP COLUMN IF EXISTS picked, 
  DROP COLUMN IF EXISTS picked_by, 
  DROP COLUMN IF EXISTS picked_at, 
  DROP COLUMN IF EXISTS quality_check, 
  DROP COLUMN IF EXISTS quality_issues;
ALTER TABLE orders DROP COLUMN IF EXISTS user_id, 
  DROP COLUMN IF EXISTS created_by, 
  DROP COLUMN IF EXISTS updated_by, 
  DROP COLUMN IF EXISTS updated_at, 
  DROP COLUMN IF EXISTS status_changed_at;
```

---

## Post-Deployment Verification

### 24 Hours After Deployment:
- [ ] Check Supabase logs for RLS errors
- [ ] Verify customers can still checkout
- [ ] Verify staff dashboards still work
- [ ] Check error tracking (Sentry/similar)
- [ ] Monitor database performance
- [ ] Test role-based access in production
- [ ] Get team feedback

### 1 Week After Deployment:
- [ ] Review audit logs for issues
- [ ] Check if all existing orders have user_id
- [ ] Verify status transitions are valid
- [ ] Document any issues found
- [ ] Success! Ready for Phase 2

---

## Success Criteria

✅ **Phase 1 is successful when:**
- All 5 migrations execute without errors
- Customers can only see their own orders
- Staff can see appropriate orders for their role
- Order status changes are automatically logged
- No RLS policy blocking legitimate access
- All tests pass

🎉 **When Phase 1 is complete, you're ready for Phase 2: Specialist Roles**

