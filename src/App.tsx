import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/contexts/CartContext";
import { RoleProvider } from "@/contexts/RoleContext";
import CartDrawer from "@/components/CartDrawer";
import CustomerChat from "@/components/CustomerChat";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/RBAC/ProtectedRoute";
import { Loader2 } from "lucide-react";

import Index from "./pages/Index";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import Shop from "./pages/Shop";
import Categories from "./pages/Categories";
import Deals from "./pages/Deals";
import About from "./pages/About";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import CustomerDashboard from "./pages/CustomerDashboard";
import DutyClerkDashboard from "./pages/DutyClerkDashboard";
import ShippingClerkDashboard from "./pages/ShippingClerkDashboard";
import DispatchRiderDashboard from "./pages/DispatchRiderDashboard";
import ManagementDashboard from "./pages/ManagementDashboard";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // Data is stale after 10 minutes
      gcTime: 1000 * 60 * 30, // Cache garbage collected after 30 minutes
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnReconnect: false, // Don't refetch when reconnecting
      retry: 1, // Retry failed requests only once
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <RoleProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <CartDrawer />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/about" element={<About />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/auth" element={<Auth />} />

              {/* Customer Dashboard */}
              <Route
                path="/my-orders"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Duty Clerk Dashboard */}
              <Route
                path="/dashboard/duty-clerk"
                element={
                  <ProtectedRoute allowedRoles={['duty_clerk']}>
                    <DutyClerkDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Shipping Clerk Dashboard */}
              <Route
                path="/dashboard/shipping-clerk"
                element={
                  <ProtectedRoute allowedRoles={['shipping_clerk']}>
                    <ShippingClerkDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Dispatch Rider Dashboard */}
              <Route
                path="/dashboard/dispatch-rider"
                element={
                  <ProtectedRoute allowedRoles={['dispatch_rider']}>
                    <DispatchRiderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Admin Dashboard - Role Management */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Management Dashboard - System Overview */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['management']}>
                    <ManagementDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
            <CustomerChat />
          </CartProvider>
        </RoleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
