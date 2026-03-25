#!/bin/bash

# 🏥 SMART CART AI - IMAGE SYSTEM HEALTH CHECK
# Verifies all Phase 3-4 components are working correctly
# Usage: chmod +x health-check.sh && ./health-check.sh

set -e

echo "🏥 SMART CART AI - IMAGE SYSTEM HEALTH CHECK"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to print test results
pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# Function to check file exists
check_file() {
    if [ -f "$1" ]; then
        pass "File exists: $1"
        return 0
    else
        fail "File missing: $1"
        return 1
    fi
}

# Function to check directory exists
check_dir() {
    if [ -d "$1" ]; then
        pass "Directory exists: $1"
        return 0
    else
        fail "Directory missing: $1"
        return 1
    fi
}

# Function to check string in file
check_string_in_file() {
    if grep -q "$2" "$1" 2>/dev/null; then
        pass "Found '$2' in $1"
        return 0
    else
        fail "Missing '$2' in $1"
        return 1
    fi
}

echo "📁 CHECKING FILE STRUCTURE..."
echo ""

check_dir "src"
check_dir "src/lib/services"
check_dir "src/hooks"

check_file "src/lib/services/categoryImageService.ts"
check_file "src/lib/services/imageVersionService.ts"
check_file "src/hooks/useVersionedImageUpload.ts"
check_file "src/components/ImageUpload.tsx"
check_file "src/hooks/useProducts.ts"

echo ""
echo "🔧 CHECKING SERVICE IMPLEMENTATIONS..."
echo ""

# Check CategoryImageService
echo "Checking CategoryImageService..."
check_string_in_file "src/lib/services/categoryImageService.ts" "uploadCategoryImage"
check_string_in_file "src/lib/services/categoryImageService.ts" "updateCategoryImageUrl"
check_string_in_file "src/lib/services/categoryImageService.ts" "uploadAndUpdateCategoryImage"
check_string_in_file "src/lib/services/categoryImageService.ts" "deleteCategoryImage"

echo ""

# Check ImageVersionService
echo "Checking ImageVersionService..."
check_string_in_file "src/lib/services/imageVersionService.ts" "recordImageVersion"
check_string_in_file "src/lib/services/imageVersionService.ts" "getImageHistory"
check_string_in_file "src/lib/services/imageVersionService.ts" "getCurrentImageVersion"
check_string_in_file "src/lib/services/imageVersionService.ts" "rollbackImageVersion"

echo ""

# Check useVersionedImageUpload
echo "Checking useVersionedImageUpload Hook..."
check_string_in_file "src/hooks/useVersionedImageUpload.ts" "recordVersion"
check_string_in_file "src/hooks/useVersionedImageUpload.ts" "rollback"
check_string_in_file "src/hooks/useVersionedImageUpload.ts" "getCurrentVersion"

echo ""

# Check ImageUpload component
echo "Checking ImageUpload Component..."
check_string_in_file "src/components/ImageUpload.tsx" "recordVersions"
check_string_in_file "src/components/ImageUpload.tsx" "ImageVersionService"
check_string_in_file "src/components/ImageUpload.tsx" "onVersionRecorded"

echo ""

# Check useProducts hook
echo "Checking useProducts Hook..."
check_string_in_file "src/hooks/useProducts.ts" "image_url"
check_string_in_file "src/hooks/useProducts.ts" "categories"

echo ""
echo "🔨 CHECKING BUILD STATUS..."
echo ""

if npm run build > /tmp/build.log 2>&1; then
    pass "Build successful"
    if grep -q "built in" /tmp/build.log; then
        BUILD_TIME=$(grep "built in" /tmp/build.log | awk '{print $NF}')
        echo "   Build time: $BUILD_TIME"
    fi
else
    fail "Build failed"
    echo "   Error output:"
    tail -10 /tmp/build.log | sed 's/^/   /'
fi

echo ""
echo "📦 CHECKING DEPENDENCIES..."
echo ""

# Check if package.json has required packages
if [ -f "package.json" ]; then
    pass "package.json exists"
    
    # Check for key dependencies
    if grep -q '"react"' package.json; then
        pass "React dependency found"
    else
        warn "React dependency not found (may be dev dependency)"
    fi
    
    if grep -q '"@supabase' package.json; then
        pass "Supabase dependency found"
    else
        warn "Supabase dependency not found"
    fi
else
    fail "package.json not found"
fi

echo ""
echo "🗄️  CHECKING DATABASE MIGRATIONS..."
echo ""

MIGRATION_DIR="supabase/migrations"
if [ -d "$MIGRATION_DIR" ]; then
    pass "Migrations directory exists"
    
    # Check for Phase 3 migration
    if ls $MIGRATION_DIR/*_add_category_images* 1> /dev/null 2>&1; then
        pass "Phase 3 migration found (add category images)"
    else
        warn "Phase 3 migration file not found (may be applied already)"
    fi
    
    # Check for Phase 4 migration
    if ls $MIGRATION_DIR/*_create_image_versions* 1> /dev/null 2>&1; then
        pass "Phase 4 migration found (image versions)"
    else
        warn "Phase 4 migration file not found (may be applied already)"
    fi
else
    warn "Migrations directory not found (may be in different location)"
fi

echo ""
echo "📝 CHECKING TYPE DEFINITIONS..."
echo ""

# Check if types are properly defined
if grep -r "interface DbProduct" src/hooks/useProducts.ts > /dev/null 2>&1; then
    pass "DbProduct interface defined"
    
    if grep -q "image_url" < <(grep -A 20 "interface DbProduct" src/hooks/useProducts.ts); then
        pass "image_url field in DbProduct"
    else
        warn "image_url field not in DbProduct (may be only in categories)"
    fi
else
    warn "DbProduct interface not easily found (may be defined differently)"
fi

echo ""
echo "✅ OPTIONAL: PRODUCTION CHECKS..."
echo ""

# Check for environment file
if [ -f ".env.local" ]; then
    pass ".env.local exists"
    
    if grep -q "VITE_SUPABASE_URL" .env.local; then
        pass "VITE_SUPABASE_URL configured"
    else
        warn "VITE_SUPABASE_URL not in .env.local"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        pass "VITE_SUPABASE_ANON_KEY configured"
    else
        warn "VITE_SUPABASE_ANON_KEY not in .env.local"
    fi
else
    warn ".env.local not found (may use different env setup)"
fi

echo ""
echo "🌐 CHECKING SUPABASE CONFIGURATION..."
echo ""

if [ -f "supabase/config.toml" ]; then
    pass "supabase/config.toml exists"
else
    warn "supabase/config.toml not found"
fi

echo ""
echo "================================================================"
echo "📊 HEALTH CHECK SUMMARY"
echo "================================================================"
echo ""
echo -e "✅ Passed: ${GREEN}${PASSED}${NC}"
echo -e "❌ Failed: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL CHECKS PASSED!${NC}"
    echo ""
    echo "Status: 🟢 READY FOR DEPLOYMENT"
    echo ""
    echo "Next steps:"
    echo "1. Run staging deployment: npm run deploy:staging"
    echo "2. Test all features on staging"
    echo "3. Run full smoke tests"
    echo "4. Deploy to production: npm run deploy:production"
    echo "5. Monitor for 24-48 hours"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  SOME CHECKS FAILED${NC}"
    echo ""
    echo "Status: 🟡 REVIEW REQUIRED"
    echo ""
    echo "Please fix the failed checks before deploying."
    echo ""
    exit 1
fi
