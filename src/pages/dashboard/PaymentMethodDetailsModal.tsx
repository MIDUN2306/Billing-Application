import { useEffect, useState } from 'react';
import { X, CreditCard, ChevronLeft, ChevronRight, User, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { getPaymentMethodColor, getPaymentMethodLabel } from '../../utils/chartHelpers';

interface Transaction {
  id: string;
  sale_date: string;
  customer_name: string;
  total_amount: number;
  payment_method: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: string;
  startDate: string;
  endDate: string;
  filterLabel: string;
}

const PAGE_SIZE = 20;

export function PaymentMethodDetailsModal({ 
  isOpen, 
  onClose, 
  paymentMethod, 
  startDate, 
  endDate, 
  filterLabel 
}: Props) {
  const { currentStore } = useStoreStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen && currentStore && paymentMethod) {
      setCurrentPage(1);
      loadTransactions(1);
      loadTotalStats();
    }
  }, [isOpen, currentStore, paymentMethod]);

  const loadTotalStats = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase.rpc('get_payment_method_transactions_count', {
        p_store_id: currentStore.id,
        p_payment_method: paymentMethod,
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setTotalCount(Number(data[0].total_count));
        setTotalAmount(Number(data[0].total_amount));
      }
    } catch (error: any) {
      console.error('Error loading total stats:', error);
    }
  };

  const loadTransactions = async (page: number) => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const offset = (page - 1) * PAGE_SIZE;
      
      const { data, error } = await supabase.rpc('get_payment_method_transactions', {
        p_store_id: currentStore.id,
        p_payment_method: paymentMethod,
        p_start_date: startDate,
        p_end_date: endDate,
        p_limit: PAGE_SIZE,
        p_offset: offset
      });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadTransactions(newPage);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const methodColor = getPaymentMethodColor(paymentMethod);
  const methodLabel = getPaymentMethodLabel(paymentMethod);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{ backgroundColor: `${methodColor}15` }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow-md"
              style={{ backgroundColor: methodColor }}
            >
              <CreditCard className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{methodLabel} Transactions</h2>
              <p className="text-sm text-gray-600">{filterLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Total Amount</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: methodColor }}>
              ₹ {totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Total Transactions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-320px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div 
                className="animate-spin rounded-full h-12 w-12 border-b-2"
                style={{ borderColor: methodColor }}
              ></div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(transaction.sale_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(transaction.sale_date).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{transaction.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold" style={{ color: methodColor }}>
                          ₹ {transaction.total_amount.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found for this payment method</p>
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
                Page {currentPage} of {totalPages} ({totalCount} transactions)
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
