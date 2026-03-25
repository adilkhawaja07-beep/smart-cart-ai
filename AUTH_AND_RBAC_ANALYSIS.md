# Smart Cart AI - Authentication & Authorization Audit Report

## Executive Summary

The **smart-cart-ai** codebase implements a basic role-based access control (RBAC) system using **Supabase Auth + PostgreSQL Row-Level Security (RLS)**. Currently, only 3 roles exist (admin, moderator, user) and only 2 are actively used (admin for management, user for customers). **None of the requested logistics roles (duty_clerk, shipping_clerk, dispatch_rider) are implemented.**

---

## 1. USER ROLE DEFINITION

### Defined Roles (Enum: `app_role`)
**Location**: [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts#L353)

```typescript
app_role: "admin" | "moderator" | "user"
```

**Also in constants**: [src/integrations/supabase/types.ts](src/integrations/supabase/types.ts#L481)
```typescript
app_role: ["admin", "moderator", "user"]
```

### Database Schema

**user_roles table**: [supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql](supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql)
```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
```

**profiles table**: [supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql](supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql#L2)
```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### Signup Account Types
**Location**: [src/pages/Auth.tsx](src/pages/Auth.tsx#L19)

Only **two account types** are offered:
```typescript
accountType: "customer" | "admin"
```

Users select during signup:
- **"customer"** → assigned 'user' role
- **"admin"** → assigned 'admin' role

**Missing**: No UI/option for moderator, duty_clerk, shipping_clerk, or dispatch_rider roles.

---

## 2. AUTHENTICATION FLOW

### Auth Provider
- **Provider**: Supabase Auth (PostgREST + JWT)
- **Auth Method**: Email/password signup and signin
- **Session Management**: Supabase session tokens (JWT in localStorage)

### Core Auth Hook
**Location**: [src/hooks/useAuth.ts](src/hooks/useAuth.ts)

```typescript
const checkRole = useCallback(async (userId: string) => {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",  // ⚠️ Hardcoded to check only 'admin'
  });
  setIsAdmin(!error && Boolean(data));
}, []);
```

**Auth Methods Exposed**:
- `signUp(email, password, fullName, accountType)` - Creates user + assigns role via trigger
- `signIn(email, password)` - Standard login
- `signOut()` - Logout
- `resendConfirmationEmail(email)` - Email verification
- `checkRole(userId)` - RPC call to check if user is admin

### Signup Flow
[src/pages/Auth.tsx](src/pages/Auth.tsx#L40)

1. User enters email, password, full name, account type
2. Calls `signUp()` → Supabase stores user in `auth.users`
3. Server-side trigger (`handle_new_user()`) fires:
   - Creates profile in `profiles` table
   - **Auto-assigns role to `user_roles` table based on `account_type` metadata**

### Role Assignment Logic
**Location**: [supabase/migrations/20260324064311_3cf93911-a7f6-41e2-8b20-0c8152faf383.sql](supabase/migrations/20260324064311_3cf93911-a7f6-41e2-8b20-0c8152faf383.sql)

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requested_role text;
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;

  requested_role := lower(COALESCE(NEW.raw_user_meta_data->>'account_type', 'user'));

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN requested_role = 'admin' THEN 'admin'::public.app_role 
         ELSE 'user'::public.app_role 
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;
```

**Key observation**: Only 'admin' is specially handled; everything else defaults to 'user'.

---

## 3. ROLE-BASED ACCESS CONTROL (RBAC)

### A. Route Guards/Middleware

**ProtectedRoute Component**: [src/App.tsx](src/App.tsx#L31-L49)

```typescript
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>;
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;  // ⚠️ Binary: admin or not

  return <>{children}</>;
};
```

**Usage**: Dashboard route is wrapped with ProtectedRoute
```typescript
<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### B. Conditional UI Rendering

**Navbar Admin Link**: [src/components/Navbar.tsx](src/components/Navbar.tsx#L41-L50)

```typescript
{isAdmin && (
  <Link
    to="/dashboard"
    className={`flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary ${
      location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
    }`}
  >
    <LayoutDashboard className="h-4 w-4" />
    Management Console
  </Link>
)}
```

**Mobile Menu**: [src/components/Navbar.tsx](src/components/Navbar.tsx#L107-L120)

```typescript
{isAdmin && (
  <Link to="/dashboard" className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary" onClick={() => setMobileOpen(false)}>
    <LayoutDashboard className="h-4 w-4" /> Management Console
  </Link>
)}
```

**Dashboard Admin Badge**: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx#L50)

```typescript
<Badge variant="outline" className="border-primary text-primary">Admin</Badge>
```

### C. API Calls with Role Restrictions

**RPC Function for Role Checking**: [supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql](supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql#L34)

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Called from frontend**: [src/hooks/useAuth.ts](src/hooks/useAuth.ts#L12-L18)

```typescript
const { data, error } = await supabase.rpc("has_role", {
  _user_id: userId,
  _role: "admin",
});
```

### D. Supabase RLS (Row Level Security) Policies

#### i. User Roles Table Policies
**Location**: [supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql](supabase/migrations/20260324060329_e59ac184-90c3-4768-9136-2ec7757aa05e.sql#L48)

```sql
-- Users can view their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins can manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
```

#### ii. Product Management Policies
**Location**: [supabase/migrations/20260324071714_c1da6bfc-2ec8-477e-b641-c140bd4efc4f.sql](supabase/migrations/20260324071714_c1da6bfc-2ec8-477e-b641-c140bd4efc4f.sql#L122)

**Products**:
```sql
-- Allow admins to INSERT products
CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to UPDATE products
CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

**Categories**:
```sql
-- Allow admins to INSERT categories
CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

**Inventory**:
```sql
-- Allow admins to INSERT inventory
CREATE POLICY "Admins can insert inventory"
ON public.inventory FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update inventory (for restocking)
CREATE POLICY "Admins can update inventory"
ON public.inventory FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

#### iii. Order Management Policies
**Location**: [supabase/migrations/20260324070211_4ed09556-c231-4a6b-828a-be0542d3fb83.sql](supabase/migrations/20260324070211_4ed09556-c231-4a6b-828a-be0542d3fb83.sql)

```sql
-- Allow admins to update order status
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

#### iv. Category Management Policies
**Location**: [supabase/migrations/20260324074919_7d8a4b65-dfb8-4acc-ace5-147fdf89a758.sql](supabase/migrations/20260324074919_7d8a4b65-dfb8-4acc-ace5-147fdf89a758.sql)

```sql
CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

#### v. Public Read Policies
**Location**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L88)

```sql
-- Public read for categories and products (storefront)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can view inventory" ON public.inventory FOR SELECT USING (true);
```

#### vi. Storage Bucket Policies
**Product Images**: [supabase/migrations/20260325000000_fix_storage_policies.sql](supabase/migrations/20260325000000_fix_storage_policies.sql#L16)

```sql
-- Allow authenticated users to upload to product-images
CREATE POLICY "Allow authenticated users to upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images' AND auth.uid() IS NOT NULL);

-- Allow public read of product images
CREATE POLICY "Allow public read of product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');
```

**Category Images**: [supabase/migrations/20260325000000_fix_storage_policies.sql](supabase/migrations/20260325000000_fix_storage_policies.sql#L37)

```sql
-- Allow authenticated users to upload category images
CREATE POLICY "Allow authenticated users to upload category images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'category-images' AND auth.uid() IS NOT NULL);

-- Allow public read of category images
CREATE POLICY "Allow public read of category images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'category-images');
```

---

## 4. USER/ORDER TYPES IN CODE

### Mentions of User Types
**Found in** [src/pages/Auth.tsx](src/pages/Auth.tsx):
- `accountType: "customer" | "admin"` (signup form)
- Maps to user_roles table: customer → 'user', admin → 'admin'

**NOT Found**:
- ❌ duty_clerk
- ❌ shipping_clerk  
- ❌ dispatch_rider
- ❌ management (implied by 'admin' but not explicitly named)

### Chat Interface Types
**Location**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L80)

```sql
CREATE TABLE public.chat_messages (
  ...
  interface_type TEXT NOT NULL CHECK (interface_type IN ('customer', 'management')),
  ...
);
```

Two chat interfaces:
- **customer** - Customer support chat
- **management** - Admin management chat

---

## 5. DATABASE SCHEMA

### Core Tables

**Orders Table**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L33)

```sql
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',  -- ⚠️ String, not enum
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Order Items Table**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L50)

```sql
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL
);
```

**No customer_id or user_id foreign key** → Orders are not linked to authenticated users, only by email.

### Related Tables

**Products**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L10)
```sql
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  category_id UUID REFERENCES public.categories(id),
  image_url TEXT,
  unit TEXT NOT NULL DEFAULT 'each',
  badge TEXT,
  in_stock BOOLEAN NOT NULL DEFAULT true,
  cost_price NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Inventory**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L28)
