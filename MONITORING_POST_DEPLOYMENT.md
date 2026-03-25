# 📊 POST-DEPLOYMENT MONITORING GUIDE

**Timeline**: Monitor for 24-48 hours after production deployment  
**Owner**: DevOps/QA Team  
**Escalation**: Alert if any critical metrics fail

---

## 🎯 INITIAL SMOKE TESTS (5 minutes after deploy)

### Test 1: App Load
```
1. Navigate to: https://smartcart.example.com/
2. Wait for page fully load
3. Check:
   ✅ No 404 errors in console
   ✅ All category images visible
   ✅ Page load time < 3 seconds
   ✅ No JavaScript errors
```

### Test 2: Shopping Experience
```
1. Navigate to: /shop
2. Wait for page load
3. Check:
   ✅ All product images load
   ✅ Product grid displays correctly
   ✅ Filter/search works
   ✅ Add to cart works
   ✅ No console errors
```

### Test 3: Categories
```
1. Navigate to: /categories
2. Check:
   ✅ All 10 categories visible
   ✅ Each category shows image
   ✅ Images load from Supabase CDN (Network tab)
   ✅ Proper responsive layout
```

### Test 4: Admin Features
```
1. Login to admin panel
2. Try uploading a product image
3. Check:
   ✅ Upload succeeds
   ✅ Image displays immediately
   ✅ No error messages
   ✅ Toast shows success
```

### Test 5: Database Verification
```sql
-- Run in Supabase console

-- Check products migrated
SELECT COUNT(*) as product_count 
FROM products 
WHERE image_url LIKE '%supabasecdn%';
-- Expected: 61 (or 60 if Sweet Potatoes deleted)

-- Check categories migrated
SELECT COUNT(*) as category_count 
FROM categories 
WHERE image_url LIKE '%supabasecdn%';
-- Expected: 10

-- Check version table
SELECT COUNT(*) as version_count 
FROM image_versions;
-- Expected: > 0 (increases as users upload)

-- Check no Unsplash URLs remain
SELECT COUNT(*) as unsplash_count 
FROM products 
WHERE image_url LIKE '%unsplash%';
-- Expected: 0

SELECT COUNT(*) as unsplash_count 
FROM categories 
WHERE image_url LIKE '%unsplash%';
-- Expected: 0
```

**Sign-off**: ✅ **ALL SMOKE TESTS PASS** → Continue to metrics monitoring

---

## 📈 METRICS TO MONITOR (Continuous - 24-48 hours)

### Web Metrics

#### 1. Page Load Time
```
Metric: Time to First Contentful Paint (FCP)
Target: < 2 seconds
Alert Threshold: > 3 seconds

How to monitor:
- Google Analytics: Acquisition → All Traffic → Core Web Vitals
- Browser DevTools: Lighthouse audit
- Vercel Analytics: Real User Monitoring
```

#### 2. Image Load Time
```
Metric: Time to load first image (avg)
Target: < 1.5 seconds
Alert Threshold: > 2.5 seconds

How to monitor (DevTools Network tab):
- Filter for images
- Sort by Duration
- Average should be < 1500ms
```

#### 3. Cache Hit Ratio
```
Metric: CDN cache hits vs requests
Target: > 80%
Alert Threshold: < 70%

How to monitor:
- Supabase Dashboard → Storage → Analytics
- Check cache hit rate for both buckets
- product-images bucket
- category-images bucket
```

#### 4. Uptime
```
Metric: App availability
Target: 99.9%+
Alert Threshold: < 99%

How to monitor:
- Uptime monitoring service (e.g., Pingdom, Better Uptime)
- Set ping every 5 minutes
- Alert if down > 5 minutes
```

### Application Metrics

#### 5. Error Rate
```
Metric: JavaScript errors in console
Target: < 0.1% (1 error per 1000 page views)
Alert Threshold: > 1% of traffic seeing errors

How to monitor:
- Sentry.io or similar error tracking
- Enable on production
- Filter for image-related errors specifically
```

#### 6. Upload Success Rate
```
Metric: Image uploads that complete successfully
Target: ≥ 99%
Alert Threshold: < 98%

How to monitor:
- App logging (if implemented)
- Image upload API success/failure rate
- Manual test: Upload 10 images, all should succeed
```

