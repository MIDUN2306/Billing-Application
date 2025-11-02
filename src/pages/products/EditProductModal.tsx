import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface EditProductModalProps {
  product: {
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    mrp: number | null;
    quantity: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({ product, onClose, onSuccess }: EditProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name,
    sku: product.sku || '',
    unit: product.unit,
    mrp: product.mrp?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please enter product name');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        name: formData.name.trim(),
        sku: formData.sku || null,
        unit: formData.unit,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (error) throw error;

      toast.success('Product updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
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
            Edit Product
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
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="TEA-001"
              />
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

          {/* Current Quantity (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Current Quantity
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-secondary-900">
              {product.quantity} {product.unit}
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              Use the Refill button to add more stock
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
              {loading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
