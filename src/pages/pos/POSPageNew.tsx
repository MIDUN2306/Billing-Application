import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, User, RotateCw, X, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomerSelector } from './CustomerSelector';
import { PaymentModal } from './PaymentModal';
import { useLocation } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  sku: string;
  mrp: number;
  unit: string;
  quantity: number;
  category_name: string;
  is_linked_to_raw_material?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export function POSPageNew() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileBill, setShowMobileBill] = useState(false);

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      // Load ready-to-use raw materials directly as products
      const { data, error } = await supabase
        .from('v_pos_ready_to_use_products')
        .select('id, name, sku, mrp, unit, quantity, category_name, stock_status')
        .eq('store_id', currentStore!.id)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
      
      if (isRefresh) {
        toast.success('Products refreshed');
        setRefreshing(false);
      }
    } catch (error: any) {
      setRefreshing(false);
      toast.error('Failed to load products');
    }
  }, [currentStore]);

  useEffect(() => {
    if (currentStore) {
      loadProducts();
    }
  }, [currentStore, location.pathname, loadProducts]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        loadProducts();
      }
    };
    const handleFocus = () => {
      if (currentStore) {
        loadProducts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore, loadProducts]);

  const handleRefresh = () => {
    loadProducts(true);
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
      const itemTotal = (item.mrp || 0) * item.quantity;
      return sum + itemTotal;
    }, 0);

    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    
    const taxableAmount = subtotal - discount;
    const tax = 0;

    const total = taxableAmount + tax;

    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gray-50">
      {/* Mobile/Tablet: Collapsible Bill Summary Bar */}
      <div className="lg:hidden">
        {cart.length > 0 && (
          <div className="bg-white border-b shadow-sm">
            <div className="w-full p-4 flex items-center justify-between">
              <button
                onClick={() => setShowMobileBill(!showMobileBill)}
                className="flex items-center gap-3 flex-1"
              >
                <div className="bg-primary-100 p-2 rounded-lg">
                  <span className="text-primary-700 font-bold">{cart.length}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-600">Current Bill</p>
                  <p className="text-lg font-bold text-gray-900">₹{totals.total.toFixed(2)}</p>
                </div>
                {showMobileBill ? <ChevronUp className="w-5 h-5 ml-2" /> : <ChevronDown className="w-5 h-5 ml-2" />}
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary px-4 py-2 text-sm ml-2"
              >
                Checkout
              </button>
            </div>

            {/* Expandable Bill Items */}
            {showMobileBill && (
              <div className="border-t max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Item</th>
                      <th className="text-center p-2 font-semibold w-24">Qty</th>
                      <th className="text-right p-2 font-semibold w-20">Amount</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map(item => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500">₹{(item.mrp || 0).toFixed(2)} × {item.quantity}</div>
                        </td>
                        <td className="p-2">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-semibold w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-2 text-right font-semibold">
                          ₹{((item.mrp || 0) * item.quantity - item.discount).toFixed(2)}
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-3 sm:p-4 lg:p-6 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Refresh */}
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name or SKU..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center justify-center gap-2 px-4 shadow-sm"
              title="Refresh products"
            >
              <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5 pb-4">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => product.quantity > 0 ? addToCart(product) : toast.error('Product is out of stock')}
                  disabled={product.quantity <= 0}
                  className={`group relative bg-gradient-to-br from-white to-gray-50 p-6 border-2 rounded-2xl transition-all duration-300 text-left ${
                    product.quantity <= 0
                      ? 'border-gray-300 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-500 hover:shadow-2xl hover:scale-[1.02]'
                  }`}
                >
                  {/* Out of Stock Badge */}
                  {product.quantity <= 0 && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                      OUT OF STOCK
                    </div>
                  )}

                  {/* Product Name */}
                  <h3 className="font-bold text-lg mb-3 line-clamp-2 text-gray-900 group-hover:text-primary-600 transition-colors min-h-[3.5rem]">
                    {product.name}
                  </h3>
                  
                  {/* Category Badge */}
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-lg shadow-sm">
                      {product.category_name}
                    </span>
                  </div>

                  {/* SKU */}
                  {product.sku && (
                    <div className="mb-4 flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <span className="text-xs font-medium text-gray-600">SKU:</span>
                      <span className="text-sm font-mono font-bold text-gray-800">
                        {product.sku}
                      </span>
                    </div>
                  )}

                  {/* Price and Stock Section */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-gray-200 mt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-gray-500 mb-1">Price</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{(product.mrp || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-medium text-gray-500 mb-1">Available</span>
                      <span className={`text-base font-bold px-3 py-1.5 rounded-lg shadow-sm ${
                        product.quantity > 10 
                          ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700' 
                          : product.quantity > 5 
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700'
                          : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700'
                      }`}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                  </div>

                  {/* Hover Effect - Add Icon */}
                  <div className="absolute top-3 right-3 bg-primary-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300 shadow-lg">
                    <Plus className="w-5 h-5" />
                  </div>

                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/30 group-hover:to-primary-100/20 rounded-2xl transition-all duration-300 pointer-events-none"></div>
                </button>
              ))}
            </div>
            
            {filteredProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Search className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No products found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop: Bill Panel */}
        <div className="hidden lg:flex w-96 xl:w-[28rem] flex-col bg-white rounded-xl shadow-xl border border-gray-200">
          {/* Bill Header */}
          <div className="p-4 border-b bg-primary-600 text-white rounded-t-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold">Current Bill</h2>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm font-medium hover:bg-primary-700 px-3 py-1 rounded-md transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Customer Selection */}
            <button
              onClick={() => setShowCustomerSelector(true)}
              className="w-full p-3 border-2 border-primary-400 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 bg-primary-500"
            >
              <User className="w-5 h-5" />
              <span className="text-sm font-medium">
                {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
              </span>
            </button>
          </div>

          {/* Bill Items Table */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg font-medium">No items in bill</p>
                <p className="text-sm mt-1">Add products to start billing</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0 border-b-2">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Item</th>
                    <th className="text-center p-3 font-semibold text-gray-700 w-32">Qty</th>
                    <th className="text-right p-3 font-semibold text-gray-700 w-24">Amount</th>
                    <th className="w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cart.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{item.name}</div>
                        {item.sku && (
                          <div className="text-xs text-gray-500 font-mono">SKU: {item.sku}</div>
                        )}
                        <div className="text-xs text-gray-600 mt-1">
                          ₹{(item.mrp || 0).toFixed(2)} × {item.quantity}
                        </div>
                        {item.discount > 0 && (
                          <div className="text-xs text-red-600 mt-0.5">
                            Discount: -₹{item.discount.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1.5 border border-gray-300 rounded hover:bg-gray-100"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                            className="w-12 text-center border border-gray-300 rounded py-1 font-semibold"
                            min="1"
                          />
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 border border-gray-300 rounded hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                            placeholder="Disc"
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            min="0"
                            step="0.01"
                          />
                        </div>
                      </td>
                      <td className="p-3 text-right font-bold text-gray-900">
                        ₹{((item.mrp || 0) * item.quantity - item.discount).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Bill Footer */}
          {cart.length > 0 && (
            <div className="border-t-2 p-4 space-y-2 bg-gray-50">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Subtotal:</span>
                <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Discount:</span>
                <span className="text-red-600 font-semibold">-₹{totals.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Tax:</span>
                <span className="font-semibold">₹{totals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t-2">
                <span className="text-gray-800">Total:</span>
                <span className="text-primary-600">₹{totals.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full mt-4 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Proceed to Payment
              </button>
            </div>
          )}
        </div>
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