#### 7. Database Query Performance
```
Metric: Query time for image-related queries
Target: < 100ms
Alert Threshold: > 200ms

How to monitor:
- Supabase Dashboard → SQL Editor → Run query
- Check execution time for:
  SELECT * FROM products WHERE image_url IS NOT NULL;
  SELECT * FROM categories WHERE image_url IS NOT NULL;
  SELECT * FROM image_versions WHERE is_current = true;
```

### Infrastructure Metrics

#### 8. Storage Usage
```
Metric: Total bytes in product-images and category-images buckets
Target: Growth expected as users upload new images
Alert Threshold: Sudden jump (possible issue)

How to monitor:
- Supabase Dashboard → Storage → Buckets
- Check size of:
  - product-images: Should be ~500MB-1GB initially
  - category-images: Should be ~50-100MB
- Track daily growth rate
```

#### 9. CDN Response Headers
```
Metric: Verify cache headers being returned
Expected headers on image requests:
- Content-Type: image/jpeg (or .png, .webp)
- Cache-Control: public, max-age=31536000 (1 year)
- ETag: [unique identifier]
- Date: [current date]

How to monitor:
- DevTools Network tab → Click image request → Response Headers
- Verify all headers present
- Verify cache-control shows proper max-age
```

#### 10. Supabase Performance
```
Metric: Supabase API response time
Target: < 50ms
Alert Threshold: > 100ms

How to monitor:
- Supabase Dashboard → Database → Performance
- Check connection pool
- Monitor slow queries log
- Set up PostgreSQL alerts for slow queries
```

---

## 🔍 SPECIFIC IMAGE TESTING

### Daily Smoke Tests (Do once per day)

#### Day 1: Basic Functionality
```
1. Home page -> Check all category images load
2. Shop page -> Verify all product images show
3. Admin -> Upload new product image, verify display
4. Database -> Query both image tables, verify counts
```

#### Day 2: Performance
```
1. Clear browser cache
2. Load home page, measure load time (should be < 2s)
3. Repeat load, measure cache hit (should be < 1s)
4. Monitor Network tab for image requests
5. Verify images served from CDN (not origin)
```

#### Day 3: User Journey
```
1. Complete full purchase flow
2. Verify images load throughout
3. Check category page, product cards, checkout
4. Monitor console for any image-related errors
```

### Real User Monitoring (Ongoing)

#### Set Up Error Tracking
```
Install Sentry or similar:
1. Add error tracking to production
2. Filter alerts for image-related errors
3. Monitor daily

What to watch for:
- Failed image loads (404, CORS, timeout)
- Upload failures
- Version recording failures
```

---

## 🚨 ALERT CONDITIONS

### Critical Alerts (Page down immediately)
```
❌ App is down (HTTP 5xx errors)
❌ 404 errors for all images (bucket access issue)
❌ Database connection errors
❌ Supabase service down
```

### High Priority Alerts (Fix within 1 hour)
```
⚠️  Image load time > 5 seconds average
⚠️  More than 5% of image requests failing
⚠️  Upload success rate < 95%
⚠️  Database query time > 500ms
```

### Medium Priority Alerts (Fix during business hours)
```
⚠️  Image load time > 3 seconds
⚠️  Cache hit ratio < 70%
⚠️  Storage usage growing unexpectedly
⚠️  New JS errors appearing in logs
```

### Low Priority (Log and review)
```
ℹ️  Occasional 404 on missing category image (expected if admin deletes)
ℹ️  Upload takes > 2 seconds (network-dependent)
ℹ️  Version recording fails but upload succeeds (non-critical)
```

---

## 📋 HOURLY CHECK (First 8 hours)

```bash
#!/bin/bash
# Check every hour for first 8 hours

echo "=== HOURLY HEALTH CHECK ==="
echo "Time: $(date)"
echo ""

# 1. Check uptime
curl -s -o /dev/null -w "App Status: %{http_code}\n" https://smartcart.example.com/

# 2. Check image loads
curl -s -o /dev/null -w "Home page load: %{time_total}s\n" https://smartcart.example.com/
curl -s -o /dev/null -w "Shop page load: %{time_total}s\n" https://smartcart.example.com/shop

# 3. Check database
# (via Supabase Dashboard or API)

# 4. Check logs
echo "Checking error logs..."
# (via your logging service)

echo "✅ Check complete"
```

