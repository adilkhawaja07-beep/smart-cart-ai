# 🚀 RAILWAY & VERCEL DEPLOYMENT GUIDE

**Choose your platform and follow the exact steps below**

---

## STEP 0️⃣ : SECURITY CHECK (FIRST!)

Before ANY deployment, complete this:

```bash
# 1. Verify .env is in .gitignore
grep "^\.env" .gitignore
# Should output: .env

# 2. Regenerate your API keys (DO THIS FIRST!)
# ⚠️ Your current keys are exposed in GitHub!

# Supabase: https://app.supabase.com/project/[id]/settings/api
#   Click "Regenerate" next to "Project API Key (anon)"
#   Copy new key

# OpenAI: https://platform.openai.com/api-keys
#   Click trash icon to delete old key
#   Create new API key

# 3. Update .env with new keys (don't commit this!)
VITE_SUPABASE_URL="https://iobqovsaaofkxcmcejzb.supabase.co"
VITE_SUPABASE_ANON_KEY="[NEW KEY FROM SUPABASE]"
VITE_SUPABASE_PROJECT_ID="iobqovsaaofkxcmcejzb"
OPENAI_API_KEY="sk-proj-[NEW KEY FROM OPENAI]"

# 4. Test locally with new keys
npm run dev
# Visit http://localhost:5173
# Test: Home page, Shop, Chat (should work)

# 5. Commit security fix
git add .gitignore
git commit -m "chore: add .env to gitignore"

# ✅ NOW you can deploy
```

---

## 📦 OPTION A: DEPLOY TO VERCEL

### Step 1: Create Vercel Account
```
1. Go to: https://vercel.com
2. Click "Sign Up"
3. Connect with GitHub
4. Authorize Vercel to access your repos
```

### Step 2: Create New Project
```
1. Dashboard → "Add New..." → "Project"
2. Select repository: smart-cart-ai
3. Select Git scope (your GitHub account)
4. Click "Import"
```

### Step 3: Configure Environment Variables
```
The page shows: Configure Project

Under "Environment Variables":

Add each variable (click "Add" for each):

Name: VITE_SUPABASE_URL
Value: https://iobqovsaaofkxcmcejzb.supabase.co
✓ Production, Preview, Development (select all)
Click "Add"

Name: VITE_SUPABASE_PROJECT_ID
Value: iobqovsaaofkxcmcejzb
✓ Production, Preview, Development
Click "Add"

Name: VITE_SUPABASE_ANON_KEY
Value: [PASTE YOUR NEW KEY FROM SUPABASE]
✓ Production, Preview, Development
Click "Add"

Name: OPENAI_API_KEY
Value: [PASTE YOUR NEW KEY FROM OPENAI]
✓ Production, Preview, Development
Click "Add"
```

### Step 4: Deploy
```
1. Click "Deploy" button
2. Wait for build (should take 1-2 minutes)
3. Watch the build logs - should see:
   ✓ Cloned repository
   ✓ Installed dependencies
   ✓ Built successfully
   ✓ Created deployment
   
4. When complete, get a URL like:
   https://smart-cart-ai.vercel.app
```

### Step 5: Verify Production
```
1. Click the deployment URL
2. Wait for page to load
3. Test:
   ✅ Home page loads
   ✅ All category images display
   ✅ Shop page works
   ✅ Can filter/search products
   ✅ Chat feature works
   ✅ No console errors (open DevTools)
4. You can now share this link!
```

### Step 6: Set Custom Domain (Optional)
```
After deployment:
1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., smartcart.com)
3. It will show DNS records to add to your domain registrar
4. Follow instructions to point domain to Vercel
5. Within minutes, domain will work
```

---

## 🚂 OPTION B: DEPLOY TO RAILWAY

### Step 1: Create Railway Account
```
1. Go to: https://railway.app
2. Click "Start Project"
3. Sign up with GitHub (recommended)
4. Authorize Railway to access repos
```

### Step 2: Create New Project
```
1. Dashboard → "New Project"
2. Select "Deploy from GitHub repo"
3. Click "Configure GitHub App"
4. Select your GitHub account
5. Select "smart-cart-ai" repository
6. Click "Deploy"
```

### Step 3: Wait for Initial Build
```
Railway will auto-detect Vite + React
It will:
1. Clone repo
2. Install dependencies
3. Run: npm run build
4. Deploy to Railway's servers

This takes 2-3 minutes
```

### Step 4: Add Environment Variables
```
After deployment, go to your project:

1. Click "Variables" at the top
2. Click "RAW Editor"
3. Paste this (with YOUR ACTUAL KEYS):

VITE_SUPABASE_URL=https://iobqovsaaofkxcmcejzb.supabase.co
VITE_SUPABASE_PROJECT_ID=iobqovsaaofkxcmcejzb
VITE_SUPABASE_ANON_KEY=[YOUR NEW SUPABASE KEY]
OPENAI_API_KEY=[YOUR NEW OPENAI KEY]

4. Click "Save"
5. Railway will automatically redeploy with new variables
```

### Step 5: Find Your Railway URL
```
In your Railway project:
1. Click "Deployments" tab
2. Click the latest deployment
3. Click "View Logs"
4. Look for your generated URL (like):
   https://smart-cart-ai-production.up.railway.app

This is your live app!
```

### Step 6: Verify Production
```
1. Open the Railway URL in browser
2. Wait for page to load
3. Test:
   ✅ Home page loads
   ✅ All category images display
   ✅ Shop page works
   ✅ Chat works
   ✅ No errors in console
4. Share this link!
```

### Step 7: Set Custom Domain (Optional)
```
1. Railway Dashboard → Project → Domains
2. Add your custom domain
3. It will show DNS records
4. Add those records to your domain registrar
5. Domain takes 10-30 minutes to work
```

