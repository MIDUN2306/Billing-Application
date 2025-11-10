import { useEffect, useState } from 'react';
import { X, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface PettyCashRecord {
  id: string;
  amount: number;
  recipient_name: string;
  purpose: string;
  given_date: string;
  notes: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  filterLabel: string;
}

const PAGE_SIZE = 20;

export function PettyCashDetailsModal({ isOpen, onClose, startDate, endDate, filterLabel }: Props) {
  const { currentStore } = useStoreStore();
  const [records, setRecords] = useState<PettyCashRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen && currentStore) {
      setCurrentPage(1);
      loadRecords(1);
      loadTotalAmount();
    }
  }, [isOpen, currentStore]);

  const loadTotalAmount = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('petty_cash')
        .select('amount')
        .eq('store_id', currentStore.id)
        .gte('given_date', startDate)
        .lte('given_date', endDate);

      if (error) throw error;

      const total = (data || []).reduce((sum, item) => sum + item.amount, 0);
      setTotalAmount(total);
      setTotalCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error loading total amount:', error);
    }
  };

  const loadRecords = async (page: number) => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data, error } = await supabase
        .from('petty_cash')
        .select('*')
        .eq('store_id', currentStore.id)
        .gte('given_date', startDate)
        .lte('given_date', endDate)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setRecords(data || []);
    } catch (error: any) {
      console.error('Error loading petty cash records:', error);
      toast.error('Failed to load petty cash records');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadRecords(newPage);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-200 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-purple-900">Petty Cash Records</h2>
              <p className="text-sm text-purple-700">{filterLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Given To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.recipient_name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{record.purpose}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-purple-700">
                          ₹ {record.amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{record.notes || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(record.given_date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-purple-50">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Total:
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-purple-700">
                      ₹ {totalAmount.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No petty cash records for this period</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalCount} records)
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          {totalPages <= 1 && <div></div>}
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
