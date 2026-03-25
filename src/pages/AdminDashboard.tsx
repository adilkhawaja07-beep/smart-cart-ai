/**
 * Admin Dashboard - Staff Role Management
 * Only accessible by management role users
 * Allows admins to view all users and assign roles to staff
 */

import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  RefreshCw,
  Search,
  ChevronExpand,
  Trash2,
  User,
  Mail,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/roles';

interface UserWithRole {
  id: string;
  email: string;
  created_at: string;
  role?: UserRole;
}

const STAFF_ROLES: UserRole[] = ['duty_clerk', 'shipping_clerk', 'dispatch_rider', 'management'];

export function AdminDashboard() {
  const { user } = useAuth();
  const { role: userRole } = useRole();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');

  // Fetch all users and their roles
  const fetchUsers = async () => {
    try {
      setLoading(true);

      // Fetch all users from auth (requires admin key - we'll get them from user_roles instead)
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Fetch user emails from auth (via public profiles or hardcoded approach)
      // For now, fetch from user_roles and get basic info
      const usersMap = new Map<string, UserWithRole>();

      // Get all user IDs from roles
      if (roles && roles.length > 0) {
        roles.forEach(({ user_id, role }) => {
          if (!usersMap.has(user_id)) {
            usersMap.set(user_id, {
              id: user_id,
              email: '',
              created_at: '',
              role: role as UserRole,
            });
          }
        });
      }

      // Try to get email info from profiles or auth metadata
      // This is a workaround since we need admin auth to list users
      const usersList = Array.from(usersMap.values());
      setUsers(usersList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch users';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /**
   * Assign role to a user
   */
  async function assignRole(userId: string, newRole: UserRole) {
    if (!user) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: userId, role: newRole },
          { onConflict: 'user_id' }
        );

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Role assigned: ${newRole}`,
      });

      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign role';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  /**
   * Remove role from user (revert to customer)
   */
  async function removeRole(userId: string) {
    if (!user) return;

    try {
      setUpdating(true);

      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'customer' })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User reverted to customer role',
      });

      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update role';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      !searchTerm || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Check if user is admin
  if (userRole !== 'management') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-red-50/10 flex items-center justify-center">
        <Card className="max-w-md border-red-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Shield className="h-12 w-12 text-red-500" />
              <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
              <p className="text-muted-foreground">
                Only administrators can access this dashboard.
              </p>
              <p className="text-sm text-muted-foreground">
                Your current role: <span className="font-semibold">{userRole}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-indigo-50/10">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">👨‍💼 Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage staff roles and user assignments • Admin Only</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            disabled={updating}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-blue-600">{users.length}</div>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-green-600">
                {users.filter(u => u.role === 'management').length}
              </div>
              <p className="text-sm text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-orange-600">
                {users.filter(u => STAFF_ROLES.includes(u.role || 'customer')).length}
              </div>
              <p className="text-sm text-muted-foreground">Staff Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-3xl font-bold text-purple-600">
                {users.filter(u => u.role === 'customer').length}
              </div>
              <p className="text-sm text-muted-foreground">Customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | 'all')}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="customer">Customers</SelectItem>
              <SelectItem value="duty_clerk">Duty Clerks</SelectItem>
              <SelectItem value="shipping_clerk">Shipping Clerks</SelectItem>
              <SelectItem value="dispatch_rider">Dispatch Riders</SelectItem>
              <SelectItem value="management">Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        {filteredUsers.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">No users found</p>
              <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <Card key={u.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-semibold text-lg break-all">{u.email || u.id}</p>
                          <p className="text-xs text-muted-foreground mt-1">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>

                      {/* Current Role Badge */}
                      <div className="mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Current Role</p>
                        <Badge
                          className={
                            u.role === 'management'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'duty_clerk'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'shipping_clerk'
                              ? 'bg-yellow-100 text-yellow-800'
                              : u.role === 'dispatch_rider'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {u.role === 'customer'
                            ? 'Customer'
                            : u.role === 'duty_clerk'
                            ? 'Duty Clerk'
                            : u.role === 'shipping_clerk'
                            ? 'Shipping Clerk'
                            : u.role === 'dispatch_rider'
                            ? 'Dispatch Rider'
                            : u.role === 'management'
                            ? 'Admin'
                            : 'Unknown'}
                        </Badge>
                      </div>
                    </div>

                    {/* Role Assignment Controls */}
                    <div className="ml-4 flex flex-col gap-2 min-w-[200px]">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Assign Role</p>
                        <Select
                          value={u.role || 'customer'}
                          onValueChange={(value) => assignRole(u.id, value as UserRole)}
                          disabled={updating}
                        >
                          <SelectTrigger className="w-full text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="duty_clerk">Duty Clerk</SelectItem>
                            <SelectItem value="shipping_clerk">Shipping Clerk</SelectItem>
                            <SelectItem value="dispatch_rider">Dispatch Rider</SelectItem>
                            <SelectItem value="management">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {u.role !== 'customer' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => removeRole(u.id)}
                          disabled={updating}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove Role
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8 border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <AlertCircle className="h-5 w-5" />
              How to Assign Roles
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-900 space-y-2">
            <p>
              1. <strong>Search</strong> for a user by email address
            </p>
            <p>
              2. <strong>Select</strong> the desired role from the dropdown (Duty Clerk, Shipping Clerk, Dispatch Rider, or Admin)
            </p>
            <p>
              3. <strong>Click automatically</strong> - role is assigned immediately
            </p>
            <p>
              4. <strong>Remove</strong> any role by clicking "Remove Role" button to revert to Customer
            </p>
            <p className="mt-3 pt-3 border-t border-blue-200">
              💡 <strong>Tip:</strong> Staff members can only access their assigned dashboard. Customers can only view their own orders.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminDashboard;
