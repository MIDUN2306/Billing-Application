import { Plus, Minus, X, Tag } from 'lucide-react';
import { useState } from 'react';

interface CartItemCardProps {
  item: {
    id: string;
    name: string;
    sku: string;
    category: string;
    mrp: number;
    quantity: number;
    discount: number;
    unit: string;
  };
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateDiscount: (id: string, discount: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemCard({ item, onUpdateQuantity, onUpdateDiscount, onRemove }: CartItemCardProps) {
  const [showDiscount, setShowDiscount] = useState(item.discount > 0);
  const itemTotal = (item.mrp * item.quantity) - item.discount;

  return (
    <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 pr-3">
          <h4 className="font-semibold text-gray-900 text-base leading-tight mb-1">
            {item.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="font-mono">#{item.sku}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {item.category}
            </span>
          </div>
        </div>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors flex-shrink-0"
          title="Remove item"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Price Info */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-gray-600">
          ₹{item.mrp.toFixed(2)} × {item.quantity} {item.unit}
        </span>
        <span className="font-semibold text-gray-900">
          ₹{(item.mrp * item.quantity).toFixed(2)}
        </span>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            disabled={item.quantity <= 1}
          >
            <Minus className="w-4 h-4 text-gray-700" />
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              onUpdateQuantity(item.id, Math.max(1, val));
            }}
            className="w-16 text-center font-bold text-gray-900 border-x-2 border-gray-300 py-2 focus:outline-none focus:bg-primary-50"
            min="1"
          />
          <button
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <button
          onClick={() => setShowDiscount(!showDiscount)}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showDiscount || item.discount > 0
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {item.discount > 0 ? `Disc: ₹${item.discount.toFixed(2)}` : 'Add Discount'}
        </button>
      </div>

      {/* Discount Input */}
      {showDiscount && (
        <div className="mb-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">Discount:</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                type="number"
                value={item.discount}
                onChange={(e) => onUpdateDiscount(item.id, parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                min="0"
                max={item.mrp * item.quantity}
                step="0.01"
              />
            </div>
          </div>
        </div>
      )}

      {/* Total */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-600">Item Total</span>
        <div className="text-right">
          {item.discount > 0 && (
            <div className="text-xs text-gray-500 line-through">
              ₹{(item.mrp * item.quantity).toFixed(2)}
            </div>
          )}
          <div className="text-xl font-bold text-primary-600">
            ₹{itemTotal.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
