import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface AddProductNameModalProps {
  onClose: () => void;
  onSuccess: (productNameId: string) => void;
}

export function AddProductNameModal({ onClose, onSuccess }: AddProductNameModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');

  const generateSKU = () => {
    if (!productName.trim()) {
      toast.error('Please enter product name first');
      return;
    }
    const prefix = productName.trim().substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setSku(`${prefix}-${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_names')
        .insert([{
          name: productName.trim(),
          sku: sku.trim() || null,
          store_id: currentStore.id,
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('This product name or SKU already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Product name added successfully');
      onSuccess(data.id);
      onClose();
    } catch (error: any) {
      console.error('Error adding product name:', error);
      toast.error(error.message || 'Failed to add product name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-display font-bold text-secondary-900">
            Add New Product Name
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Masala Tea, Coffee, Lemon Tea"
              autoFocus
            />
            <p className="text-xs text-secondary-500 mt-1">
              This name can be reused across multiple templates
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              SKU (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., TEA-001"
              />
              <button
                type="button"
                onClick={generateSKU}
                className="px-4 py-2 bg-gray-100 text-secondary-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
              >
                Generate
              </button>
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              This SKU will be auto-filled when creating products with this name
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !productName.trim()}
            >
              {loading ? 'Adding...' : 'Add Product Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
