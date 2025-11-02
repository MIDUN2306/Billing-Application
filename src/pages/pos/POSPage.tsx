import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, ShoppingCart, User } from 'lucide-react';
import { CustomerSelector } from './CustomerSelector';
import { PaymentModal } from './PaymentModal';

interface Product {
  id: string;
  name: string;
  sku: string;
  mrp: number;
  unit: string;
  quantity: number;
  category_name: string;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export function POSPage() {
  const { currentStore } = useStoreStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (currentStore) {
      loadProducts();
    }
  }, [currentStore]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('v_product_stock_status')
        .select('id, name, sku, mrp, unit, quantity, category_name')
        .eq('store_id', currentStore!.id)
        .gt('quantity', 0)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error('Failed to load products');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      if (existing.quantity >= product.quantity) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity > product.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item =>
      item.id === productId ? { ...item, discount: Math.max(0, discount) } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => {
      const itemTotal = item.mrp * item.quantity;
      return sum + itemTotal;
    }, 0);

    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    
    const taxableAmount = subtotal - discount;
    const tax = 0; // No tax calculation since tax_rate field is removed

    const total = taxableAmount + tax;

    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name or SKU..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all text-left"
              >
                <h3 className="font-medium text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-gray-500 mb-2">{product.category_name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600">
                    ₹{product.mrp.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Stock: {product.quantity}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col bg-white rounded-lg shadow-lg">
        {/* Cart Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <button
            onClick={() => setShowCustomerSelector(true)}
            className="w-full p-2 border border-gray-300 rounded-lg hover:border-primary-500 transition-colors flex items-center gap-2"
          >
            <User className="w-4 h-4" />
            <span className="text-sm">
              {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
            </span>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm flex-1">{item.name}</h4>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                    className="w-16 text-center border border-gray-300 rounded py-1"
                    min="1"
                    max={item.quantity}
                  />
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1 border border-gray-300 rounded hover:bg-gray-100"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600 ml-auto">
                    ₹{(item.mrp * item.quantity).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-600">Discount:</label>
                  <input
                    type="number"
                    value={item.discount}
                    onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                    className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>₹{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Discount:</span>
              <span className="text-red-600">-₹{totals.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax:</span>
              <span>₹{totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="text-primary-600">₹{totals.total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn-primary w-full mt-4"
            >
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCustomerSelector && (
        <CustomerSelector
          onSelect={(customer: any) => {
            setSelectedCustomer(customer);
            setShowCustomerSelector(false);
          }}
          onClose={() => setShowCustomerSelector(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          cart={cart}
          customer={selectedCustomer}
          totals={totals}
          onSuccess={() => {
            clearCart();
            setShowPaymentModal(false);
            toast.success('Sale completed successfully!');
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
