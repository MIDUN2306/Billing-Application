import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { AddRawMaterialModal } from './AddRawMaterialModal';
import toast from 'react-hot-toast';

interface RawMaterial {
  id: string;
  name: string;
}

interface RawMaterialStockFormProps {
  stock?: any;
  onClose: () => void;
}

export function RawMaterialStockForm({ stock, onClose }: RawMaterialStockFormProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  
  const [formData, setFormData] = useState({
    raw_material_id: stock?.raw_material_id || '',
    unit: stock?.unit || 'kg',
    quantity: stock?.quantity?.toString() || '0',
    purchase_price: stock?.purchase_price?.toString() || '0',
  });

  const [priceMode, setPriceMode] = useState<'per_unit' | 'total'>('per_unit');
  const [totalPrice, setTotalPrice] = useState('0');

  useEffect(() => {
    loadRawMaterials();
  }, []);

  const loadRawMaterials = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('id, name')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setRawMaterials(data || []);
    } catch (error) {
      console.error('Error loading raw materials:', error);
    }
  };

  const handleAddMaterialSuccess = (material: RawMaterial) => {
    setRawMaterials([...rawMaterials, material]);
    setFormData({ ...formData, raw_material_id: material.id });
    setShowAddMaterialModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    // Validation
    if (!formData.raw_material_id) {
      toast.error('Please select a raw material');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Quantity must be zero or greater');
      return;
    }

    const purchasePrice = parseFloat(formData.purchase_price);
    if (isNaN(purchasePrice) || purchasePrice < 0) {
      toast.error('Purchase price must be zero or greater');
      return;
    }

    setLoading(true);
    try {
      const stockData = {
        raw_material_id: formData.raw_material_id,
        unit: formData.unit,
        quantity: quantity,
        purchase_price: purchasePrice,
        store_id: currentStore.id,
      };

      if (stock) {
        // Update existing stock
        const { error } = await supabase
          .from('raw_material_stock')
          .update(stockData)
          .eq('id', stock.id);

        if (error) throw error;
        toast.success('Stock updated successfully');
      } else {
        // Create new stock
        const { error: insertError } = await supabase
          .from('raw_material_stock')
          .insert([stockData]);

        if (insertError) throw insertError;

        // Log the initial purchase if quantity > 0
        if (quantity > 0) {
          const totalCost = quantity * purchasePrice;
          const { error: logError } = await supabase
            .from('raw_material_purchases')
            .insert([{
              raw_material_id: formData.raw_material_id,
              store_id: currentStore.id,
              quantity,
              unit: formData.unit,
              purchase_price: purchasePrice,
              total_cost: totalCost,
              notes: 'Initial stock',
            }]);

          if (logError) {
            console.error('Error logging purchase:', logError);
            // Don't throw - stock was added successfully
          }
        }

        toast.success('Stock added successfully');
      }

      onClose();
    } catch (error: any) {
      console.error('Error saving stock:', error);
      toast.error(error.message || 'Failed to save stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white">
            <div>
              <h2 className="text-2xl font-display font-bold text-secondary-900">
                {stock ? 'Edit Stock' : 'Add Stock'}
              </h2>
              <p className="text-sm text-secondary-600 mt-1">
                {stock ? 'Update raw material stock details' : 'Add new raw material to inventory'}
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
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Raw Material Selection */}
            <div>
              <label className="block text-sm font-bold text-secondary-700 uppercase tracking-wide mb-3">
                Raw Material *
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  required
                  value={formData.raw_material_id}
                  onChange={(e) => setFormData({ ...formData, raw_material_id: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                >
                  <option value="">Select Raw Material</option>
                  {rawMaterials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowAddMaterialModal(true)}
                  className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-secondary-700 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap border-2 border-gray-300 hover:border-gray-400"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add New</span>
                </button>
              </div>
            </div>

            {/* Unit and Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-secondary-700 uppercase tracking-wide mb-3">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="ltr">Liter (ltr)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="cups">Cups</option>
                  <option value="pcs">Pieces</option>
                  <option value="boxes">Boxes</option>
                  <option value="packets">Packets</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-secondary-700 uppercase tracking-wide mb-3">
                  Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.quantity}
                  onChange={(e) => {
                    setFormData({ ...formData, quantity: e.target.value });
                    // Recalculate based on current mode
                    if (priceMode === 'per_unit') {
                      const qty = parseFloat(e.target.value) || 0;
                      const price = parseFloat(formData.purchase_price) || 0;
                      setTotalPrice((qty * price).toFixed(2));
                    } else {
                      const qty = parseFloat(e.target.value) || 1;
                      const total = parseFloat(totalPrice) || 0;
                      const perUnit = qty > 0 ? (total / qty).toFixed(2) : '0.00';
                      setFormData({ ...formData, quantity: e.target.value, purchase_price: perUnit });
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Purchase Price with Mode Toggle */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-secondary-700 uppercase tracking-wide">
                  Purchase Price *
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setPriceMode('per_unit')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                      priceMode === 'per_unit'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-secondary-600 hover:text-secondary-900'
                    }`}
                  >
                    Per Unit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceMode('total')}
                    className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                      priceMode === 'total'
                        ? 'bg-white text-primary-700 shadow-sm'
                        : 'text-secondary-600 hover:text-secondary-900'
                    }`}
                  >
                    Total Price
                  </button>
                </div>
              </div>

              {priceMode === 'per_unit' ? (
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-600 font-semibold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.purchase_price}
                      onChange={(e) => {
                        setFormData({ ...formData, purchase_price: e.target.value });
                        // Update total price
                        const qty = parseFloat(formData.quantity) || 0;
                        const price = parseFloat(e.target.value) || 0;
                        setTotalPrice((qty * price).toFixed(2));
                      }}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">
                    Price per {formData.unit}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-600 font-semibold text-lg">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={totalPrice}
                      onChange={(e) => {
                        setTotalPrice(e.target.value);
                        // Calculate per unit price
                        const qty = parseFloat(formData.quantity) || 1;
                        const total = parseFloat(e.target.value) || 0;
                        const perUnit = qty > 0 ? (total / qty).toFixed(2) : '0.00';
                        setFormData({ ...formData, purchase_price: perUnit });
                      }}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-base font-medium"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-secondary-500 mt-2">
                    Total price for {formData.quantity || '0'} {formData.unit}
                  </p>
                </div>
              )}

              {/* Price Calculation Display */}
              {formData.quantity && formData.purchase_price && parseFloat(formData.quantity) > 0 && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-secondary-700">
                      {priceMode === 'per_unit' ? 'Total Cost:' : 'Per Unit Cost:'}
                    </span>
                    <span className="font-bold text-primary-900">
                      {priceMode === 'per_unit'
                        ? `₹${totalPrice}`
                        : `₹${formData.purchase_price}/${formData.unit}`
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 py-5 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-base font-semibold text-secondary-700 bg-white border-2 border-gray-300 hover:bg-gray-100 hover:border-gray-400 rounded-xl transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-3 text-base font-semibold text-white bg-primary-800 hover:bg-primary-900 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                stock ? 'Update Stock' : 'Add Stock'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Material Modal */}
      {showAddMaterialModal && (
        <AddRawMaterialModal
          onClose={() => setShowAddMaterialModal(false)}
          onSuccess={handleAddMaterialSuccess}
        />
      )}
    </>
  );
}
