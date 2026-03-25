/**
 * Enhanced ProtectedRoute component
 * Supports role-based access control with fallback paths
 * Extends the basic ProtectedRoute with RBAC capabilities
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { UserRole } from '@/types/roles';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /**
   * Required roles. If empty, only requires auth.
   * User must have at least one of these roles.
   */
  allowedRoles?: UserRole[];
  /**
   * Fallback path if user doesn't have required role
   * Default: '/'
   */
  fallback?: string;
  /**
   * Optional: require both auth AND role check
   * If false, only checks role (assumes user is already auth)
   */
  requireAuth?: boolean;
}

/**
 * Protect routes based on authentication and role
 * 
 * Usage:
 * <ProtectedRoute allowedRoles={['management']}>
 *   <ManagementDashboard />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  fallback = '/',
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useRole();

  // Show loading spinner while checking auth/role
  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Check authentication if required
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role if specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to={fallback} replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Conditional render based on role
 * 
 * Usage:
 * <RoleCheck allowedRoles={['duty_clerk', 'shipping_clerk']}>
 *   <StaffOnlyComponent />
 * </RoleCheck>
 */
interface RoleCheckProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleCheck({
  children,
  allowedRoles,
  fallback = null
}: RoleCheckProps) {
  const { role } = useRole();

  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Component that only renders if user has specific capability
 * 
 * Usage:
 * <CapabilityCheck capability="canManageRoles">
 *   <RoleManagementUI />
 * </CapabilityCheck>
 */
interface CapabilityCheckProps {
  children: React.ReactNode;
  capability: 'canViewOrders' | 'canCreateOrders' | 'canUpdateOrders' | 
              'canViewAnalytics' | 'canManageRoles' | 'canViewAuditLog';
  fallback?: React.ReactNode;
}

export function CapabilityCheck({
  children,
  capability,
  fallback = null
}: CapabilityCheckProps) {
  const { hasCapability } = useRole();

  if (!hasCapability(capability)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
