/**
 * RoleProvider Context
 * Wraps the app to provide role information globally
 * Extends the useAuth hook with role-specific functionality
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { UserRole, ROLE_CAPABILITIES, ROLE_NAV_ITEMS } from '@/types/roles';

interface RoleContextType {
  // Role info
  role: UserRole | null;
  loading: boolean;
  error: string | null;

  // Helper methods
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasCapability: (capability: keyof typeof ROLE_CAPABILITIES['management']) => boolean;

  // Navigation
  getNavItems: () => Array<{ label: string; path: string; icon?: string }>;
  getDashboardPath: () => string;

  // Refresh
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

/**
 * Provider component that wraps the app
 * Must wrap the router to ensure role info is available
 */
export function RoleProvider({ children }: RoleProviderProps) {
  const { role, loading, error, hasRole, hasAnyRole, refreshRole } = useUserRole();

  // Helper: Check if user has a specific capability
  const hasCapability = (capability: keyof typeof ROLE_CAPABILITIES['management']): boolean => {
    if (!role) return false;
    const caps = ROLE_CAPABILITIES[role];
    return caps[capability] ?? false;
  };

  // Helper: Get nav items for current role
  const getNavItems = () => {
    if (!role) return [];
    return ROLE_NAV_ITEMS[role] ?? [];
  };

  // Helper: Get default dashboard path for role
  const getDashboardPath = (): string => {
    if (!role) return '/';
    return ROLE_CAPABILITIES[role].dashboardPath;
  };

  const value: RoleContextType = {
    role,
    loading,
    error,
    hasRole,
    hasAnyRole,
    hasCapability,
    getNavItems,
    getDashboardPath,
    refreshRole
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

/**
 * Hook to use role context
 * Must be used within RoleProvider
 */
export function useRole(): RoleContextType {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}

export default useRole;
