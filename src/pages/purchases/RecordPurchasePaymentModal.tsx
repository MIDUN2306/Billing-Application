import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useAuthStore } from '../../stores/authStore';
import { X, CreditCard, Banknote, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/utils';

interface RecordPurchasePaymentModalProps {
  purchaseId: string;
  supplierId: string;
  balanceDue: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function RecordPurchasePaymentModal({
  purchaseId,
  supplierId,
  balanceDue,
  onSuccess,
  onClose,
}: RecordPurchasePaymentModalProps) {
  const { currentStore } = useStoreStore();
  const { profile } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
  const [amount, setAmount] = useState(balanceDue);
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (amount > balanceDue) {
      toast.error('Amount cannot exceed balance due');
      return;
    }

    setProcessing(true);
    try {
      // Create payment record
      const paymentData = {
        store_id: currentStore!.id,
        payment_type: 'paid',
        reference_type: 'purchase',
        reference_id: purchaseId,
        supplier_id: supplierId,
        amount: amount,
        payment_method: paymentMethod,
        payment_date: new Date().toISOString(),
        notes: notes || null,
        created_by: profile!.id,
      };

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentData);

      if (paymentError) throw paymentError;

      // Update purchase payment status
      const newBalance = balanceDue - amount;
      const newStatus = newBalance === 0 ? 'paid' : 'partial';

      const { error: updateError } = await supabase
        .from('purchases')
        .update({ payment_status: newStatus })
        .eq('id', purchaseId);

      if (updateError) throw updateError;

      onSuccess();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Record Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Balance Due */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Balance Due</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(balanceDue)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
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
                type="button"
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
                type="button"
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
            </div>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              step="0.01"
              min="0.01"
              max={balanceDue}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: {formatCurrency(balanceDue)}
            </p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Add any notes about this payment..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={processing}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing || amount <= 0}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
