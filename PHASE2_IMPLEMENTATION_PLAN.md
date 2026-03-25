# Phase 2: Frontend RBAC Implementation
## Smart Cart AI - MSSE Capstone Project

**Status**: Ready to start  
**Scope**: Role-based navigation, dashboards, and user management  
**Estimated time**: 2-3 weeks  
**Deliverables**: 8 components + role system + authentication updates  

---

## 📋 Phase 2 Strategic Approach

### Phase 2A: Foundation (Days 1-3)
Build the core infrastructure for role-based access:
1. **Role fetching system** - Query Supabase for user role
2. **AuthContext enhancement** - Store role in global state
3. **Role hook** - `useUserRole()` for components
4. **Protected routes** - `PrivateRoute` wrapper with role checking
5. **Role enum** - TypeScript types for all 5 roles

### Phase 2B: Navigation & Layout (Days 4-6)
Role-aware UI components:
1. **Enhanced Navbar** - Show different links per role
2. **Sidebar** (optional) - Dashboard navigation per role
3. **Role redirect** - Auto-route users to their dashboard
4. **Logout button** - Clear role on logout

### Phase 2C: Customer Dashboard (Days 7-9)
Customer-facing features:
1. **My Orders page** - View order history + status
2. **Order details** - Items, total, timeline
3. **Live tracking** - Track delivery in real-time
4. **Order status UI** - Visual timeline (pending → delivered)

### Phase 2D: Staff Dashboards (Days 10-17)
Staff workflow interfaces:
1. **Duty Clerk Dashboard** - Order confirmation workflow
2. **Shipping Clerk Dashboard** - Item picking workflow
3. **Dispatch Rider Dashboard** - Delivery tracking
4. **Staff assignment** - See/claim orders in queue

### Phase 2E: Management Dashboard (Days 18-21)
Analytics & oversight:
1. **Order analytics** - Charts by status
2. **Staff performance** - Orders completed per person
3. **Audit log viewer** - See all changes
4. **Role management** - Assign roles to users

---

## 🗂️ Folder Structure (After Phase 2)

```
src/
├── components/
│   ├── RBAC/
│   │   ├── PrivateRoute.tsx        (Route guard by role)
│   │   ├── RoleProvider.tsx        (Global role context)
│   │   └── RoleCheck.tsx           (Conditional render by role)
│   ├── Navbar.tsx                  (Enhanced with role links)
│   ├── Sidebar.tsx                 (New - role-based nav)
│   └── dashboard/
│       ├── CustomerDashboard.tsx   (My Orders)
│       ├── DutyClerkDashboard.tsx  (Order confirmation)
│       ├── ShippingClerkDashboard.tsx (Item picking)
│       ├── DispatchRiderDashboard.tsx (Delivery tracking)
│       └── ManagementDashboard.tsx (Analytics)
├── hooks/
│   ├── useUserRole.ts              (Get current role)
│   ├── useOrderStatus.ts           (Order list + filters)
│   └── useRolePermissions.ts       (Check if user can do X)
├── types/
│   └── roles.ts                    (TypeScript enums)
├── lib/
│   ├── rolePermissions.ts          (Role capabilities matrix)
│   └── roleRoutes.ts               (Route config per role)
└── pages/
    ├── Dashboard.tsx               (Role redirect hub)
    ├── RoleManagement.tsx          (Admin - assign roles)
    └── ... (existing pages)
```

---

## 🔧 Phase 2A Implementation: Foundation

### Step 1: TypeScript Role Types
```typescript
// src/types/roles.ts
export type UserRole = 
  | 'customer'
  | 'duty_clerk'
  | 'shipping_clerk'
  | 'dispatch_rider'
  | 'management';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
}
```