---

## 🔄 UPDATING YOUR APP ON VERCEL/RAILWAY

After deployment, if you make changes:

```bash
# 1. Make code changes locally
# 2. Test locally
npm run dev

# 3. Commit and push to GitHub
git add .
git commit -m "feat: your change description"
git push

# 4. Vercel/Railway automatically detects the push
# 5. Automatically builds and deploys
# 6. Your live site updates (takes 1-2 minutes)

# No additional commands needed!
```

---

## 🔍 MONITORING YOUR DEPLOYMENT

### Vercel Dashboard
```
After deployment:
1. https://vercel.com/dashboard
2. Click your project
3. View:
   - Deployments (all versions, rollback available)
   - Analytics (page views, response times)
   - Logs (any server errors)
   - Settings (domain, environment variables)
```

### Railway Dashboard
```
After deployment:
1. https://railway.app/dashboard
2. Click your project
3. View:
   - Deployments (all versions)
   - Logs (real-time logs)
   - Metrics (CPU, memory usage)
   - Settings (variables, domains)
```

---

## ⚠️ TROUBLESHOOTING

### Issue: Build Fails on Vercel/Railway
```
Common causes:
1. Missing environment variables
   → Check Variables section has all 4 keys
   
2. Node version mismatch
   → Vercel/Railway uses Node 18+ (should be fine)
   
3. TypeScript errors
   → Run locally: npx tsc --noEmit
   → Fix any errors before pushing
   
4. Missing dependencies
   → Run locally: npm install && npm run build
   → Verify it works before pushing
```

### Issue: Images Not Loading in Production
```
Causes:
1. Environment variables not set
   → Check Supabase URL/Key in Variables section
   
2. Supabase bucket not public
   → Check: Supabase → Storage → product-images/category-images
   → Should show "Public" badge
   
3. CORS issues
   → In Supabase → Storage → Policies
   → Ensure policies allow public read access

Fix:
1. Verify variables in dashboard
2. Verify storage bucket is public
3. Wait 5 minutes for cache to clear
4. Refresh browser (Cmd+Shift+R to hard refresh)
```

### Issue: Chat Not Working in Production
```
Causes:
1. OpenAI key not in environment variables
   → Check OPENAI_API_KEY is set
   
2. OpenAI key invalid or expired
   → Regenerate at https://platform.openai.com/api-keys
   → Update in Vercel/Railway Variables
   
3. OpenAI quota exceeded
   → Check OpenAI dashboard for usage/limits
   → May need to add payment method

Fix:
1. Verify OPENAI_API_KEY in Variables
2. Regenerate key if needed
3. Redeploy
```

### Issue: Slow Loading in Production
```
Causes:
1. Cold start (first request after deployment)
   → Normal, takes 5-10 seconds first time
   → Should be fast after that
   
2. Images not cached
   → Check browser cache (DevTools → Network → Size column)
   → Should show "memory cache" or "disk cache" on repeat
   
3. Too many requests to OpenAI
   → Check OpenAI API response times
   → May hit rate limits

Fix:
1. Clear browser cache and reload
2. Check DevTools Network tab for slow requests
3. Check Supabase database query times
```

---

## 🧪 POST-DEPLOYMENT TESTING

After your app is live, test everything:

```
Manual Testing Checklist:

🏠 Home Page
□ Loads in < 3 seconds
□ All 10 categories display with images
□ Images from Supabase CDN (check Network tab)
□ Responsive on mobile/tablet/desktop

🛒 Shop Page
□ All products load
□ All product images display
□ Filter by category works
□ Search works
□ Add to cart works
□ Cart drawer updates

🗂️ Categories Page
□ All 10 categories visible
□ Each has image from Supabase
□ Can click to filter by category

💬 Chat
□ Can type a message
□ Gets response from OpenAI
□ Multiple turns work
□ No errors in console

🔧 Admin (if you have access)
□ Can add new product
□ Can upload image
□ Image saves and displays
□ Can edit product
□ Can delete product

📱 Mobile
□ All above tests but on phone screen
□ Layout responsive and readable
□ Images load correctly
□ Touch interactions work
```

---

## 📊 MONITORING CHECKLIST (Ongoing)

After deployment, monitor:

```
Daily (First week):
□ App is up (visit the URL)
□ No spike in error logs
□ Images still loading
□ Chat still working

Weekly (First month):
□ Performance metrics
□ User reports (any issues?)
□ Database query times
□ Storage usage

Monthly (Ongoing):
□ Ensure dependencies updated
□ Check for security updates
□ Monitor costs (Vercel/Railway usage)
```

---

## 🔄 ROLLING BACK IF NEEDED

### Vercel Rollback
```
If your latest deployment breaks things:
1. Vercel Dashboard → Deployments
2. Find the previous good deployment
3. Click the "..." menu
4. Click "Promote to Production"
5. Your app reverts instantly
```

### Railway Rollback
```
If deployment breaks:
1. Railway Dashboard → Deployments
2. Find the previous good deployment
3. Click "Redeploy"
4. App reverts to that version
```

---

## ✅ SUCCESS CRITERIA

You're done when:

```
✅ App is live at a public URL
✅ Home page loads
✅ Products display with images
✅ Chat works
✅ No errors in console
✅ Responsive on mobile
✅ Can share URL with anyone
✅ App stays up continuously
```

---

## 📞 NEXT STEPS

1. Choose Vercel OR Railway (doesn't matter, both work great)
2. Follow the exact steps for your choice
3. Test the production app
4. Share the link: "My app is live at: [URL]"
5. Monitor for any issues

**Everything is configured and ready to go!** 🚀

Just follow the steps and you'll be live in 10-15 minutes.

**Insha Allah, your app will be live soon!** ✨
