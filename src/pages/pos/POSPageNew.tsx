import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, User, RotateCw, X, ShoppingCart, CreditCard } from 'lucide-react';
import { CustomerSelector } from './CustomerSelector';
import { PaymentModalNew } from './PaymentModalNew';
import { useLocation } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  mrp: number;
  unit: string;
  quantity: number;
  stock_status: string;
  is_ready_to_use: boolean;
  is_tea_product?: boolean;
  tea_portion_ml?: number;
  available_ml?: number;
  available_liters?: number;
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      // Load products with stock info (matched by SKU with raw materials)
      const { data, error } = await supabase
        .from('v_pos_products_with_stock')
        .select('id, name, sku, category, mrp, unit, quantity, stock_status, is_ready_to_use')
        .eq('store_id', currentStore!.id)
        .order('category')
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

  const handleRefresh = () => {
    loadProducts(true);
  };

  // Get unique categories
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId: string, quantity: number) => {
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
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="p-4 space-y-3">
          {/* Search and Actions Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary px-4"
              title="Refresh"
            >
              <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowCustomerSelector(true)}
              className="btn-secondary px-4"
              title="Select Customer"
            >
              <User className="w-5 h-5" />
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Customer Info */}
          {selectedCustomer && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{selectedCustomer.name}</span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => {
                  if (product.is_ready_to_use && product.quantity <= 0) {
                    toast.error('Product is out of stock');
                  } else {
                    addToCart(product);
                  }
                }}
                disabled={product.is_ready_to_use && product.quantity <= 0}
                className={`group bg-white rounded-xl p-4 border-2 transition-all duration-200 text-left relative ${
                  product.is_ready_to_use && product.quantity <= 0
                    ? 'border-gray-300 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-primary-500 hover:shadow-lg'
                }`}
              >
                {/* Out of Stock Badge */}
                {product.is_ready_to_use && product.quantity <= 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg z-10">
                    OUT OF STOCK
                  </div>
                )}

                {/* Category Badge */}
                <div className="mb-2">
                  <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                    {product.category}
                  </span>
                </div>

                {/* Product Name */}
                <h3 className="font-bold text-base mb-2 line-clamp-2 text-gray-900 min-h-[2.5rem]">
                  {product.name}
                </h3>

                {/* SKU */}
                {product.sku && (
                  <div className="mb-3 text-xs text-gray-500 font-mono">
                    #{product.sku}
                  </div>
                )}

                {/* Price and Stock */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-primary-600">
                      ₹{(product.mrp || 0).toFixed(2)}
                    </span>
                    {/* Show stock for ready-to-use products */}
                    {product.is_ready_to_use && (
                      <span className={`text-xs font-medium mt-1 ${
                        product.quantity > 10 ? 'text-green-600' :
                        product.quantity > 0 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {product.quantity} {product.unit} available
                      </span>
                    )}
                  </div>
                  {!(product.is_ready_to_use && product.quantity <= 0) && (
                    <div className="bg-primary-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Search className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm">Try adjusting your search or filter</p>
            </div>
          )}
        </div>

        {/* Cart Panel - Desktop */}
        <div className="hidden lg:flex w-96 xl:w-[28rem] flex-col bg-white border-l shadow-xl">
          {/* Cart Header */}
          <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-primary-700 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-lg font-bold">Cart ({cart.length})</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-sm hover:bg-primary-800 px-3 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="text-2xl font-bold">₹{totals.total.toFixed(2)}</div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg font-medium">Cart is empty</p>
                <p className="text-sm mt-1">Add products to start</p>
              </div>
            ) : (
              <div className="divide-y">
                {cart.map(item => (
                  <div key={item.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <p className="text-xs text-gray-500">₹{item.mrp} × {item.quantity}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="p-1 border rounded hover:bg-gray-100"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center border rounded py-1 font-semibold"
                        min="1"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="p-1 border rounded hover:bg-gray-100"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={item.discount}
                        onChange={(e) => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                        placeholder="Discount"
                        className="flex-1 text-sm border rounded px-2 py-1"
                        min="0"
                        step="0.01"
                      />
                    </div>

                    {/* Item Total */}
                    <div className="text-right font-bold text-primary-600">
                      ₹{((item.mrp * item.quantity) - item.discount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Footer */}
          {cart.length > 0 && (
            <div className="border-t p-4 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="text-red-600 font-semibold">-₹{totals.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary-600">₹{totals.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="btn-primary w-full py-3 text-lg font-semibold flex items-center justify-center gap-2 mt-3"
              >
                <CreditCard className="w-5 h-5" />
                Proceed to Payment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cart Footer */}
      {cart.length > 0 && (
        <div className="lg:hidden bg-white border-t shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-primary-600">₹{totals.total.toFixed(2)}</p>
            </div>
            <div className="bg-primary-100 px-3 py-1 rounded-full">
              <span className="text-primary-700 font-bold">{cart.length} items</span>
            </div>
          </div>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="btn-primary w-full py-3 text-lg font-semibold flex items-center justify-center gap-2"
          >
            <CreditCard className="w-5 h-5" />
            Checkout
          </button>
        </div>
      )}

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
        <PaymentModalNew
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
