# 🔒 PRE-DEPLOYMENT SECURITY & AUDIT CHECKLIST

**CRITICAL**: Complete this BEFORE deploying to Railway/Vercel  
**Status**: ⚠️ SECURITY ISSUES FOUND — See below  
**Timeline**: 30-60 minutes to resolve all items

---

## 🚨 CRITICAL SECURITY ISSUES FOUND

### Issue 1: `.env` Not in `.gitignore`
**Severity**: 🔴 CRITICAL  
**Risk**: API keys exposed in GitHub repository  

**Action Required**:
```bash
# 1. Add .env to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore

# 2. Regenerate ALL API keys immediately
# - Go to Supabase: https://app.supabase.com/project/[id]/settings/api
#   - Under "Project API keys", click "Regenerate" 
#   - This invalidates the old key
#   - Copy the new key

# - Go to OpenAI: https://platform.openai.com/api-keys
#   - Delete the old key (visibly shown in .env)
#   - Create a new API key

# 3. Update .env with new keys
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=[NEW KEY - regenerated]
# OPENAI_API_KEY=[NEW KEY - just created]

# 4. Verify credentials work locally
npm run dev
# Test login, product loading, chat - all should work

# 5. Commit the .gitignore change (do NOT commit .env)
git add .gitignore
git commit -m "chore: add .env to gitignore"
git push
```

**Verification**:
```bash
# Verify .env is now ignored
git check-ignore .env
# Output: .env (means it's properly ignored now)

# Verify old keys are gone from git history
git log -p --all -- .env 2>/dev/null | head -20
# If keys visible in history, see "Issue 2" below
```

**Status**: ⏳ **ACTION REQUIRED** — DO NOT PROCEED UNTIL KEYS ARE REGENERATED

---

### Issue 2: Keys Might Be in Git History
**Severity**: 🔴 CRITICAL (if true)  
**Risk**: Keys exposed even with .env now in .gitignore

**Check**:
```bash
# Did .env get committed previously?
git log --oneline --all -- .env | head -5

# If output shows commits, keys are in history:
# Solution: Use BFG Repo-Cleaner or git-filter-repo
```

**If Keys Are in History** (nuclear option):
```bash
# WARNING: This rewrites history - only do if necessary
# Get BFG (brew install bfg on macOS)

# 1. Backup your repo
cp -r /Users/adilkhwaja/smart-cart-ai ~/smart-cart-ai-backup

# 2. Remove .env from history
bfg --delete-files .env /Users/adilkhwaja/smart-cart-ai

# 3. Clean and force push (⚠️ requires force push access)
cd /Users/adilkhwaja/smart-cart-ai
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force

# 4. Regenerate keys again (they're doubly exposed)
# Supabase + OpenAI keys regeneration
```

**Status**: Check first, then act if needed

---

## ✅ PRE-DEPLOYMENT SECURITY CHECKLIST

### 1. Secrets Management ✓
- [ ] `.env` is in `.gitignore`
- [ ] No `.env` commits in git history (or cleaned)
- [ ] All API keys regenerated with new values
- [ ] `.env.example` has placeholder values only (no real keys)
- [ ] Never committed API keys anywhere
- [ ] Ready to add different keys for production

**Evidence Check**:
```bash
git check-ignore .env    # Should output: .env
cat .env.example         # Should show placeholders, no real keys
grep -r "sk-proj" .     # Should return 0 results (no keys in repo)
grep -r "supabase_publishable" . --exclude-dir=.git --exclude-dir=node_modules | grep -v ".env"
# Should return 0 results (no keys in code)
```

### 2. Environment Setup ✓
- [ ] Local `.env` has valid Supabase credentials
- [ ] Local `.env` has valid OpenAI API key
- [ ] `npm run dev` works completely locally
- [ ] App can:
  - [ ] Display products from Supabase
  - [ ] Display categories with images
  - [ ] Send messages to OpenAI chat
  - [ ] Upload images to Supabase Storage

**Test**:
```bash
npm run dev

# Manual testing (2-3 minutes):
# 1. Open http://localhost:5173
# 2. Home page loads, categories show images
# 3. Shop page loads, products display
# 4. Click "Chat" → Can send message → Gets response from OpenAI
# 5. Try uploading a test image (if admin)
# 6. Check console for errors (should be 0 errors)
```

### 3. Build Verification ✓
- [ ] `npm run build` completes successfully
- [ ] No build errors
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Build output size reasonable

**Test**:
```bash
npm run build

# Should output:
# ✓ [number] modules transformed
# ✓ built in [time]s
# (with 0 errors)

# Check build size
du -sh dist/
# Should be less than 5MB typically
```

### 4. Code Quality ✓
- [ ] ESLint passes
- [ ] No console.log() statements left in production code
- [ ] No hardcoded API keys in any source file
- [ ] No placeholder text left in UI
- [ ] Error boundaries in place

**Test**:
```bash
npm run lint

# Should show 0 errors
# (warnings are okay, but review them)
```

### 5. Performance ✓
- [ ] No unused dependencies
- [ ] Images properly optimized
- [ ] Lazy loading configured for images
- [ ] Code splitting working
- [ ] No memory leaks in browser console

**Test**:
```bash
# Check for unused dependencies
npm audit

# Run lighthouse (if using Chrome)
# DevTools → Lighthouse → Generate report
# Score should be > 80 for Performance

# Check for console memory warnings
npm run dev
# Open DevTools → Console → Look for memory warnings
```

### 6. Database Integrity ✓
- [ ] All products have images
- [ ] All categories have images  
- [ ] Image URLs point to Supabase CDN
- [ ] No broken image references
- [ ] Database migrations all applied

