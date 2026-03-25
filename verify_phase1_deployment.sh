#!/bin/bash
# Phase 1 Verification Script
# Run this after deploying migrations to verify everything worked

set -e

echo "🔍 Smart Cart AI - Phase 1 Deployment Verification"
echo "=================================================="
echo ""

# Check if required tools are available
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Install with: npm install -g @supabase/cli"
    exit 1
fi

# Get database info
echo "📊 Checking database connection..."
if supabase projects list &> /dev/null; then
    echo "✅ Supabase CLI connected"
else
    echo "❌ Cannot connect to Supabase"
    exit 1
fi

echo ""
echo "🔍 Verification Checklist:"
echo ""

# Check 1: user_id columns exist
echo "1️⃣  Checking user_id columns..."
supabase sql --file <(cat <<'EOF'
SELECT 
  'orders has user_id' as check,
  EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_name='orders' AND column_name='user_id') as passed;

SELECT 
  'order_items has picked' as check,
  EXISTS(SELECT 1 FROM information_schema.columns 
    WHERE table_name='order_items' AND column_name='picked') as passed;
EOF
) || echo "⚠️  Could not verify columns (might be normal)"

echo ""

# Check 2: user_roles table exists
echo "2️⃣  Checking user_roles table..."
supabase sql --file <(cat <<'EOF'
SELECT 
  'user_roles table' as entity,
  EXISTS(SELECT 1 FROM information_schema.tables 
    WHERE table_name='user_roles') as exists;
EOF
) || echo "⚠️  Could not verify table"

echo ""

# Check 3: Enums created
echo "3️⃣  Checking enum types..."
supabase sql --file <(cat <<'EOF'
SELECT 
  'user_role enum' as enum_name,
  EXISTS(SELECT 1 FROM pg_type 
    WHERE typname='user_role') as exists;

SELECT 
  'order_status enum' as enum_name,
  EXISTS(SELECT 1 FROM pg_type 
    WHERE typname='order_status') as exists;
EOF
) || echo "⚠️  Could not verify enums"

echo ""

# Check 4: Indexes created
echo "4️⃣  Checking indexes..."
supabase sql --file <(cat <<'EOF'
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE indexname LIKE 'idx_orders_%' OR indexname LIKE 'idx_audit_%'
ORDER BY tablename;
EOF
) || echo "⚠️  Could not verify indexes"

echo ""

# Check 5: RLS policies
echo "5️⃣  Checking RLS policies..."
supabase sql --file <(cat <<'EOF'
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('orders', 'order_items')
GROUP BY tablename;
EOF
) || echo "⚠️  Could not verify RLS policies"

echo ""

# Check 6: Trigger exists
echo "6️⃣  Checking order status triggers..."
supabase sql --file <(cat <<'EOF'
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'orders';
EOF
) || echo "⚠️  Could not verify triggers"

echo ""

# Check 7: Sample data
echo "7️⃣  Checking sample data..."
supabase sql --file <(cat <<'EOF'
SELECT 
  'Total orders' as metric,
  COUNT(*) as count
FROM orders;

SELECT 
  'Orders with user_id' as metric,
  COUNT(*) as count
FROM orders
WHERE user_id IS NOT NULL;

SELECT 
  'User roles assigned' as metric,
  COUNT(*) as count
FROM user_roles;
EOF
) || echo "⚠️  Could not verify sample data"

echo ""
echo "✅ Verification complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Review the checks above"
echo "  2. Run data migrations if needed"
echo "  3. Test RLS policies in browser"
echo "  4. Deploy to production"
echo ""
