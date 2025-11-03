import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Plus, Eye, Trash2, RotateCw, Wallet } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useLocation } from 'react-router-dom';
import { GivePettyCashModal } from '.';

interface PettyCash {
  id: string;
  petty_cash_number: string;
  recipient_name: string;
  amount: number;
  given_date: string;
  purpose: string | null;
  notes: string | null;
}

export function PettyCashPage() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const [pettyCashRecords, setPettyCashRecords] = useState<PettyCash[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PettyCash | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadPettyCash = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      let query = supabase
        .from('petty_cash')
        .select('*')
        .eq('store_id', currentStore!.id)
        .order('given_date', { ascending: false });

      if (dateFrom) {
        query = query.gte('given_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('given_date', dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPettyCashRecords(data || []);
      
      if (isRefresh) {
        toast.success('Petty cash records refreshed');
      }
    } catch (error: any) {
      console.error('Load petty cash error:', error);
      toast.error('Failed to load petty cash records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStore, dateFrom, dateTo]);

  useEffect(() => {
    if (currentStore) {
      loadPettyCash();
    }
  }, [currentStore, dateFrom, dateTo, location.pathname, loadPettyCash]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        loadPettyCash();
      }
    };
    const handleFocus = () => {
      if (currentStore) {
        loadPettyCash();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore, loadPettyCash]);

  const handleRefresh = () => {
    loadPettyCash(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this petty cash record?')) return;

    try {
      const { error } = await supabase
        .from('petty_cash')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Petty cash record deleted successfully');
      loadPettyCash();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error('Failed to delete petty cash record');
    }
  };

  const filteredRecords = pettyCashRecords.filter(record =>
    record.petty_cash_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    record.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (record.purpose && record.purpose.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 flex items-center gap-2">
            <Wallet className="w-7 h-7 text-primary-600" />
            Petty Cash
          </h1>
          <p className="text-secondary-600">Track petty cash disbursements</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Refresh petty cash"
          >
            <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => {
              setEditingRecord(null);
              setShowFormModal(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="w-5 h-5" />
            Give Petty Cash
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Records</div>
          <div className="text-2xl font-bold text-secondary-900">{filteredRecords.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Amount Given</div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Average Amount</div>
          <div className="text-2xl font-bold text-secondary-900">
            {filteredRecords.length > 0 ? formatCurrency(totalAmount / filteredRecords.length) : '₹0.00'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, number, or purpose..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="From Date"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="To Date"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Petty Cash Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto"></div>
            <p className="mt-2 text-secondary-600">Loading petty cash records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-secondary-600">No petty cash records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">{record.petty_cash_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {formatDate(record.given_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">{record.recipient_name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-900">
                      <div className="max-w-xs truncate">{record.purpose || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-red-600">
                        {formatCurrency(record.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingRecord(record);
                            setShowFormModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-700"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
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
        <GivePettyCashModal
          record={editingRecord}
          onClose={() => {
            setShowFormModal(false);
            setEditingRecord(null);
          }}
          onSuccess={() => {
            setShowFormModal(false);
            setEditingRecord(null);
            loadPettyCash();
            toast.success(editingRecord ? 'Petty cash record updated!' : 'Petty cash given successfully!');
          }}
        />
      )}
    </div>
  );
}
