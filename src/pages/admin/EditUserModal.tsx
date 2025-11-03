import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'manager' | 'staff';
  store_id: string | null;
  is_active: boolean;
}

interface EditUserModalProps {
  user: User;
  stores: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
  onToggleActive: (userId: string, currentStatus: boolean) => void;
}

export function EditUserModal({ user, stores, onClose, onSuccess, onToggleActive }: EditUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name,
    phone: user.phone || '',
    role: user.role,
    store_id: user.store_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role,
          store_id: formData.store_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success('User updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="input-field"
                placeholder="Enter full name"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="input-field"
              >
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Store */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Assign to Store
              </label>
              <select
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                className="input-field"
              >
                <option value="">No Store (Admin Only)</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Toggle */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-secondary-900">User Status</p>
                  <p className="text-xs text-secondary-500">
                    {user.is_active ? 'User can access the system' : 'User is blocked from accessing the system'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleActive(user.id, user.is_active)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    user.is_active
                      ? 'bg-red-100 text-red-800 hover:bg-red-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {user.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
