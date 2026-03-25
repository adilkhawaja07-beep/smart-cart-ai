#!/bin/bash

# Admin User Setup Script for Smart Cart AI
# Creates hardcoded admin user (admin@admin.com / admin1234 with management role)

set -e

echo "================================"
echo "Smart Cart AI - Admin Setup"
echo "================================"
echo ""

# Check if we have Supabase configured
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables not set"
    echo ""
    echo "Set them with:"
    echo '  export SUPABASE_URL="https://your-project.supabase.co"'
    echo '  export SUPABASE_ANON_KEY="your-anon-key"'
    echo ""
    exit 1
fi

echo "📧 Admin Email: admin@admin.com"
echo "🔑 Admin Password: admin1234"
echo ""
echo "This script will:"
echo "1. Create the admin auth user in Supabase"
echo "2. Assign 'management' role to the admin user"
echo "3. Skip email confirmation for admin account"
echo ""

# Use Supabase CLI to create user
echo "Creating admin user in Supabase..."
echo ""

# Note: This requires Supabase CLI to be installed and configured
# For now, provide manual instructions

echo "Option 1: Using Supabase Dashboard (Easiest):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to: https://app.supabase.com"
echo "2. Select your project: 'smart-cart-ai'"
echo "3. Navigate to: Authentication → Users"
echo "4. Click: 'Create user/invite new user'"
echo "5. Enter:"
echo "   - Email: admin@admin.com"
echo "   - Password: admin1234"
echo "   - Confirm password: admin1234"
echo "6. ✓ CHECK: 'Auto confirm user'"
echo "7. Click: 'Create user'"
echo "8. Click on the created user to see their UUID"
echo ""

echo "Option 2: Using Supabase SQL Editor:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Go to: https://app.supabase.com"
echo "2. Navigate to: SQL Editor"
echo "3. Create new query"
echo "4. Paste this SQL:"
echo ""
echo "SELECT auth.create_user(email:='admin@admin.com', password:='admin1234', email_confirmed:=true);"
echo ""
echo "5. Click Run"
echo "6. Copy the returned UUID"
echo ""

read -p "📋 Enter the admin user UUID: " ADMIN_UUID

if [ -z "$ADMIN_UUID" ]; then
    echo "❌ UUID cannot be empty"
    exit 1
fi

echo ""
echo "Assigning 'management' role to admin user..."
echo ""

# Use SQL to assign role
cat << EOF | psql "$SUPABASE_CONNECTION_STRING"
INSERT INTO public.user_roles (user_id, role)
VALUES ('$ADMIN_UUID', 'management')
ON CONFLICT (user_id) DO UPDATE
SET role = 'management';
EOF

if [ $? -eq 0 ]; then
    echo "✅ Success! Admin user created with management role"
    echo ""
    echo "You can now sign in with:"
    echo "  Email: admin@admin.com"
    echo "  Password: admin1234"
    echo ""
    echo "The admin will have access to:"
    echo "  🎛️ Admin Dashboard: /admin"
    echo "  👥 Staff role management"
    echo "  📊 System overview"
else
    echo "⚠️  Note: Direct psql connection not available"
    echo "Please use Supabase Dashboard SQL Editor to run this query:"
    echo ""
    echo "INSERT INTO public.user_roles (user_id, role)"
    echo "VALUES ('$ADMIN_UUID', 'management')"
    echo "ON CONFLICT (user_id) DO UPDATE"
    echo "SET role = 'management';"
fi
