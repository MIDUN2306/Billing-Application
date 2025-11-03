import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useAuthStore } from '../../stores/authStore';
import { X, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

interface PettyCash {
  id: string;
  petty_cash_number: string;
  recipient_name: string;
  amount: number;
  given_date: string;
  purpose: string | null;
  notes: string | null;
}

interface GivePettyCashModalProps {
  record: PettyCash | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function GivePettyCashModal({ record, onClose, onSuccess }: GivePettyCashModalProps) {
  const { currentStore } = useStoreStore();
  const { profile } = useAuthStore();
  const [givenDate, setGivenDate] = useState(
    record?.given_date.split('T')[0] || new Date().toISOString().split('T')[0]
  );
  const [recipientName, setRecipientName] = useState(record?.recipient_name || '');
  const [amount, setAmount] = useState(record?.amount || 0);
  const [purpose, setPurpose] = useState(record?.purpose || '');
  const [notes, setNotes] = useState(record?.notes || '');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      toast.error('Please enter recipient name');
      return;
    }

    if (amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setProcessing(true);
    try {
      if (record) {
        // Update existing record
        const { error } = await supabase
          .from('petty_cash')
          .update({
            given_date: givenDate,
            recipient_name: recipientName.trim(),
            amount,
            purpose: purpose.trim() || null,
            notes: notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', record.id);

        if (error) throw error;
      } else {
        // Create new record
        // Generate petty cash number
        const { data: pettyCashNumber, error: numberError } = await supabase
          .rpc('generate_petty_cash_number', { p_store_id: currentStore!.id });

        if (numberError) throw numberError;

        const pettyCashData = {
          store_id: currentStore!.id,
          petty_cash_number: pettyCashNumber,
          given_date: givenDate,
          recipient_name: recipientName.trim(),
          amount,
          purpose: purpose.trim() || null,
          notes: notes.trim() || null,
          created_by: profile!.id,
        };

        const { error } = await supabase
          .from('petty_cash')
          .insert(pettyCashData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Petty cash error:', error);
      toast.error(error.message || 'Failed to save petty cash record');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-secondary-900">
              {record ? 'View Petty Cash Record' : 'Give Petty Cash'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Date and Recipient Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                value={givenDate}
                onChange={(e) => setGivenDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Name *
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter recipient name"
                required
              />
            </div>
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
              placeholder="0.00"
              required
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose
            </label>
            <input
              type="text"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Office supplies, Transportation, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              placeholder="Additional notes (optional)"
            />
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
              {processing ? 'Saving...' : record ? 'Update Record' : 'Give Petty Cash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
