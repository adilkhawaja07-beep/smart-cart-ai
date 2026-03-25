/**
 * Hook to fetch and manage current user's role
 * Queries the user_roles table from Supabase
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types/roles';

interface UseUserRoleReturn {
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  hasAllRoles: (roles: UserRole[]) => boolean;
  refreshRole: () => Promise<void>;
}

/**
 * Fetch user's role from database
 * Falls back to 'customer' if user not found in user_roles table
 */
export function useUserRole(): UseUserRoleReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch role from database
  const fetchRole = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (queryError) {
        // User not in user_roles table - assign default 'customer' role
        console.log('User not in user_roles table, defaulting to customer', queryError);
        setRole('customer');
        return;
      }

      if (data) {
        setRole(data.role as UserRole);
      } else {
        setRole('customer');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch user role';
      console.error('Error fetching user role:', message);
      setError(message);
      setRole('customer'); // Fallback to customer on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch role when user changes
  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    fetchRole(user.id);
  }, [user, authLoading]);

  // Helper functions
  const hasRole = (targetRole: UserRole): boolean => role === targetRole;

  const hasAnyRole = (targetRoles: UserRole[]): boolean =>
    role ? targetRoles.includes(role) : false;

  const hasAllRoles = (targetRoles: UserRole[]): boolean =>
    role ? targetRoles.every(r => r === role) : false; // Note: user can only have one role

  const refreshRole = async () => {
    if (user) {
      await fetchRole(user.id);
    }
  };

  return {
    role,
    loading,
    error,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refreshRole
  };
}

export default useUserRole;
