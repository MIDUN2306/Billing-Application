import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { 
  Search, Plus, Minus, User, RotateCw, X, ShoppingCart, 
  CreditCard, ChevronRight, Tag, Package
} from 'lucide-react';
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
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  const loadProducts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      const { data, error } = await supabase
        .from('v_pos_products_with_stock')
        .select('id, name, sku, category, mrp, unit, quantity, stock_status, is_ready_to_use')
        .eq('store_id', currentStore!.id)
        .order('category')
        .order('name');

      if (error) throw error;
      
      // Ensure category is never null/undefined
      const productsWithCategory = (data || []).map(p => ({
        ...p,
        category: p.category || 'Uncategorized'
      }));
      
      setProducts(productsWithCategory);
      
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

  // Get unique categories and sort them
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category || 'Uncategorized'))).sort()];

  const filteredProducts = products.filter(p => {
    const productCategory = p.category || 'Uncategorized';
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || productCategory === selectedCategory;
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
    const subtotal = cart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    const tax = 0;
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section - Optimized for all screens */}
      <div className="bg-white border-b shadow-sm">
        <div className="p-3 sm:p-4 space-y-3">
          {/* Search and Actions Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary px-3 sm:px-4 py-2 flex-shrink-0"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setShowCustomerSelector(true)}
              className="btn-secondary px-3 sm:px-4 py-2 flex-shrink-0 hidden sm:flex items-center gap-2"
              title="Select Customer"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden md:inline text-sm">
                {selectedCustomer ? selectedCustomer.name.split(' ')[0] : 'Customer'}
              </span>
            </button>

            {cart.length > 0 && (
              <button
                onClick={() => setShowCartSidebar(true)}
                className="lg:hidden btn-primary px-3 sm:px-4 py-2 flex items-center gap-2 relative"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-sm sm:text-base">{cartItemCount}</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {cart.length}
                </span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          {categories.length > 1 && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
              
              {/* Mobile/Tablet Dropdown */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="md:hidden flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
              >
                {categories.map(category => {
                  const count = category === 'All' ? products.length : products.filter(p => (p.category || 'Uncategorized') === category).length;
                  return (
                    <option key={category} value={category}>
                      {category} {category !== 'All' && `(${count})`}
                    </option>
                  );
                })}
              </select>

              {/* Desktop Pills */}
              <div className="hidden md:flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent flex-1">
                {categories.map(category => {
                  const count = category === 'All' ? products.length : products.filter(p => (p.category || 'Uncategorized') === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white shadow-md scale-105'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {category} <span className="text-xs opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="w-16 h-16 sm:w-20 sm:h-20 mb-4 opacity-50" />
              <p className="text-lg sm:text-xl font-semibold">No products found</p>
              <p className="text-sm mt-2">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 pb-20 lg:pb-4">
              {filteredProducts.map(product => {
                const inCart = cart.find(item => item.id === product.id);
                const isOutOfStock = product.is_ready_to_use && product.quantity <= 0;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (isOutOfStock) {
                        toast.error('Product is out of stock');
                      } else {
                        addToCart(product);
                      }
                    }}
                    disabled={isOutOfStock}
                    className={`group bg-white rounded-xl p-3 sm:p-4 border-2 transition-all duration-200 text-left relative ${
                      isOutOfStock
                        ? 'border-gray-300 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-primary-500 hover:shadow-lg active:scale-95'
                    }`}
                  >
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                      {isOutOfStock && (
                        <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                          OUT OF STOCK
                        </span>
                      )}
                      {!isOutOfStock && inCart && (
                        <span className="bg-primary-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                          {inCart.quantity} in cart
                        </span>
                      )}
                    </div>

                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                        <Tag className="w-3 h-3" />
                        {product.category || 'Uncategorized'}
                      </span>
                    </div>

                    <h3 className={`font-bold text-sm sm:text-base mb-2 line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] pr-16 ${
                      isOutOfStock ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary-600'
                    }`}>
                      {product.name}
                    </h3>

                    {product.sku && (
                      <div className="mb-2 text-xs text-gray-500 font-mono">
                        #{product.sku}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <div className="flex flex-col">
                        <span className={`text-lg sm:text-xl font-bold ${
                          isOutOfStock ? 'text-gray-400' : 'text-primary-600'
                        }`}>
                          ₹{(product.mrp || 0).toFixed(2)}
                        </span>
                        {product.is_ready_to_use && (
                          <span className={`text-xs font-medium mt-0.5 ${
                            product.quantity > 10 ? 'text-green-600' :
                            product.quantity > 0 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {product.quantity} {product.unit}
                          </span>
                        )}
                      </div>
                      {!isOutOfStock && (
                        <div className="bg-primary-500 text-white p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Cart Panel */}
        <div className="hidden lg:flex w-80 xl:w-96 flex-col bg-white border-l shadow-xl">
          <CartPanel
            cart={cart}
            totals={totals}
            selectedCustomer={selectedCustomer}
            onUpdateQuantity={updateQuantity}
            onUpdateDiscount={updateDiscount}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onSelectCustomer={() => setShowCustomerSelector(true)}
            onCheckout={() => setShowPaymentModal(true)}
          />
        </div>
      </div>

      {/* Mobile/Tablet Cart Sidebar */}
      {showCartSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowCartSidebar(false)}
          />
          
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <CartPanel
              cart={cart}
              totals={totals}
              selectedCustomer={selectedCustomer}
              onUpdateQuantity={updateQuantity}
              onUpdateDiscount={updateDiscount}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onSelectCustomer={() => {
                setShowCartSidebar(false);
                setShowCustomerSelector(true);
              }}
              onCheckout={() => {
                setShowCartSidebar(false);
                setShowPaymentModal(true);
              }}
              onClose={() => setShowCartSidebar(false)}
            />
          </div>
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

// Reusable Cart Panel Component
interface CartPanelProps {
  cart: CartItem[];
  totals: { subtotal: number; discount: number; tax: number; total: number };
  selectedCustomer: any;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdateDiscount: (id: string, disc: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onSelectCustomer: () => void;
  onCheckout: () => void;
  onClose?: () => void;
}

function CartPanel({
  cart,
  totals,
  selectedCustomer,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  onSelectCustomer,
  onCheckout,
  onClose
}: CartPanelProps) {
  return (
    <>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <h2 className="text-lg font-bold">Cart ({cart.length})</h2>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-sm hover:bg-primary-800 px-3 py-1 rounded transition-colors"
              >
                Clear
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="hover:bg-primary-800 p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={onSelectCustomer}
          className="w-full p-2.5 border-2 border-primary-400 rounded-lg hover:bg-primary-800 transition-colors flex items-center justify-between bg-primary-500"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">
              {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="text-center text-gray-400 py-12 px-4">
            <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Cart is empty</p>
            <p className="text-sm mt-1">Add products to start</p>
          </div>
        ) : (
          <div className="divide-y">
            {cart.map(item => (
              <div key={item.id} className="p-3 sm:p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</h4>
                    <p className="text-xs text-gray-500">₹{item.mrp} × {item.quantity}</p>
                  </div>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-red-500 hover:bg-red-50 p-1 rounded flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 border rounded-lg">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-l-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                      className="w-12 sm:w-14 text-center border-x py-1 font-semibold text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="p-1.5 hover:bg-gray-100 rounded-r-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="number"
                    value={item.discount}
                    onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
                    placeholder="Discount"
                    className="flex-1 text-xs sm:text-sm border rounded-lg px-2 py-1.5"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="text-right font-bold text-primary-600 mt-2 text-sm sm:text-base">
                  ₹{((item.mrp * item.quantity) - item.discount).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {cart.length > 0 && (
        <div className="border-t bg-gradient-to-b from-gray-50 to-white">
          {/* Summary Section */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span className="font-medium text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Discount</span>
                <span className="font-medium text-red-600">-₹{totals.discount.toFixed(2)}</span>
              </div>
            )}
            {totals.tax > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax</span>
                <span className="font-medium text-gray-900">₹{totals.tax.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="px-4 py-3 bg-primary-50 border-t border-primary-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-gray-700">Total Amount</span>
              <span className="text-2xl font-bold text-primary-600">₹{totals.total.toFixed(2)}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              {cart.length} item{cart.length !== 1 ? 's' : ''} • {cart.reduce((sum, item) => sum + item.quantity, 0)} unit{cart.reduce((sum, item) => sum + item.quantity, 0) !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Checkout Button */}
          <div className="p-4 pt-3">
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <CreditCard className="w-6 h-6" />
              <span>Complete Payment</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
