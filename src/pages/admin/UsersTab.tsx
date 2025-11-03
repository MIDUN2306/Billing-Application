import { useState, useEffect } from 'react';
import { Plus, Edit2, Search, ArrowRightLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { CreateUserModal } from './CreateUserModal';
import { EditUserModal } from './EditUserModal';
import { TransferUserModal } from './TransferUserModal';

interface User {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'staff';
  store_id: string | null;
  is_active: boolean;
  created_at: string;
  store_name?: string;
}

export function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [transferringUser, setTransferringUser] = useState<User | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stores
      const { data: storesData, error: storesError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (storesError) throw storesError;
      setStores(storesData || []);

      // Load users with store names
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone,
          role,
          store_id,
          is_active,
          created_at,
          stores:store_id (name)
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      const formattedUsers = (usersData || []).map((user: any) => ({
        ...user,
        store_name: user.stores?.name || null,
      }));
      
      setUsers(formattedUsers);
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadData();
    } catch (error: any) {
      toast.error('Failed to update user status');
      console.error('Error updating user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStore = storeFilter === 'all' || user.store_id === storeFilter;

    return matchesSearch && matchesRole && matchesStore;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions Bar */}
      <div className="flex flex-col gap-3">
        {/* Search and Create Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Stores</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table - Responsive */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider hidden sm:table-cell">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider hidden md:table-cell">
                Store
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider hidden lg:table-cell">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-secondary-900">
                      {user.full_name}
                    </div>
                    {user.phone && (
                      <div className="text-sm text-secondary-500">{user.phone}</div>
                    )}
                    {/* Mobile: Show role and store */}
                    <div className="sm:hidden mt-1 space-y-1">
                      <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 capitalize">
                        {user.role}
                      </span>
                      {user.store_name && (
                        <div className="text-xs text-secondary-500">
                          {user.store_name}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 hidden sm:table-cell">
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800 capitalize">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <div className="text-sm text-secondary-900">
                    {user.store_name || (
                      <span className="text-secondary-400 italic">No store</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 hidden lg:table-cell">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-secondary-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit user"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTransferringUser(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Transfer to another store"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-500">No users found</p>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          stores={stores}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          stores={stores}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            loadData();
          }}
          onToggleActive={handleToggleActive}
        />
      )}

      {transferringUser && (
        <TransferUserModal
          user={transferringUser}
          stores={stores}
          onClose={() => setTransferringUser(null)}
          onSuccess={() => {
            setTransferringUser(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
