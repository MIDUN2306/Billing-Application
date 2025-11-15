import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { 
  Search, Plus, User, RotateCw, X, Tag, Package
} from 'lucide-react'
import { CustomerSelector } from './CustomerSelector';
import { PaymentModalNew } from './PaymentModalNew';
import { FloatingCartButton } from './FloatingCartButton';
import { CartPanelNew } from './CartPanelNew';

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
  tea_portion_ml?: number | null;
  available_ml?: number | null;
  servings_available?: number | null;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

export function POSPageNew() {
  const { currentStore, hydrated } = useStoreStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  
  // Refs to prevent race conditions
  const loadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (!currentStore?.id) {
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current && !isRefresh) {
      return;
    }

    loadingRef.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      // Get products - Remove duplicates by using a Map with product ID as key
      const { data: productsDataRaw, error: productsError } = await supabase
        .from('v_pos_products_with_stock')
        .select('id, name, sku, category, mrp, unit, quantity, stock_status, is_ready_to_use')
        .eq('store_id', currentStore!.id)
        .order('category')
        .order('name');

      if (productsError) throw productsError;
      
      // Remove duplicates by ID
      const productsData = productsDataRaw 
        ? Array.from(new Map(productsDataRaw.map(p => [p.id, p])).values())
        : [];
      
      // Get tea stock
      const { data: teaStockData } = await supabase
        .from('tea_stock')
        .select('total_ml')
        .eq('store_id', currentStore!.id)
        .single();
      
      const availableTeaMl = teaStockData?.total_ml || 0;
      
      // Get tea portion sizes from product_names
      const { data: teaProductNames } = await supabase
        .from('product_names')
        .select('id, name, tea_portion_ml')
        .not('tea_portion_ml', 'is', null);
      
      // Create a map of tea products by name
      const teaPortionMap = new Map(
        (teaProductNames || []).map(tp => [tp.name.toLowerCase(), tp.tea_portion_ml])
      );
      
      // Enhance products with tea stock info
      const productsWithCategory = (productsData || []).map(p => {
        const productNameLower = p.name.toLowerCase();
        const teaPortionMl = teaPortionMap.get(productNameLower);
        const isTeaProduct = teaPortionMl != null;
        const servingsAvailable = isTeaProduct && teaPortionMl 
          ? Math.floor(availableTeaMl / teaPortionMl) 
          : null;
        
        return {
          ...p,
          category: p.category || 'Uncategorized',
          is_tea_product: isTeaProduct,
          tea_portion_ml: teaPortionMl,
          available_ml: isTeaProduct ? availableTeaMl : null,
          servings_available: servingsAvailable
        };
      });
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      setProducts(productsWithCategory);
      
      if (isRefresh) {
        toast.success('Products refreshed');
        setRefreshing(false);
      }
    } catch (error: any) {
      console.error('Error loading products:', error);
      
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setRefreshing(false);
        toast.error('Failed to load products');
      }
    } finally {
      loadingRef.current = false;
    }
  }, [currentStore?.id]);

  // Load products when component mounts or store changes
  useEffect(() => {
    isMountedRef.current = true;
    
    // Wait for store to be hydrated before loading
    if (hydrated && currentStore?.id) {
      // CRITICAL: Reset loadingRef RIGHT BEFORE loading
      // This ensures it's reset even if the effect runs multiple times
      loadingRef.current = false;
      console.log('[POS] Store hydrated, loading products for store:', currentStore.id);
      loadProducts();
    } else if (hydrated && !currentStore?.id) {
      console.log('[POS] Store hydrated but no currentStore available');
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, currentStore?.id]); // Depend on both hydrated and currentStore?.id

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
                const isTeaProduct = product.is_tea_product === true;
                const teaOutOfStock = isTeaProduct && (product.servings_available == null || product.servings_available < 1);
                const regularOutOfStock = product.is_ready_to_use && product.quantity <= 0;
                const isOutOfStock = teaOutOfStock || regularOutOfStock;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => {
                      if (isOutOfStock) {
                        if (teaOutOfStock) {
                          toast.error(`${product.name} is out of stock - insufficient tea available`);
                        } else {
                          toast.error('Product is out of stock');
                        }
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
                          ₹ {(product.mrp || 0).toFixed(2)}
                        </span>
                        {isTeaProduct ? (
                          <span className={`text-xs font-medium mt-0.5 ${
                            (product.servings_available || 0) > 10 ? 'text-green-600' :
                            (product.servings_available || 0) > 0 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {product.servings_available || 0} servings
                          </span>
                        ) : product.is_ready_to_use ? (
                          <span className={`text-xs font-medium mt-0.5 ${
                            product.quantity > 10 ? 'text-green-600' :
                            product.quantity > 0 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {product.quantity} {product.unit}
                          </span>
                        ) : null}
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
        <div className="hidden lg:flex w-80 xl:w-[420px] flex-col bg-white border-l shadow-xl">
          <CartPanelNew
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

      {/* Floating Cart Button (Mobile/Tablet) */}
      <FloatingCartButton
        itemCount={cart.length}
        totalAmount={totals.total}
        onClick={() => setShowCartSidebar(true)}
        hasItems={cart.length > 0}
      />

      {/* Mobile/Tablet Cart Sidebar */}
      {showCartSidebar && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCartSidebar(false)}
          />
          
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
            <CartPanelNew
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