```sql
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  last_restocked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Sales Log**: [supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql](supabase/migrations/20260324054547_eb770312-6085-4e6e-9b3e-ec7a9a180b6b.sql#L60)
```sql
CREATE TABLE public.sales_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  revenue NUMERIC(10,2) NOT NULL,
  cost NUMERIC(10,2),
  profit NUMERIC(10,2),
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## 6. DASHBOARD/ADMIN COMPONENTS

### Dashboard Page
**Location**: [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)

```typescript
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "sales" | "inventory" | "orders" | "products" | "manage" | "ai"
  >("overview");
  
  const {
    stats,
    salesByProduct,
    categoryRevenue,
    dailySales,
    inventory,
    recentOrders,
    allProducts,
    allCategories,
    editProduct,
    editCategory,
    setEditProduct,
    setEditCategory,
    fetchData,
    updateOrderStatus,
  } = useDashboard();
```

**Tabs Available**:
1. **Overview** - Stats dashboard (OverviewTab)
2. **Sales** - Revenue analytics (SalesTab)
3. **Inventory** - Stock management (InventoryTab)
4. **Orders** - Order management (OrdersTab)
5. **Add Products** - Product creation (AddProductsTab)
6. **Manage** - Product/category editing (ManageTab)
7. **AI** - AI insights (AIInsightsTab)

