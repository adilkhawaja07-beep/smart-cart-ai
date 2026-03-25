/**
 * Role definitions and types for RBAC system
 * Aligns with database user_role enum: customer, duty_clerk, shipping_clerk, dispatch_rider, management
 */

/**
 * All possible user roles in the system
 */
export type UserRole = 
  | 'customer'
  | 'duty_clerk'
  | 'shipping_clerk'
  | 'dispatch_rider'
  | 'management';

/**
 * User profile with role information
 */
export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

/**
 * Role capabilities matrix - defines what each role can do
 */
export const ROLE_CAPABILITIES: Record<UserRole, {
  canViewOrders: boolean;
  canCreateOrders: boolean;
  canUpdateOrders: boolean;
  canViewAnalytics: boolean;
  canManageRoles: boolean;
  canViewAuditLog: boolean;
  dashboardPath: string;
  label: string;
  description: string;
}> = {
  customer: {
    canViewOrders: true,
    canCreateOrders: true,
    canUpdateOrders: false,
    canViewAnalytics: false,
    canManageRoles: false,
    canViewAuditLog: false,
    dashboardPath: '/my-orders',
    label: 'Customer',
    description: 'View and track your orders'
  },
  duty_clerk: {
    canViewOrders: true,
    canCreateOrders: false,
    canUpdateOrders: true,
    canViewAnalytics: false,
    canManageRoles: false,
    canViewAuditLog: false,
    dashboardPath: '/dashboard/duty-clerk',
    label: 'Duty Clerk',
    description: 'Confirm and manage incoming orders'
  },
  shipping_clerk: {
    canViewOrders: true,
    canCreateOrders: false,
    canUpdateOrders: true,
    canViewAnalytics: false,
    canManageRoles: false,
    canViewAuditLog: false,
    dashboardPath: '/dashboard/shipping-clerk',
    label: 'Shipping Clerk',
    description: 'Pick items from warehouse'
  },
  dispatch_rider: {
    canViewOrders: true,
    canCreateOrders: false,
    canUpdateOrders: true,
    canViewAnalytics: false,
    canManageRoles: false,
    canViewAuditLog: false,
    dashboardPath: '/dashboard/dispatch-rider',
    label: 'Dispatch Rider',
    description: 'Track and deliver orders'
  },
  management: {
    canViewOrders: true,
    canCreateOrders: true,
    canUpdateOrders: true,
    canViewAnalytics: true,
    canManageRoles: true,
    canViewAuditLog: true,
    dashboardPath: '/admin',
    label: 'Admin',
    description: 'Manage staff and system'
  }
};

/**
 * Navigation items per role
 */
export const ROLE_NAV_ITEMS: Record<UserRole, Array<{
  label: string;
  path: string;
  icon?: string;
}>> = {
  customer: [
    { label: 'Shop', path: '/shop' },
    { label: 'Categories', path: '/categories' },
    { label: 'My Orders', path: '/my-orders' },
    { label: 'About', path: '/about' }
  ],
  duty_clerk: [
    { label: 'Order Confirmation', path: '/dashboard/duty-clerk' },
    { label: 'Back to Store', path: '/shop' }
  ],
  shipping_clerk: [
    { label: 'Warehouse Picking', path: '/dashboard/shipping-clerk' },
    { label: 'Back to Store', path: '/shop' }
  ],
  dispatch_rider: [
    { label: 'Delivery Tracking', path: '/dashboard/dispatch-rider' },
    { label: 'Back to Store', path: '/shop' }
  ],
  management: [
    { label: 'Staff Management', path: '/admin' },
    { label: 'System Overview', path: '/dashboard' },
    { label: 'Back to Store', path: '/shop' }
  ]
};

/**
 * Role hierarchy - which roles supervise which others
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  customer: [],
  duty_clerk: [],
  shipping_clerk: [],
  dispatch_rider: [],
  management: ['customer', 'duty_clerk', 'shipping_clerk', 'dispatch_rider'] // Management supervises all
};

/**
 * Check if a role has a specific capability
 */
export function hasCapability(role: UserRole, capability: keyof typeof ROLE_CAPABILITIES['management']): boolean {
  return ROLE_CAPABILITIES[role][capability] ?? false;
}

/**
 * Check if roleA can supervise roleB
 */
export function canSupervise(roleA: UserRole, roleB: UserRole): boolean {
  return ROLE_HIERARCHY[roleA].includes(roleB);
}
