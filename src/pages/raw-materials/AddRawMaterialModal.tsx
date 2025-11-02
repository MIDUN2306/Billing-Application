import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface RawMaterial {
  id: string;
  name: string;
  store_id: string;
}

interface AddRawMaterialModalProps {
  onClose: () => void;
  onSuccess: (material: RawMaterial) => void;
}

export function AddRawMaterialModal({ onClose, onSuccess }: AddRawMaterialModalProps) {
  const { currentStore } = useStoreStore();
  const [materialName, setMaterialName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentStore) return;

    const trimmedName = materialName.trim();
    if (!trimmedName) {
      toast.error('Please enter a raw material name');
      return;
    }

    setLoading(true);
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('raw_materials')
        .select('id')
        .eq('store_id', currentStore.id)
        .ilike('name', trimmedName)
        .single();

      if (existing) {
        toast.error('This raw material already exists');
        setLoading(false);
        return;
      }

      // Create new raw material
      const { data, error } = await supabase
        .from('raw_materials')
        .insert([{
          name: trimmedName,
          store_id: currentStore.id,
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success('Raw material added successfully');
      onSuccess(data);
    } catch (error: any) {
      console.error('Error adding raw material:', error);
      toast.error(error.message || 'Failed to add raw material');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
          <div>
            <h2 className="text-xl font-display font-bold text-secondary-900">
              Add New Raw Material
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Create a new material type
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-all duration-200 hover:shadow-sm"
          >
            <X className="w-6 h-6 text-secondary-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-secondary-700 uppercase tracking-wide mb-3">
              Material Name *
            </label>
            <input
              type="text"
              required
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
              placeholder="e.g., Milk, Tea Powder, Sugar"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
              autoFocus
            />
            <p className="text-xs text-secondary-500 mt-2">
              Enter a unique name for this raw material
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-base font-semibold text-secondary-700 bg-white border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-xl transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-base font-semibold text-white bg-primary-800 hover:bg-primary-900 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Adding...
                </span>
              ) : (
                'Add Material'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
