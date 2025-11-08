import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { 
  Search, Plus, Minus, User, RotateCw, X, ShoppingCart, 
  Tag, Package, Coffee, Utensils, Grid3x3
} from 'lucide-react';
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
  category_id: string | null;
  tea_portion_ml?: number | null;
  available_ml?: number;
  available_liters?: number;
  available_servings?: number;
  is_tea_product?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  discount: number;
}

interface Category {
  id: string;
  name: string;
  count: number;
}

export function POSPageRedesigned() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  
  // Product and Category States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Cart States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  
  // Modal States
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Load categories with product counts
  const loadCategories = useCallback(async () => {
    if (!currentStore) return;
    
    try {
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) throw error;

      // Count products per category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (cat) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('store_id', currentStore.id)
            .eq('category_id', cat.id)
            .eq('is_active', true)
            .gt('quantity', 0);
          return { ...cat, count: count || 0 };
        })
      );

      setCategories(categoriesWithCounts.filter(c => c.count > 0));
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  }, [currentStore]);

  // Load products
  const loadProducts = useCallback(async (isRefresh = false) => {
    if (!currentStore) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      }
      
      // Load regular products
      const { data: regularProducts, error: regularError } = await supabase
        .from('v_product_stock_status')
        .select('id, name, sku, mrp, unit, quantity, category_name, category_id')
        .eq('store_id', currentStore.id)
        .gt('quantity', 0)
        .order('name');

      if (regularError) throw regularError;

      // Load tea products with stock
      const { data: teaProducts, error: teaError } = await supabase
        .from('v_tea_products_with_stock')
        .select('id, name, sku, mrp, category, tea_portion_ml, available_ml, available_servings, available_liters')
        .eq('store_id', currentStore.id);

      if (teaError) throw teaError;

      // Combine products, marking tea products
      const allProducts = [
        ...(regularProducts || []).map(p => ({ ...p, is_tea_product: false })),
        ...(teaProducts || []).map(p => ({
          id: p.id,
          name: p.name,
          sku: p.sku || '',
          mrp: p.mrp || 0,
          unit: 'serving',
          quantity: p.available_servings || 0,
          category_name: p.category || 'Beverages',
          category_id: null,
          tea_portion_ml: p.tea_portion_ml,
          available_ml: p.available_ml,
          available_liters: p.available_liters,
          available_servings: p.available_servings,
          is_tea_product: true,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name));

      setProducts(allProducts);
      
      if (isRefresh) {
        toast.success('Products refreshed');
        setRefreshing(false);
      }
    } catch (error: any) {
      setRefreshing(false);
      toast.error('Failed to load products');
    }
  }, [currentStore]);

  // Initial load
  useEffect(() => {
    if (currentStore) {
      loadProducts();
      loadCategories();
    }
  }, [currentStore, location.pathname, loadProducts, loadCategories]);

  // Auto-refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        loadProducts();
        loadCategories();
      }
    };
    const handleFocus = () => {
      if (currentStore) {
        loadProducts();
        loadCategories();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore, loadProducts, loadCategories]);

  const handleRefresh = () => {
    loadProducts(true);
    loadCategories();
  };

  // Filter products by category AND search
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Cart functions
  const addToCart = (product: Product) => {
    // Check if product is out of stock
    if (product.quantity === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }

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
      toast.success(`Added ${product.name}`);
    } else {
      setCart([...cart, { ...product, quantity: 1, discount: 0 }]);
      toast.success(`Added ${product.name} to cart`);
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
    const subtotal = cart.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const discount = cart.reduce((sum, item) => sum + item.discount, 0);
    const tax = 0;
    const total = subtotal - discount + tax;
    return { subtotal, discount, tax, total };
  };

  const totals = calculateTotals();
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Get category icon
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('tea')) return Coffee;
    if (name.includes('coffee')) return Coffee;
    if (name.includes('food') || name.includes('snack')) return Utensils;
    return Package;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="p-4 space-y-4">
          {/* Search and Actions Row */}
          <div className="flex gap-3">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all"
              />
            </div>

            {/* Customer Button - Desktop */}
            <button
              onClick={() => setShowCustomerSelector(true)}
              className="hidden lg:flex items-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all bg-white shadow-sm"
              title="Select Customer"
            >
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {selectedCustomer ? selectedCustomer.name : 'Walk-in'}
              </span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all bg-white shadow-sm"
              title="Refresh"
            >
              <RotateCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Category Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {/* All Categories */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === null
                  ? 'bg-primary-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
              <span>All</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                selectedCategory === null
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {products.length}
              </span>
            </button>

            {/* Category Chips */}
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.name);
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all shadow-sm ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        {/* Products Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Package className="w-20 h-20 mb-4 opacity-50" />
                <p className="text-xl font-semibold">No products found</p>
                <p className="text-sm mt-2">Try adjusting your search or category filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 pb-4">
                {filteredProducts.map(product => {
                  const inCart = cart.find(item => item.id === product.id);
                  const isOutOfStock = product.quantity === 0;
                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`group relative bg-white p-5 border-2 rounded-2xl transition-all duration-300 text-left ${
                        isOutOfStock
                          ? 'border-gray-300 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-primary-500 hover:shadow-2xl hover:-translate-y-1'
                      }`}
                    >
                      {/* Out of Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-3 right-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                          Out of Stock
                        </div>
                      )}

                      {/* In Cart Badge */}
                      {!isOutOfStock && inCart && (
                        <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10">
                          {inCart.quantity} in cart
                        </div>
                      )}

                      {/* Product Name */}
                      <h3 className={`font-bold text-lg mb-3 line-clamp-2 transition-colors min-h-[3.5rem] pr-20 ${
                        isOutOfStock ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary-600'
                      }`}>
                        {product.name}
                      </h3>
                      
                      {/* Category Badge */}
                      <div className="mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-lg">
                          <Tag className="w-3 h-3" />
                          {product.category_name}
                        </span>
                      </div>

                      {/* SKU */}
                      {product.sku && (
                        <div className="mb-3 flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">SKU:</span>
                          <span className="font-mono font-bold text-gray-700">{product.sku}</span>
                        </div>
                      )}

                      {/* Price and Stock */}
                      <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className={`text-2xl font-bold ${isOutOfStock ? 'text-gray-400' : 'text-primary-600'}`}>
                            ₹{product.mrp.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">
                            {product.is_tea_product ? 'Servings' : 'Stock'}
                          </p>
                          <p className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : product.quantity > 10 
                              ? 'bg-green-100 text-green-700' 
                              : product.quantity > 5 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {isOutOfStock ? 'Out of Stock' : `${product.quantity} ${product.unit}`}
                          </p>
                        </div>
                      </div>

                      {/* Tea Product Details */}
                      {product.is_tea_product && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                          {/* Consumption per serving */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium">Per Serving:</span>
                            <span className="font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded">
                              {product.tea_portion_ml}ml
                            </span>
                          </div>
                          {/* Available tea stock */}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600 font-medium">Tea Available:</span>
                            <span className={`font-bold px-2 py-1 rounded ${
                              isOutOfStock
                                ? 'text-red-700 bg-red-50'
                                : (product.available_ml || 0) > 5000
                                ? 'text-green-700 bg-green-50'
                                : 'text-yellow-700 bg-yellow-50'
                            }`}>
                              {product.available_ml ? `${product.available_ml.toFixed(0)}ml` : '0ml'}
                              {product.available_liters && product.available_liters > 0 && (
                                <span className="text-gray-500 ml-1">
                                  ({product.available_liters.toFixed(1)}L)
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Add Button Overlay */}
                      {!isOutOfStock && (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/0 to-primary-600/0 group-hover:from-primary-600/5 group-hover:to-primary-600/10 rounded-2xl transition-all duration-300 pointer-events-none flex items-center justify-center">
                          <div className="bg-primary-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-2xl">
                            <Plus className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Bill Panel - Will be added in next part */}
        <div className="hidden lg:flex w-96 xl:w-[28rem] flex-col bg-white rounded-2xl shadow-2xl border-2 border-gray-200">
          {/* Bill content will be added */}
        </div>
      </div>

      {/* Mobile Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setShowMobileCart(true)}
          className="lg:hidden fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-2xl hover:bg-primary-700 transition-all z-50 flex items-center gap-3"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">{cartItemCount}</span>
          <span className="text-sm">₹{totals.total.toFixed(0)}</span>
        </button>
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
        <PaymentModal
          cart={cart}
          customer={selectedCustomer}
          totals={totals}
          onSuccess={() => {
            clearCart();
            setShowPaymentModal(false);
            loadProducts();
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
