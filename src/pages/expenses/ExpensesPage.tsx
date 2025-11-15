import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Plus, Eye, Trash2, RotateCw } from 'lucide-react';
import { ExpenseFormModal } from './ExpenseFormModal';
import { formatCurrency, formatDate } from '../../lib/utils';

interface Expense {
  id: string;
  expense_number: string;
  expense_date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'upi';
}

export function ExpensesPage() {
  const { currentStore } = useStoreStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs to prevent race conditions
  const loadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadExpenses = useCallback(async (isRefresh = false) => {
    if (!currentStore?.id) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current && !isRefresh) {
      return;
    }

    loadingRef.current = true;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      let query = supabase
        .from('expenses')
        .select('*')
        .eq('store_id', currentStore!.id)
        .order('expense_date', { ascending: false });

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }
      if (paymentFilter !== 'all') {
        query = query.eq('payment_method', paymentFilter);
      }
      if (dateFrom) {
        query = query.gte('expense_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('expense_date', dateTo + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }
      
      setExpenses(data || []);
      
      if (isRefresh) {
        toast.success('Expenses refreshed');
      }
    } catch (error: any) {
      console.error('Load expenses error:', error);
      
      // Only show error if component is still mounted
      if (isMountedRef.current) {
        toast.error('Failed to load expenses');
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      loadingRef.current = false;
    }
  }, [currentStore?.id, categoryFilter, paymentFilter, dateFrom, dateTo]);

  // Load expenses when component mounts or filters change
  useEffect(() => {
    isMountedRef.current = true;
    loadingRef.current = false;
    
    if (currentStore?.id) {
      loadExpenses();
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.id, categoryFilter, paymentFilter, dateFrom, dateTo]); // Don't include loadExpenses

  const handleRefresh = () => {
    loadExpenses(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Expense deleted successfully');
      loadExpenses();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.expense_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get unique categories for filter
  const categories = Array.from(new Set(expenses.map(e => e.category))).sort();

  // Category breakdown
  const categoryBreakdown = categories.map(cat => ({
    category: cat,
    amount: filteredExpenses
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Expenses</h1>
          <p className="text-secondary-600">Track and manage business expenses</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Refresh expenses"
          >
            <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowFormModal(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="w-5 h-5" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Expenses</div>
          <div className="text-2xl font-bold text-secondary-900">{filteredExpenses.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Categories</div>
          <div className="text-2xl font-bold text-secondary-900">{categories.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Avg per Expense</div>
          <div className="text-2xl font-bold text-secondary-900">
            {filteredExpenses.length > 0 ? formatCurrency(totalExpenses / filteredExpenses.length) : '₹0.00'}
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Expense by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryBreakdown.map(item => (
              <div key={item.category} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1 capitalize">{item.category}</p>
                <p className="text-lg font-bold text-secondary-900">{formatCurrency(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expenses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto"></div>
            <p className="mt-2 text-secondary-600">Loading expenses...</p>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-600">No expenses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">{expense.expense_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {formatDate(expense.expense_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-900">
                      <div className="max-w-xs truncate">{expense.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-red-600">
                        {formatCurrency(expense.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 capitalize">
                      {expense.payment_method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setShowFormModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-700"
                          title="Edit"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <ExpenseFormModal
          expense={editingExpense}
          onClose={() => {
            setShowFormModal(false);
            setEditingExpense(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingExpense(null);
            loadExpenses();
            toast.success(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
          }}
        />
      )}
    </div>
  );
}
