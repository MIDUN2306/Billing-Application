import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface AddProductModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddProductModal({ onClose, onSuccess }: AddProductModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unit: 'pcs',
    mrp: '',
    quantity: '0',
  });

  const generateSKU = () => {
    if (!formData.name) {
      toast.error('Please enter product name first');
      return;
    }
    const prefix = formData.name.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData({ ...formData, sku: `${prefix}-${random}` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    if (!formData.name.trim()) {
      toast.error('Please enter product name');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        sku: formData.sku || null,
        category: formData.category || null,
        unit: formData.unit,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        quantity: parseInt(formData.quantity) || 0,
        store_id: currentStore.id,
        is_active: true,
      };

      const { error } = await supabase
        .from('products')
        .insert([productData]);

      if (error) throw error;

      toast.success('Product added successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-display font-bold text-secondary-900">
            Add New Product
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Tea, Coffee, Biscuits"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              <option value="Beverages">Beverages</option>
              <option value="Cold Beverages">Cold Beverages</option>
              <option value="Consumable">Consumable</option>
              <option value="Bun">Bun</option>
              <option value="Cutlets">Cutlets</option>
              <option value="Laddu">Laddu</option>
              <option value="Parcel">Parcel</option>
              <option value="Momos">Momos</option>
              <option value="Puff & Cakes">Puff & Cakes</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Snacks">Snacks</option>
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Unit *
            </label>
            <select
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="pcs">Pieces</option>
              <option value="kg">Kilogram</option>
              <option value="ltr">Liter</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="cup">Cup</option>
              <option value="glass">Glass</option>
              <option value="packet">Packet</option>
              <option value="plate">Plate</option>
            </select>
          </div>

          {/* SKU and MRP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                SKU
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="TEA-001"
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-3 py-2 bg-gray-100 text-secondary-700 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                >
                  Gen
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Price (MRP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Initial Quantity */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Initial Quantity
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Starting stock quantity (can be updated later)
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
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
