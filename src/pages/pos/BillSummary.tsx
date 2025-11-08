import { Receipt, Tag, TrendingDown, DollarSign } from 'lucide-react';

interface BillSummaryProps {
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  itemCount: number;
  unitCount: number;
}

export function BillSummary({ totals, itemCount, unitCount }: BillSummaryProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border-2 border-gray-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-300">
        <Receipt className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-gray-900">Bill Summary</h3>
      </div>

      {/* Line Items */}
      <div className="space-y-3 mb-4">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Tag className="w-4 h-4" />
            <span>Items ({itemCount})</span>
          </div>
          <span className="font-semibold text-gray-900">₹{totals.subtotal.toFixed(2)}</span>
        </div>

        {/* Discount */}
        {totals.discount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-amber-600">
              <TrendingDown className="w-4 h-4" />
              <span>Discount</span>
            </div>
            <span className="font-semibold text-amber-600">-₹{totals.discount.toFixed(2)}</span>
          </div>
        )}

        {/* Tax */}
        {totals.tax > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>Tax</span>
            </div>
            <span className="font-semibold text-gray-900">₹{totals.tax.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Total Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white/90 font-semibold text-base">Total Amount</span>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              ₹{totals.total.toFixed(2)}
            </div>
          </div>
        </div>
        <div className="text-white/80 text-xs text-right">
          {itemCount} item{itemCount !== 1 ? 's' : ''} • {unitCount} unit{unitCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Savings Badge */}
      {totals.discount > 0 && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
            <TrendingDown className="w-3 h-3" />
            You saved ₹{totals.discount.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
