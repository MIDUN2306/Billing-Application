import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useAuthStore } from '../../stores/authStore';
import { X, CreditCard, Banknote, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi';
}

interface ExpenseFormModalProps {
  expense: Expense | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EXPENSE_CATEGORIES = [
  'rent',
  'utilities',
  'salaries',
  'supplies',
  'maintenance',
  'transportation',
  'marketing',
  'insurance',
  'taxes',
  'miscellaneous',
];

export function ExpenseFormModal({ expense, onClose, onSuccess }: ExpenseFormModalProps) {
  const { currentStore } = useStoreStore();
  const { profile } = useAuthStore();
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [category, setCategory] = useState(expense?.category || '');
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount || 0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>(
    expense?.payment_method || 'cash'
  );
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setProcessing(true);
    try {
      if (expense) {
        // Update existing expense
        const { error } = await supabase
          .from('expenses')
          .update({
            expense_date: expenseDate,
            category,
            description: description.trim(),
            amount,
            payment_method: paymentMethod,
          })
          .eq('id', expense.id);

        if (error) throw error;
      } else {
        // Create new expense
        // Generate expense number
        const { data: expenseNumber, error: numberError } = await supabase
          .rpc('generate_expense_number', { p_store_id: currentStore!.id });

        if (numberError) throw numberError;

        const expenseData = {
          store_id: currentStore!.id,
          expense_number: expenseNumber,
          expense_date: expenseDate,
          category,
          description: description.trim(),
          amount,
          payment_method: paymentMethod,
          created_by: profile!.id,
        };

        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Expense error:', error);
      toast.error(error.message || 'Failed to save expense');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-secondary-900">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expense Date *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent capitalize"
                required
              >
                <option value="">Select Category</option>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Enter expense details..."
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              step="0.01"
              min="0.01"
              required
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
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

          {/* Actions */}
          <div className="flex gap-3 pt-4">
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
              disabled={processing}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
