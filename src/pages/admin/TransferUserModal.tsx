import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface User {
  id: string;
  full_name: string;
  role: 'admin' | 'manager' | 'staff';
  store_id: string | null;
  store_name?: string;
}

interface TransferUserModalProps {
  user: User;
  stores: { id: string; name: string }[];
  onClose: () => void;
  onSuccess: () => void;
}

export function TransferUserModal({ user, stores, onClose, onSuccess }: TransferUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [targetStoreId, setTargetStoreId] = useState('');

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!targetStoreId) {
      toast.error('Please select a target store');
      return;
    }

    if (targetStoreId === user.store_id) {
      toast.error('User is already in this store');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          store_id: targetStoreId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      
      const targetStore = stores.find(s => s.id === targetStoreId);
      toast.success(`User transferred to ${targetStore?.name || 'new store'} successfully`);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to transfer user');
      console.error('Error transferring user:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStore = stores.find(s => s.id === user.store_id);
  const availableStores = stores.filter(s => s.id !== user.store_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Transfer User</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleTransfer} className="p-4 sm:p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-secondary-900 mb-2">User Details</h3>
            <div className="space-y-1">
              <p className="text-sm text-secondary-700">
                <span className="font-medium">Name:</span> {user.full_name}
              </p>
              <p className="text-sm text-secondary-700">
                <span className="font-medium">Role:</span>{' '}
                <span className="capitalize">{user.role}</span>
              </p>
            </div>
          </div>

          {/* Transfer Visualization */}
          <div className="flex items-center gap-4">
            {/* Current Store */}
            <div className="flex-1 bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <p className="text-xs font-medium text-blue-900 mb-1">Current Store</p>
              <p className="text-sm font-semibold text-blue-900">
                {currentStore?.name || (
                  <span className="text-blue-600 italic">No Store</span>
                )}
              </p>
            </div>

            {/* Arrow */}
            <ArrowRight className="w-6 h-6 text-secondary-400 flex-shrink-0" />

            {/* Target Store */}
            <div className="flex-1 bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <p className="text-xs font-medium text-green-900 mb-1">Target Store</p>
              <p className="text-sm font-semibold text-green-900">
                {targetStoreId ? (
                  stores.find(s => s.id === targetStoreId)?.name
                ) : (
                  <span className="text-green-600 italic">Select below</span>
                )}
              </p>
            </div>
          </div>

          {/* Store Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Select Target Store <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={targetStoreId}
              onChange={(e) => setTargetStoreId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a store...</option>
              <option value="">No Store (Admin Only)</option>
              {availableStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-secondary-500">
              This will move the user to the selected store. All their permissions will remain the same.
            </p>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-medium">Note:</span> The user will immediately lose access to the current store's data and gain access to the target store's data.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
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
              {loading ? 'Transferring...' : 'Transfer User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
