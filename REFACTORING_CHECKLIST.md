# Refactoring Checklist & Action Items

## 📋 Overview Refactoring Tasks

This document provides a actionable checklist for implementing the refactorings outlined in the Technical Audit Report.

---

## Phase 1: Foundation (Week 1) ✅ Setup Complete

### ✅ Repository Layer Created
- [x] ProductRepository - [src/lib/repositories/productRepository.ts](src/lib/repositories/productRepository.ts)
- [x] OrderRepository - [src/lib/repositories/orderRepository.ts](src/lib/repositories/orderRepository.ts)
- [x] AnalyticsRepository - [src/lib/repositories/analyticsRepository.ts](src/lib/repositories/analyticsRepository.ts)

**Next:** Update components to use repositories instead of direct Supabase calls

### ✅ Service Layer Created
- [x] PricingService - [src/lib/services/pricingService.ts](src/lib/services/pricingService.ts)
- [x] AnalyticsService - [src/lib/services/analyticsService.ts](src/lib/services/analyticsService.ts)
- [x] ChatService - [src/lib/services/chatService.ts](src/lib/services/chatService.ts)

**Next:** Migrate components to use services

### ✅ Constants File Created
- [x] Central constants - [src/lib/constants.ts](src/lib/constants.ts)

**Next:** Replace hardcoded values throughout codebase

---

## Phase 2: Refactor Components (Week 2)