### Step 2: Role Context Provider
```typescript
// src/components/RBAC/RoleProvider.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/roles';

interface RoleContextType {
  role: UserRole | null;
  loading: boolean;
  isRole: (role: UserRole) => boolean;
  isAnyRole: (roles: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchUserRole(user.id);
  }, [user]);

  async function fetchUserRole(userId: string) {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    setRole(data?.role || 'customer');
    setLoading(false);
  }

  return (
    <RoleContext.Provider value={{
      role,
      loading,
      isRole: (r) => role === r,
      isAnyRole: (roles) => role ? roles.includes(role) : false,
    }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useUserRole = () => {
  const context = useContext(RoleContext);
  if (!context) throw new Error('useUserRole must be used within RoleProvider');
  return context;
};
```

### Step 3: Protected Route Component
```typescript
// src/components/RBAC/PrivateRoute.tsx
import { Navigate } from 'react-router-dom';
import { useUserRole } from './RoleProvider';
import { UserRole } from '@/types/roles';

interface PrivateRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: string; // redirect path
}

export function PrivateRoute({ 
  children, 
  allowedRoles, 
  fallback = '/' 
}: PrivateRouteProps) {
  const { role, loading } = useUserRole();

  if (loading) return <LoadingSpinner />;
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={fallback} />;
  }

  return <>{children}</>;
}
```

### Step 4: Update Routing
```typescript
// src/App.tsx
import { RoleProvider } from '@/components/RBAC/RoleProvider';
import { PrivateRoute } from '@/components/RBAC/PrivateRoute';

function App() {
  return (
    <RoleProvider>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Customer */}
        <Route 
          path="/my-orders" 
          element={
            <PrivateRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </PrivateRoute>
          } 
        />

        {/* Duty Clerk */}
        <Route 
          path="/dashboard/duty-clerk" 
          element={
            <PrivateRoute allowedRoles={['duty_clerk']}>
              <DutyClerkDashboard />
            </PrivateRoute>
          } 
        />

        {/* Shipping Clerk */}
        <Route 
          path="/dashboard/shipping" 
          element={
            <PrivateRoute allowedRoles={['shipping_clerk']}>
              <ShippingClerkDashboard />
            </PrivateRoute>
          } 
        />

        {/* Dispatch Rider */}
        <Route 
          path="/dashboard/delivery" 
          element={
            <PrivateRoute allowedRoles={['dispatch_rider']}>
              <DispatchRiderDashboard />
            </PrivateRoute>
          } 
        />

        {/* Management */}
        <Route 
          path="/dashboard/analytics" 
          element={
            <PrivateRoute allowedRoles={['management']}>
              <ManagementDashboard />
            </PrivateRoute>
          } 
        />

        {/* Admin: Role Management */}
        <Route 
          path="/admin/roles" 
          element={
            <PrivateRoute allowedRoles={['management']}>
              <RoleManagement />
            </PrivateRoute>
          } 
        />
      </Routes>
    </RoleProvider>
  );
}
```

---

## 📊 Phase 2 Deliverables

### 1. Core RBAC System (3 files)
- [ ] `RoleProvider.tsx` - Context + hooks
- [ ] `PrivateRoute.tsx` - Route protection
- [ ] `types/roles.ts` - TypeScript types

### 2. Navigation (2 files)
- [ ] Enhanced `Navbar.tsx` (role-aware links)
- [ ] `Sidebar.tsx` (dashboard nav)

### 3. Customer Features (3 files)
- [ ] `CustomerDashboard.tsx` - My Orders
- [ ] `OrderTimeline.tsx` - Status visualization
- [ ] `OrderDetails.tsx` - Item breakdown

### 4. Staff Dashboards (3 files)
- [ ] `DutyClerkDashboard.tsx` - Order confirmation
- [ ] `ShippingClerkDashboard.tsx` - Picking workflow
- [ ] `DispatchRiderDashboard.tsx` - Delivery tracking

### 5. Management (2 files)
- [ ] `ManagementDashboard.tsx` - Analytics
- [ ] `RoleManagement.tsx` - User role assignment