**Test**:
```bash
# In Supabase console, run:
SELECT COUNT(*) FROM products WHERE image_url IS NULL;
-- Should return 0

SELECT COUNT(*) FROM categories WHERE image_url IS NULL;
-- Should return 0

SELECT COUNT(*) FROM products WHERE image_url NOT LIKE '%supabasecdn%' AND image_url IS NOT NULL;
-- Should return 0 (all pointing to Supabase or local)
```

### 7. Storage Configuration ✓
- [ ] Supabase storage buckets are PUBLIC
- [ ] Correct bucket names:
  - [ ] `product-images` exists and is public
  - [ ] `category-images` exists and is public
- [ ] All image files accessible via URLs
- [ ] Storage policies allow read access

**Test**:
```bash
# In Supabase Dashboard:
# 1. Storage → product-images → Settings
#    - Visibility: Public ✓
# 2. Storage → category-images → Settings
#    - Visibility: Public ✓

# Test direct URL access:
# Copy image URL from database
# Open in browser - should display image
```

### 8. API Integration ✓
- [ ] Supabase connection strings correct
- [ ] OpenAI API configured
- [ ] No API rate limiting issues
- [ ] Error handling for API failures
- [ ] Fallbacks for failed requests

**Test**:
```bash
# In browser console while running npm run dev
# Try these in DevTools Console:

// Test Supabase
const { data, error } = await supabase.from('products').select('*').limit(1);
console.log('Supabase connection:', error ? 'FAILED' : 'OK', data);

// Test OpenAI integration by using chat feature in app
```

### 9. Responsive Design ✓
- [ ] Mobile layout works
- [ ] Tablet layout works
- [ ] Desktop layout works
- [ ] Images responsive on all sizes
- [ ] Navigation works on mobile

**Test**:
```bash
npm run dev

# DevTools → Toggle device toolbar → Test:
# - iPhone 12
# - iPad
# - Desktop (1920px)
# - Mobile (375px)
```

### 10. Browser Compatibility ✓
- [ ] Works on Chrome/Edge (latest)
- [ ] Works on Firefox (latest)
- [ ] Works on Safari (latest)
- [ ] No console errors on any browser

**Test**: Test in multiple browsers locally

---

## 🚀 RAILWAY/VERCEL SPECIFIC SETUP

### Before Deploying to Railway/Vercel:

#### 1. Create `vercel.json` or `railway.json` (if needed)

**For Vercel** (create if it doesn't exist):
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "outputDirectory": "dist"
}
```

**For Railway** (create if it doesn't exist):
```json
{
  "buildCommand": "npm run build",
  "startCommand": "npm run preview",
  "root": "."
}
```

#### 2. Environment Variables in Platform

**DO NOT add `.env` to your repo!**

Instead, add these to your deployment platform:

**Vercel**:
```
Settings → Environment Variables
Add:
- VITE_SUPABASE_URL = https://your-project.supabase.co
- VITE_SUPABASE_ANON_KEY = [from Supabase]
- VITE_SUPABASE_PROJECT_ID = your_project_id
- OPENAI_API_KEY = sk-proj-[your key from OpenAI]
```

**Railway**:
```
Variables → Add Variable
Add same variables as above
```

#### 3. Build & Deploy Settings

**Vercel**:
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

**Railway**:
- Build Command: `npm run build`
- Start Command: `npm run preview`

---

## 📋 FINAL PRE-DEPLOYMENT CHECKLIST

### Security ✓
- [ ] All API keys regenerated
- [ ] `.env` not in git history (verified with `git check-ignore .env`)
- [ ] No hardcoded secrets in source code
- [ ] No confidential info in logs

### Functionality ✓
- [ ] App works locally (`npm run dev`)
- [ ] Build succeeds (`npm run build` generates /dist)
- [ ] All features testable locally
- [ ] Database queries work
- [ ] Image uploads work
- [ ] Chat works
- [ ] No console errors

### Deployment Ready ✓
- [ ] `.env` not committed to git
- [ ] `.gitignore` updated
- [ ] Build output size reasonable
- [ ] Environment variables documented
- [ ] Rollback plan documented (just revert on platform)

### Platform Specific ✓
- [ ] Vercel/Railway account created
- [ ] Git repo connected to platform
- [ ] Environment variables added to platform
- [ ] Build settings configured
- [ ] Domain configured (if applicable)

---

## 🚀 READY TO DEPLOY?

When ALL items above are checked ✓:

```bash
# 1. Final verification
npm run build
# Should complete in < 5 seconds

# 2. Push to GitHub
git status          # Should show no .env
git add .
git commit -m "chore: deployment ready"
git push

# 3. Deploy to platform
# Option A: Vercel
# - Go to https://vercel.com → New Project
# - Connect your GitHub repo
# - Add environment variables from above
# - Click Deploy

# Option B: Railway  
# - Go to https://railway.app → New Project
# - Connect GitHub repo
# - Add environment variables
# - Click Deploy
```

---

## ⏮️ ROLLBACK IF ISSUES

```bash
# If something breaks after deploy:
# 1. Identify the issue
# 2. In Vercel/Railway dashboard, click "Revert"
# 3. App reverts to previous working version
# 4. Takes ~2-5 minutes
```

---

## 📞 SUMMARY

**Before deploying to Railway/Vercel:**

1. ✅ Fix `.env` security issue (regenerate keys, add to .gitignore)
2. ✅ Run all tests locally (`npm run dev`, test features)
3. ✅ Verify build (`npm run build`)
4. ✅ Check code quality (`npm run lint`)
5. ✅ Push to GitHub (WITHOUT `.env`)
6. ✅ Add environment variables to Railway/Vercel
7. ✅ Deploy

**Timeline**: 1 hour to fix security + deploy + verify = fully production-ready

---

**Baarak Allahu feek! Let's get this deployed safely!** 🚀
