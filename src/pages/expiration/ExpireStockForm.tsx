import React, { useState } from 'react';
import { AlertCircle, Package, Trash2 } from 'lucide-react';
import { useExpirationStore } from '../../stores/expirationStore';
import { SearchableSelect } from '../../components/SearchableSelect';
import type { AvailableStockItem } from '../../types/database.types';

export default function ExpireStockForm() {
  const { availableItems, expireStock, loading } = useExpirationStore();
  
  const [selectedItem, setSelectedItem] = useState<AvailableStockItem | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleItemSelect = (itemId: string) => {
    const item = availableItems.find(i => i.id === itemId);
    setSelectedItem(item || null);
    setQuantity('');
    setError('');
    setSuccess('');
  };

  // Convert available items to searchable select options
  const itemOptions = availableItems.map(item => ({
    value: item.id,
    label: item.name,
    subtitle: `${item.current_stock} ${item.unit}${item.sku ? ` • SKU: ${item.sku}` : ''}`,
    badge: item.type === 'raw_material' ? 'Raw Material' : 
           item.type === 'tea_stock' ? 'Tea Stock' : 'Product'
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedItem) {
      setError('Please select an item');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (qty > selectedItem.current_stock) {
      setError(`Insufficient stock. Available: ${selectedItem.current_stock} ${selectedItem.unit}`);
      return;
    }

    const result = await expireStock({
      itemType: selectedItem.type,
      itemId: selectedItem.id === 'tea_stock' ? null : selectedItem.id,
      itemName: selectedItem.name,
      sku: selectedItem.sku,
      quantity: qty,
      unit: selectedItem.unit,
      notes: notes.trim() || null,
    });

    if (result.success) {
      setSuccess(result.message);
      setSelectedItem(null);
      setQuantity('');
      setNotes('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trash2 className="w-5 h-5 text-red-600" />
        <h2 className="text-lg font-semibold text-gray-900">Expire Stock</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Selection with Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Item *
          </label>
          <SearchableSelect
            options={itemOptions}
            value={selectedItem?.id || ''}
            onChange={handleItemSelect}
            placeholder="Search and select item..."
            searchPlaceholder="Search by name, SKU, or type..."
          />
        </div>

        {/* Item Details (Auto-displayed) */}
        {selectedItem && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Package className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedItem.name}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  {selectedItem.sku && (
                    <div>
                      <span className="text-gray-600">SKU:</span>
                      <span className="ml-2 font-medium text-gray-900">{selectedItem.sku}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">
                      {selectedItem.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Current Stock:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {selectedItem.current_stock} {selectedItem.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Unit:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedItem.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity to Expire *
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={!selectedItem}
            />
            {selectedItem && (
              <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-medium min-w-[80px] text-center">
                {selectedItem.unit}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about the expiration..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={!selectedItem}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !selectedItem}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {loading ? 'Processing...' : 'Expire Stock'}
        </button>
      </form>
    </div>
  );
}