### 6. Hooks (3 files)
- [ ] `useUserRole.ts` - Get current role
- [ ] `useOrderStatus.ts` - Fetch orders by role
- [ ] `useRolePermissions.ts` - Check capabilities

### 7. Utilities (2 files)
- [ ] `rolePermissions.ts` - RBAC matrix
- [ ] `roleRoutes.ts` - Route configuration

---

## 🎯 Key Features by Role

### 👤 Customer
- View my orders
- Track order status
- See delivery in real-time
- Cancel order (pending only)

### 📋 Duty Clerk
- View pending orders (queue)
- Click "Confirm" → status = confirmed
- Click "Cancel" → status = cancelled
- See order confirmation timeline

### 📦 Shipping Clerk
- View confirmed orders (picking queue)
- Check off items as picked
- Click "Done Picking" → status = picked
- See quantity needed vs picked

### 🚚 Dispatch Rider
- View picked orders (delivery queue)
- See destination address on map
- Mark as delivered
- Upload delivery proof (photo)

### 📊 Management
- Dashboard with order analytics
- See staff performance metrics
- View audit log (who changed what)
- Assign/change user roles
- Generate reports

---

## 📈 Testing Strategy

### Unit Tests
- [ ] `useUserRole()` hook
- [ ] `PrivateRoute` protection
- [ ] Role permission checks

### Integration Tests
- [ ] Customer logs in → sees "My Orders"
- [ ] Duty clerk logs in → sees confirmation queue
- [ ] Shipping clerk logs in → sees picking queue
- [ ] Dispatch rider logs in → sees delivery queue

### E2E Tests (Playwright)
- [ ] Complete order flow: customer → duty clerk → shipping clerk → dispatch rider
- [ ] Role assignment changes permissions
- [ ] Unauthorized access redirects

---

## 📚 Documentation (For Capstone)

### Architecture Document
- RBAC design decisions
- Role-based access control flow
- Data security model

### User Manual
- How to use each role dashboard
- Screenshots of each interface
- Step-by-step workflows

### Technical Guide
- Hook documentation
- Component API
- Extending with new roles

### Deployment Guide
- Environment setup
- Database role assignment
- Testing checklist

---

## 🚀 Phase 2 Timeline

| Week | Days | Deliverables |
|------|------|--------------|
| 1 | 1-3 | Foundation (Context, hooks, types) |
| 1 | 4-6 | Navigation (Navbar, Sidebar, routes) |
| 2 | 7-9 | Customer dashboard + order tracking |
| 2 | 10-13 | Duty clerk + Shipping clerk dashboards |
| 3 | 14-17 | Dispatch rider dashboard |
| 3 | 18-21 | Management dashboard + analytics |
| 3 | 22-23 | Testing + documentation |

---

## ✅ Success Criteria

**Phase 2 is complete when:**
- ✅ All 5 roles have functional dashboards
- ✅ Role-based access control working
- ✅ Navigation shows only role-appropriate links
- ✅ Order status updates reflect in UI
- ✅ Staff can complete workflows (confirm → pick → deliver)
- ✅ Management can view analytics
- ✅ All components tested
- ✅ Documentation complete

---

## 🎓 Capstone Quality Standards

This implementation will demonstrate:
- ✅ **Architecture**: Scalable RBAC pattern
- ✅ **Best Practices**: React hooks, TypeScript, context API
- ✅ **Security**: Role-based access control at UI + DB layers
- ✅ **UX**: Intuitive role-specific workflows
- ✅ **Testing**: Comprehensive test coverage
- ✅ **Documentation**: Professional technical docs
- ✅ **Code Quality**: Clean, maintainable, well-commented

---

## 🎬 Ready to start?

I recommend building in this order:

**Week 1 Priority** (foundation):
1. First: Role provider & hooks
2. Then: Enhanced Navbar
3. Then: PrivateRoute protection

**Once foundation works** → build dashboards per role

Let me know when you're ready and I'll start with the RoleProvider implementation! Insha Allah! 🙏