---

## 📊 CHECKLIST: 24 HOURS AFTER DEPLOY

- [ ] App remains up (99.9%+ uptime)
- [ ] All images load correctly
- [ ] No prominent console errors
- [ ] Database queries performing normally
- [ ] Cache hit ratio > 70%
- [ ] Upload success rate ≥ 99%
- [ ] Supabase storage growth normal
- [ ] No user complaints reported
- [ ] Vercel/hosting metrics look healthy
- [ ] All 61 products displaying correctly
- [ ] All 10 categories displaying correctly

**Status After 24 Hours**: 🟢 **STABLE**

---

## 📊 CHECKLIST: 48 HOURS AFTER DEPLOY

- [ ] App remains at 99.9%+ uptime
- [ ] Performance metrics stable
- [ ] No related errors in error logs
- [ ] Database query times normal
- [ ] Storage growth within expected range
- [ ] Users uploading images without issues
- [ ] Version recording working (if enabled)
- [ ] No version-related errors
- [ ] CDN cache performing
- [ ] Google Analytics shows normal traffic patterns
- [ ] No spike in support tickets related to images

**Status After 48 Hours**: 🟢 **FULLY STABLE - DEPLOYMENT COMPLETE**

---

## 🔙 ROLLBACK CHECKLIST (If Issues Arise)

### Issues Detected?
If you see any of these during monitoring:
- ❌ 404s on all images
- ❌ App completely down
- ❌ Database disconnected
- ❌ Massive spike in errors

### Steps to Rollback:
```bash
# 1. Decision made (within 5 minutes of detection)
# 2. Notify team: "Rolling back Phase 3-4 deployment"

git log --oneline | head -5
# Find the commit BEFORE Phase 3-4 deployment

git revert [commit-hash]
# or
git reset --hard [previous-commit]

# 3. Deploy reverted code (< 5 minutes)
npm run build
npm run deploy:production

# 4. Verify rollback (< 5 minutes)
curl https://smartcart.example.com/
# Should load with old interface

# 5. Database note:
# - Code is rolled back but database stays the same
# - Storage stays the same
# - App will use local fallbacks for category images
# - This is safe and users won't notice anything broken
```

### Post-Rollback Analysis:
1. Identify what caused the issue
2. Fix in development
3. Test thoroughly
4. Redeploy when ready

**Estimated downtime: 15-20 minutes (if you rollback)**

---

## ✅ FINAL SIGN-OFF

After successfully monitoring for 48 hours:

**Deployment Status**: ✅ **SUCCESS**

Document should be signed by:
- [ ] QA Lead
- [ ] DevOps Lead
- [ ] Product Owner
- [ ] Date: _______________

**Monitoring can be reduced to normal levels after 48-hour period is complete.**

---

## 📚 REFERENCE

### Key URLs
- Production app: https://smartcart.example.com/
- Supabase dashboard: https://app.supabase.com/project/[project-id]
- Vercel dashboard: https://vercel.com/dashboard
- Error tracking: https://sentry.io/ (if configured)

### Key Database Queries
```sql
-- Check image counts
SELECT 'products' as table_name, COUNT(*) as total, COUNT(CASE WHEN image_url LIKE '%supabasecdn%' THEN 1 END) as on_supabase FROM products
UNION ALL
SELECT 'categories', COUNT(*), COUNT(CASE WHEN image_url LIKE '%supabasecdn%' THEN 1 END) FROM categories;

-- Check version table
SELECT COUNT(*) as version_count, MAX(uploaded_at) as latest_upload FROM image_versions;

-- Check for errors
SELECT COUNT(*) FROM error_logs WHERE timestamp > NOW() - INTERVAL '24 hours';
```

### Contact For Issues
- **Code Issues**: Developer on-call
- **Database Issues**: DBA on-call
- **Infrastructure**: DevOps on-call
- **User Support**: Support team

---

**Baarak Allahu feek! Good luck with your deployment!** 🚀
