import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface Store {
  id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gst_number: string | null;
  is_active: boolean;
}

interface EditStoreModalProps {
  store: Store;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditStoreModal({ store, onClose, onSuccess }: EditStoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: store.name,
    owner_name: store.owner_name || '',
    phone: store.phone || '',
    email: store.email || '',
    address: store.address || '',
    gst_number: store.gst_number || '',
    is_active: store.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Store name is required');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name.trim(),
          owner_name: formData.owner_name.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          gst_number: formData.gst_number.trim() || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (error) throw error;
      toast.success('Store updated successfully');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update store');
      console.error('Error updating store:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Edit Store</h2>
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
            {/* Store Name */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-field"
                placeholder="Enter store name"
              />
            </div>

            {/* Owner Name */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Owner Name
              </label>
              <input
                type="text"
                value={formData.owner_name}
                onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                className="input-field"
                placeholder="Enter owner name"
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

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                placeholder="Enter email"
              />
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                className="input-field"
                placeholder="Enter GST number"
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="Enter store address"
              />
            </div>

            {/* Status */}
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-primary-800 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-secondary-700">Active</span>
              </label>
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