### Task 2.1: Refactor Dashboard Component
**File:** [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
**Priority:** 🔴 HIGH
**Estimated Effort:** 3 hours

**Steps:**
- [ ] Create [src/hooks/useDashboard.ts](src/hooks/useDashboard.ts)
  - Move data fetching logic to AnalyticsRepository
  - Move calculations to AnalyticsService
  - State management only in hook
- [ ] Extract tab components:
  - [ ] [src/components/Dashboard/OverviewTab.tsx](src/components/Dashboard/OverviewTab.tsx)
  - [ ] [src/components/Dashboard/SalesTab.tsx](src/components/Dashboard/SalesTab.tsx)
  - [ ] [src/components/Dashboard/InventoryTab.tsx](src/components/Dashboard/InventoryTab.tsx)
  - [ ] [src/components/Dashboard/OrdersTab.tsx](src/components/Dashboard/OrdersTab.tsx)
  - [ ] [src/components/Dashboard/ProductsTab.tsx](src/components/Dashboard/ProductsTab.tsx)
  - [ ] [src/components/Dashboard/ManageTab.tsx](src/components/Dashboard/ManageTab.tsx)
  - [ ] [src/components/Dashboard/AIInsightsTab.tsx](src/components/Dashboard/AIInsightsTab.tsx)
- [ ] Simplify main Dashboard component to use tabs config
- [ ] Replace hardcoded status config with DASHBOARD_TABS from constants

**Before:** 300+ lines, 15+ state variables
**After:** ~50 lines, clean tab routing

---

### Task 2.2: Migrate All Components to UseRepository Pattern
**Priority:** 🔴 HIGH
**Estimated Effort:** 2 hours

**Files to Update:**
- [ ] [src/pages/Shop.tsx](src/pages/Shop.tsx)
  - [ ] Replace direct `supabase.from("products").select()` with `ProductRepository.fetchProducts()`
  - [ ] Use constants for sorting options
  
- [ ] [src/components/AddProductForm.tsx](src/components/AddProductForm.tsx)
  - [ ] Replace `supabase.from("products").insert()` with `ProductRepository.createProduct()`
  - [ ] Replace `supabase.from("categories").select()` with `CategoryRepository.fetchCategories()`
  - [ ] Update inventory creation separately
  
- [ ] [src/components/EditProductDialog.tsx](src/components/EditProductDialog.tsx)
  - [ ] Replace `supabase.from("products").update()` with `ProductRepository.updateProduct()`
  
- [ ] [src/components/AddCategoryForm.tsx](src/components/AddCategoryForm.tsx)
  - [ ] Replace direct Supabase calls with `CategoryRepository` methods

**Checklist per file:**
- [ ] Import appropriate repository
- [ ] Replace all `supabase.from().select()` calls
- [ ] Replace all `supabase.from().insert()` calls
- [ ] Replace all `supabase.from().update()` calls
- [ ] Remove Supabase imports if no longer used

---

### Task 2.3: Refactor useChat Hook
**File:** [src/hooks/useChat.ts](src/hooks/useChat.ts)
**New File:** [src/hooks/useChatRefactored.ts](src/hooks/useChatRefactored.ts) ✅ Created
**Priority:** 🔴 HIGH
**Estimated Effort:** 1 hour

**Steps:**
- [ ] Update [src/components/CustomerChat.tsx](src/components/CustomerChat.tsx)
  - [ ] Import `useChatRefactored` instead of `useChat`
  - [ ] Test that chat still works
  
- [ ] Mark original `useChat` as deprecated
- [ ] Plan: Remove original hook after testing new one

**Result:** Separates streaming logic from React state management

---

### Task 2.4: Refactor Checkout Component
**File:** [src/pages/Checkout.tsx](src/pages/Checkout.tsx)
**New File:** [src/pages/CheckoutRefactored.tsx](src/pages/CheckoutRefactored.tsx) ✅ Created
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 1 hour

**Steps:**
- [ ] Update [src/App.tsx](src/App.tsx)
  - [ ] Change import: `import Checkout from "./pages/CheckoutRefactored"`
  - [ ] Test full checkout flow
  
- [ ] Verify PricingService calculations match original
- [ ] Update useFormState usage if needed
- [ ] Remove original Checkout.tsx after verification

**Result:** Uses PricingService for calculations, cleaner form handling

---

## Phase 3: Eliminate Duplication (Week 3)

### Task 3.1: Create Shared ProductForm Component
**New File:** [src/components/Forms/ProductForm.tsx](src/components/Forms/ProductForm.tsx)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 2 hours

**Steps:**
- [ ] Create ProductForm component with shared logic
- [ ] Extract form fields (name, price, category, image, etc.)
- [ ] Use `useFormState` hook for state management
- [ ] Use `useImageUpload` hook for image handling
- [ ] Support both "Add" and "Edit" modes via props
- [ ] Handle onSubmit callback pattern

**Result:** Single source of truth for product form

---

### Task 3.2: Refactor AddProductForm
**File:** [src/components/AddProductForm.tsx](src/components/AddProductForm.tsx)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 30 min

**Steps:**
- [ ] Import ProductForm component
- [ ] Create wrapper component that:
  - [ ] Calls `ProductRepository.createProduct()`
  - [ ] Calls `onProductAdded()` callback
  - [ ] Shows appropriate toast messages
- [ ] Remove duplicated form logic

**Result:** Reduced from ~160 lines to ~40 lines

---

### Task 3.3: Refactor EditProductDialog
**File:** [src/components/EditProductDialog.tsx](src/components/EditProductDialog.tsx)
**Priority:** 🟡 MEDIUM
**Estimated Effort:** 30 min

**Steps:**
- [ ] Import ProductForm component
- [ ] Wrap ProductForm in Dialog component
- [ ] Create handler that calls `ProductRepository.updateProduct()`
- [ ] Handle React Query cache invalidation
- [ ] Remove duplicated form logic

**Result:** Reduced from ~160 lines to ~50 lines

---

## Phase 4: Polish & Testing (Week 4)

### Task 4.1: Add Error Handling Service
**New File:** [src/lib/services/errorService.ts](src/lib/services/errorService.ts)
**Priority:** 🟢 LOW
**Estimated Effort:** 1 hour

**Steps:**
- [ ] Create ErrorService class with:
  - [ ] `formatError()` - standardize error formatting
  - [ ] `handleError()` - log and report errors
  - [ ] `isNetworkError()` - check for network issues
  - [ ] `isValidationError()` - check for validation issues
  
- [ ] Create [src/hooks/useErrorHandler.ts](src/hooks/useErrorHandler.ts)
  - [ ] Integrate with toast notifications
  - [ ] Consistent error UI

- [ ] Update components to use error handler

**Result:** Unified error handling across app

---

### Task 4.2: Add Type Safety
**New File:** [src/types/database.ts](src/types/database.ts)
**Priority:** 🟢 LOW
**Estimated Effort:** 1.5 hours

**Steps:**
- [ ] Create comprehensive types for all Supabase tables:
  - [ ] DbProduct
  - [ ] DbCategory
  - [ ] DbOrder
  - [ ] DbOrderItem
  - [ ] DbInventory
  - [ ] DbSalesLog
  - [ ] DbUser (if applicable)
  
- [ ] Replace all `any` types in codebase:
  - [ ] [src/pages/Dashboard.tsx](src/pages/Dashboard.tsx)
  - [ ] [src/components/EditProductDialog.tsx](src/components/EditProductDialog.tsx)
  - [ ] Other files with `any` types

**Result:** Full type safety, IDE autocompletion

---

### Task 4.3: Add Unit Tests
**New Files:**
- [ ] [src/lib/services/__tests__/pricingService.test.ts](src/lib/services/__tests__/pricingService.test.ts)
- [ ] [src/lib/services/__tests__/analyticsService.test.ts](src/lib/services/__tests__/analyticsService.test.ts)
- [ ] [src/hooks/__tests__/useFormState.test.ts](src/hooks/__tests__/useFormState.test.ts)

**Priority:** 🟢 LOW
**Estimated Effort:** 2 hours

**Test Coverage:**
- [ ] PricingService calculations
- [ ] AnalyticsService aggregations
- [ ] Form state management
- [ ] Chat streaming (new patterns)

**Result:** >80% test coverage for services

---

### Task 4.4: Extract More Custom Hooks
**New Files:**
- [ ] [src/hooks/useLocalStorage.ts](src/hooks/useLocalStorage.ts)
- [ ] [src/hooks/useAsync.ts](src/hooks/useAsync.ts) - Already in useFormHelpers
- [ ] [src/hooks/useValidation.ts](src/hooks/useValidation.ts) - Already in useFormHelpers

**Priority:** 🟢 LOW
**Estimated Effort:** 1 hour

**Result:** Reusable utility hooks

---

## 🎯 Testing Checklist

After each refactoring, verify:

### Functionality Testing
- [ ] Dashboard loads and displays data
- [ ] Products can be added/edited
- [ ] Chat works correctly
- [ ] Checkout flow completes
- [ ] Cart operations work

### Integration Testing
- [ ] Repository changes don't break components
- [ ] Service refactoring produces same results
- [ ] All data flows correctly through new layers

### Performance Testing
- [ ] No additional render cycles
- [ ] Page load time not impacted
- [ ] Dashboard doesn't lag with many items

### Type Safety Testing
- [ ] No more `any` types (except when necessary)
- [ ] TypeScript compilation succeeds
- [ ] IDE autocompletion works

---

## 📊 Refactoring Metrics

Track progress with these metrics:

### Code Quality
- [ ] Lines of code (reduce duplication)
  - Start: ~3000 lines
  - Target: ~2200 lines (26% reduction)
  
- [ ] Cyclomatic complexity
  - Dashboard: 8 → 2
  - Components average: 4 → 2

- [ ] Test coverage
  - Start: ~10%
  - Target: ~60%

### Architecture
- [ ] Components directly importing Supabase: 0 (all use repos)
- [ ] `any` types in codebase: 0
- [ ] Duplicate form logic: 0 (unified in ProductForm)
- [ ] Services for business logic: 6+

### Developer Experience
- [ ] Time to add new feature: reduced by 40%
- [ ] Time to fix bug: reduced by 30%
- [ ] Onboarding time: reduced by 25%

---

## 🚀 Release Plan

### Version 1.1.0 (After Phase 1-2)
- Repository and Service layers implemented
- Dashboard refactored
- useChat refactored
- Checkout refactored

### Version 1.2.0 (After Phase 3)
- ProductForm unified
- AddProductForm simplified
- EditProductDialog simplified
- Code duplication eliminated

### Version 1.3.0 (After Phase 4)
- Error handling unified
- Type safety improved
- Unit tests added
- Hooks library expanded

---

## 📝 Notes

- All refactorings maintain backward compatibility until old code is removed
- Features don't change, only internal structure
- Existing tests should continue to pass
- Plan for 2-3 week completion timeline
- Prioritize high-priority items first for maximum impact

---

**Last Updated:** March 25, 2026
**Maintained By:** Development Team
**Next Review:** After Phase 2 completion