### useDashboard Hook
**Location**: [src/hooks/useDashboard.ts](src/hooks/useDashboard.ts)

**Data Fetching**:
- `ProductRepository.fetchProducts()` - All products
- `InventoryRepository.fetchInventory()` - Stock levels
- `AnalyticsRepository.fetchSalesData(100)` - Sales history
- `OrderRepository.fetchOrders(50)` - Recent orders
- `ProductRepository.fetchCategories()` - Categories

**Features**:
- Compute stats: revenue, profit, low stock, pending orders, etc.
- Sales by product analysis
- Category revenue breakdown
- Daily sales trends
- Order status updates

### Access Control
✅ **Protected**: `/dashboard` route wrapped in `ProtectedRoute`
✅ **UI Hidden**: Dashboard link only shows if `isAdmin === true`
❌ **Limited**: All admin operations require ONLY the 'admin' role; no granular permissions

---

## 7. CURRENT LIMITATIONS

### A. Role-Based
1. **Only 3 roles** defined but only **2 actively used** (admin, user)
2. **Moderator role** not used anywhere
3. **No logistics roles**: duty_clerk, shipping_clerk, dispatch_rider not implemented
4. **Binary access**: Either admin or not; no department-level permissions

### B. Order Management
1. **No user-order relationship**: Orders not linked to `auth.users.id`
   - Can't track which customer placed an order (only email/name)
   - Can't show order history via user profile
2. **Order status** is a TEXT field, not enum (could be inconsistent)
3. **No order assignment** to specific staff/roles for handling

### C. Authentication
1. **Hardcoded admin check**: `hasRole(..., 'admin')` hardcoded in frontend logic
2. **No permission granularity**: Can't check for specific actions per feature
3. **No audit trail**: No logging of who changed what and when

### D. Access Control
1. **Navbar conditionally hides** dashboard link but doesn't prevent direct `/dashboard` access (only ProtectedRoute stops it)
2. **Storage bucket policies** allow ANY authenticated user to upload (not admin-only)
3. **RLS policies** are admin-centric with no room for other roles

### E. Missing Implementations
- ❌ No role assignment UI (only hardcoded in signup trigger)
- ❌ No permission inheritance or grouping
- ❌ No feature flags based on role
- ❌ No API endpoint-level role validation (relying purely on RLS)

---

## 8. SUMMARY TABLE

| Aspect | Status | Details |
|--------|--------|---------|
| **Auth Provider** | ✅ Implemented | Supabase Auth + JWT |
| **Role Definition** | ⚠️ Partial | 3 roles, 2 used, 0 logistics |
| **Role Assignment** | ✅ Automated | Via signup trigger |
| **Route Protection** | ✅ Yes | ProtectedRoute component |
| **UI Conditional Rendering** | ✅ Yes | Navbar links, dashboard badge |
| **RLS Policies** | ✅ Yes | has_role() function + policies |
| **Storage Policies** | ✅ Yes | Auth-based bucket access |
| **Order-User Link** | ❌ No | Orders only track email |
| **Granular Permissions** | ❌ No | Admin/not admin only |
| **Audit Logging** | ❌ No | No change tracking |
| **Logistics Roles** | ❌ No | Not implemented |

---

## 9. RECOMMENDATIONS

### Immediate (High Priority)
1. **Add missing roles** to enum and create signup options
2. **Fix order-user relationship** by adding `user_id` FK to orders table
3. **Enable role assignment UI** in dashboard for admins

### Medium Priority
1. Implement permission-based RLS (e.g., `can_update_orders`, `can_manage_inventory`)
2. Create role-specific dashboard views
3. Add audit logging for data changes

### Long-term
1. Implement feature flags per role
2. Add API endpoint validation (not just RLS)
3. Create admin panel for role/permission management
