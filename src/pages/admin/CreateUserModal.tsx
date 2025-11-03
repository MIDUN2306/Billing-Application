import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface CreateUserModalProps {
  stores: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({ stores, onClose, onSuccess }: CreateUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'staff' as 'admin' | 'manager' | 'staff',
    store_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim() || !formData.full_name.trim()) {
      toast.error('Email, password, and full name are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name.trim(),
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Wait a moment for any potential trigger to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (existingProfile) {
        // Profile exists, update it
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim() || null,
            role: formData.role,
            store_id: formData.store_id || null,
            is_active: true,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      } else {
        // Profile doesn't exist, insert it
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: formData.full_name.trim(),
            phone: formData.phone.trim() || null,
            role: formData.role,
            store_id: formData.store_id || null,
            is_active: true,
          });

        if (profileError) throw profileError;
      }

      toast.success('User created successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Create New User</h2>
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="Enter email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="Enter password (min 6 chars)"
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
              <p className="mt-1 text-xs text-secondary-500">
                Users must be assigned to a store to access store-specific features
              </p>
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
