import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useAuthStore } from '../../stores/authStore';
import { X, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Supplier {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  mrp: number;
  unit: string;
}

interface PurchaseItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface PurchaseFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseFormModal({ onClose, onSuccess }: PurchaseFormModalProps) {
  const { currentStore } = useStoreStore();
  const { profile } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSuppliers();
    loadProducts();
  }, []);

  const loadSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('store_id', currentStore!.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error: any) {
      toast.error('Failed to load suppliers');
    }
  };

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, mrp, unit')
        .eq('store_id', currentStore!.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Failed to load products');
    }
  };

  const addItem = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    if (items.find(item => item.product_id === selectedProduct)) {
      toast.error('Product already added');
      return;
    }

    setItems([...items, {
      product_id: product.id,
      product_name: product.name,
      quantity: 1,
      unit_price: product.mrp,
    }]);
    setSelectedProduct('');
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    const tax = 0; // No tax calculation since tax_rate field is removed

    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setProcessing(true);
    try {
      const totals = calculateTotals();

      // Generate purchase number
      const { data: purchaseNumber, error: numberError } = await supabase
        .rpc('generate_purchase_number', { p_store_id: currentStore!.id });

      if (numberError) throw numberError;

      // Create purchase
      const purchaseData = {
        store_id: currentStore!.id,
        purchase_number: purchaseNumber,
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        subtotal: totals.subtotal,
        tax_amount: totals.tax,
        total_amount: totals.total,
        payment_status: 'pending',
        status: 'ordered',
        created_by: profile!.id,
      };

      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .insert(purchaseData)
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      // Create purchase items
      const purchaseItems = items.map(item => ({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: (item.quantity * item.unit_price),
        discount_amount: 0,
      }));

      const { error: itemsError } = await supabase
        .from('purchase_items')
        .insert(purchaseItems);

      if (itemsError) throw itemsError;

      onSuccess();
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to create purchase');
    } finally {
      setProcessing(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-secondary-900">New Purchase Order</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purchase Date *
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Add Items */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Products
            </label>
            <div className="flex gap-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Product</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ₹{product.mrp}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </div>

          {/* Items Table */}
          {items.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tax %</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-secondary-900">{item.product_name}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-right border border-gray-300 rounded"
                          min="1"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-1 text-right border border-gray-300 rounded"
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">
                        ₹{(item.quantity * item.unit_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          {items.length > 0 && (
            <div className="border-t pt-4">
              <div className="max-w-sm ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-secondary-900">₹{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax:</span>
                  <span className="text-secondary-900">₹{totals.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span className="text-primary-600">₹{totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={processing || items.length === 0}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Creating...' : 'Create Purchase Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
