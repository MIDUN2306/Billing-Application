import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface RefillRawMaterialModalProps {
  stock: {
    id: string;
    raw_material_id: string;
    raw_material_name: string;
    unit: string;
    quantity: number;
    purchase_price: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function RefillRawMaterialModal({ stock, onClose, onSuccess }: RefillRawMaterialModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: '',
    purchase_price: stock.purchase_price.toString(),
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    const quantity = parseFloat(formData.quantity);
    const purchasePrice = parseFloat(formData.purchase_price);

    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (isNaN(purchasePrice) || purchasePrice < 0) {
      toast.error('Please enter a valid purchase price');
      return;
    }

    setLoading(true);
    try {
      const totalCost = quantity * purchasePrice;
      const newQuantity = stock.quantity + quantity;

      // Log the purchase
      const { error: logError } = await supabase
        .from('raw_material_purchases')
        .insert([{
          raw_material_id: stock.raw_material_id,
          store_id: currentStore.id,
          quantity,
          unit: stock.unit,
          purchase_price: purchasePrice,
          total_cost: totalCost,
          notes: formData.notes || null,
        }]);

      if (logError) throw logError;

      // Update stock
      const { error: updateError } = await supabase
        .from('raw_material_stock')
        .update({
          quantity: newQuantity,
          purchase_price: purchasePrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', stock.id);

      if (updateError) throw updateError;

      toast.success(`Successfully added ${quantity} ${stock.unit} of ${stock.raw_material_name}`);
      onSuccess();
    } catch (error: any) {
      console.error('Error refilling stock:', error);
      toast.error(error.message || 'Failed to refill stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-display font-bold text-secondary-900">
              Refill Stock
            </h2>
            <p className="text-sm text-secondary-600 mt-1">{stock.raw_material_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-secondary-500 mb-1">Current Stock</p>
                <p className="text-lg font-bold text-secondary-900">
                  {stock.quantity} {stock.unit}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-secondary-500 mb-1">Last Price</p>
                <p className="text-lg font-bold text-secondary-900">
                  ₹{stock.purchase_price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Quantity to Add */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Quantity to Add *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter quantity"
                autoFocus
              />
              <div className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-secondary-700 font-medium min-w-[80px] flex items-center justify-center">
                {stock.unit}
              </div>
            </div>
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Purchase Price per {stock.unit} *
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.purchase_price}
              onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          {/* Total Cost Preview */}
          {formData.quantity && formData.purchase_price && (
            <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary-900">Total Cost</p>
                <p className="text-xl font-bold text-primary-900">
                  ₹{(parseFloat(formData.quantity) * parseFloat(formData.purchase_price)).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add any notes about this purchase..."
              rows={3}
            />
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
              {loading ? 'Adding...' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
