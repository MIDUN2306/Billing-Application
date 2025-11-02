import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useAuthStore } from '../../stores/authStore';
import { X, CreditCard, Banknote, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
  cart: any[];
  customer: any;
  totals: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  };
  onSuccess: () => void;
  onClose: () => void;
}

export function PaymentModal({ cart, customer, totals, onSuccess, onClose }: PaymentModalProps) {
  const { currentStore } = useStoreStore();
  const { profile } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi' | 'credit'>('cash');
  const [amountReceived, setAmountReceived] = useState(totals.total);
  const [processing, setProcessing] = useState(false);

  const change = paymentMethod === 'cash' ? Math.max(0, amountReceived - totals.total) : 0;
  const canComplete = paymentMethod === 'credit' || amountReceived >= totals.total;

  const completeSale = async () => {
    if (!canComplete) {
      toast.error('Insufficient payment amount');
      return;
    }

    setProcessing(true);
    try {
      // Generate invoice number
      const { data: invoiceNumber, error: invoiceError } = await supabase
        .rpc('generate_invoice_number', { p_store_id: currentStore!.id });

      if (invoiceError) throw invoiceError;

      // Create sale
      const saleData = {
        store_id: currentStore!.id,
        invoice_number: invoiceNumber,
        customer_id: customer?.id || null,
        sale_date: new Date().toISOString(),
        subtotal: totals.subtotal,
        discount_amount: totals.discount,
        tax_amount: totals.tax,
        total_amount: totals.total,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'credit' ? 'pending' : 'paid',
        status: 'completed',
        created_by: profile!.id,
      };

      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert(saleData)
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.mrp,
        discount_amount: item.discount,
        tax_rate: 0,
        tax_amount: 0,
        total_amount: (item.mrp * item.quantity - item.discount),
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Create payment record if not credit
      if (paymentMethod !== 'credit') {
        const paymentData = {
          store_id: currentStore!.id,
          payment_type: 'received',
          reference_type: 'sale',
          reference_id: sale.id,
          customer_id: customer?.id || null,
          amount: totals.total,
          payment_method: paymentMethod,
          payment_date: new Date().toISOString(),
          created_by: profile!.id,
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert(paymentData);

        if (paymentError) throw paymentError;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Sale error:', error);
      toast.error(error.message || 'Failed to complete sale');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Summary */}
          <div className="space-y-2">
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
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-sm font-medium">Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Card</span>
              </button>

              <button
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'upi'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-sm font-medium">UPI</span>
              </button>

              <button
                onClick={() => setPaymentMethod('credit')}
                className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  paymentMethod === 'credit'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={!customer}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-sm font-medium">Credit</span>
              </button>
            </div>
            {paymentMethod === 'credit' && !customer && (
              <p className="text-xs text-red-600 mt-1">
                Please select a customer for credit sales
              </p>
            )}
          </div>

          {/* Amount Received (for cash) */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Received
              </label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                step="0.01"
                min={totals.total}
              />
              {change > 0 && (
                <p className="text-sm text-green-600 mt-1">
                  Change: ₹{change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Customer Info */}
          {customer && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{customer.name}</p>
              {customer.phone && (
                <p className="text-xs text-gray-600">{customer.phone}</p>
              )}
              {customer.current_balance > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Current Balance: ₹{customer.current_balance.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            onClick={completeSale}
            disabled={!canComplete || processing}
            className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
