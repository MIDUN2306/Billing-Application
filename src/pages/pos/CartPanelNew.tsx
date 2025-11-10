import { ShoppingCart, User, X, ShoppingBag } from 'lucide-react';
import { CartItemCard } from './CartItemCard';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  mrp: number;
  unit: string;
  quantity: number;
  discount: number;
}

interface CartPanelNewProps {
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

export function CartPanelNew({
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
}: CartPanelNewProps) {
  const itemCount = cart.length;
  const unitCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg flex-shrink-0">
        <div className="p-4">
          {/* Title Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Current Bill</h2>
                <p className="text-white/80 text-sm">
                  {itemCount} item{itemCount !== 1 ? 's' : ''} in cart
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-sm font-medium hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Clear All
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                  title="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info (if selected) */}
      {selectedCustomer && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Customer: {selectedCustomer.name}</span>
          </div>
          <button
            onClick={onSelectCustomer}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Change
          </button>
        </div>
      )}

      {/* Cart Items - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-6 py-12">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <ShoppingBag className="w-16 h-16 text-gray-300" />
            </div>
            <p className="text-xl font-semibold text-gray-600 mb-2">Cart is Empty</p>
            <p className="text-sm text-center text-gray-500">
              Add products from the catalog to start billing
            </p>
          </div>
        ) : (
          <div className="p-3 sm:p-4 space-y-3 pb-4">
            {cart.map(item => (
              <CartItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onUpdateDiscount={onUpdateDiscount}
                onRemove={onRemoveItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky Footer - Summary + Checkout */}
      {cart.length > 0 && (
        <div className="border-t-2 border-gray-200 bg-white shadow-2xl flex-shrink-0">
          <div className="p-4 space-y-3">
            {/* Compact Bill Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Items ({itemCount})</span>
                <span className="font-semibold text-gray-900">₹ {totals.subtotal.toFixed(2)}</span>
              </div>
              
              {totals.discount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-semibold text-red-600">-₹ {totals.discount.toFixed(2)}</span>
                </div>
              )}
              
              {totals.tax > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold text-gray-900">₹ {totals.tax.toFixed(2)}</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-300 flex items-center justify-between">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-primary-600">₹ {totals.total.toFixed(2)}</span>
              </div>
              
              <div className="text-xs text-gray-500 text-right">
                {unitCount} unit{unitCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={onCheckout}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Complete Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
