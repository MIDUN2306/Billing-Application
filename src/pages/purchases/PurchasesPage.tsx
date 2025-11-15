import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Eye, Plus, RotateCw } from 'lucide-react';
import { PurchaseDetailsModal } from './PurchaseDetailsModal';
import { PurchaseFormModal } from './PurchaseFormModal';
import { formatCurrency, formatDate } from '../../lib/utils';

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_name: string;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  status: 'ordered' | 'received' | 'cancelled';
}

export function PurchasesPage() {
  const { currentStore } = useStoreStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Refs to prevent race conditions
  const loadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadPurchases = useCallback(async (isRefresh = false) => {
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
        .from('purchases')
        .select(`
          id,
          purchase_number,
          purchase_date,
          total_amount,
          payment_status,
          status,
          suppliers (
            name
          )
        `)
        .eq('store_id', currentStore!.id)
        .order('purchase_date', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
      }
      if (dateFrom) {
        query = query.gte('purchase_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('purchase_date', dateTo + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedPurchases = data.map((purchase: any) => ({
        id: purchase.id,
        purchase_number: purchase.purchase_number,
        purchase_date: purchase.purchase_date,
        supplier_name: purchase.suppliers?.name || 'Unknown',
        total_amount: purchase.total_amount,
        payment_status: purchase.payment_status,
        status: purchase.status,
      }));

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      setPurchases(formattedPurchases);
      
      if (isRefresh) {
        toast.success('Purchases refreshed');
      }
    } catch (error: any) {
      console.error('Load purchases error:', error);
      
      // Only show error if component is still mounted
      if (isMountedRef.current) {
        toast.error('Failed to load purchases');
      }
    } finally {
      // Only update state if component is still mounted
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
      loadingRef.current = false;
    }
  }, [currentStore?.id, statusFilter, paymentFilter, dateFrom, dateTo]);

  // Load purchases when component mounts or filters change
  useEffect(() => {
    isMountedRef.current = true;
    loadingRef.current = false;
    
    if (currentStore?.id) {
      loadPurchases();
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.id, statusFilter, paymentFilter, dateFrom, dateTo]); // Don't include loadPurchases

  const handleRefresh = () => {
    loadPurchases(true);
  };

  const filteredPurchases = purchases.filter(purchase =>
    purchase.purchase_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    purchase.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      received: 'bg-green-100 text-green-800',
      ordered: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.ordered;
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + p.total_amount, 0);
  const paidPurchases = filteredPurchases.filter(p => p.payment_status === 'paid').length;
  const pendingPurchases = filteredPurchases.filter(p => p.payment_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Purchases</h1>
          <p className="text-secondary-600">Manage inventory purchases from suppliers</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Refresh purchases"
          >
            <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowFormModal(true)}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="w-5 h-5" />
            New Purchase
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Purchases</div>
          <div className="text-2xl font-bold text-secondary-900">{filteredPurchases.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-primary-600">{formatCurrency(totalPurchases)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-600">{paidPurchases}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-red-600">{pendingPurchases}</div>
        </div>
      </div>

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
                placeholder="Search by PO number or supplier..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="ordered">Ordered</option>
              <option value="received">Received</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
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

      {/* Purchases Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto"></div>
            <p className="mt-2 text-secondary-600">Loading purchases...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-600">No purchases found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">{purchase.purchase_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {formatDate(purchase.purchase_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {purchase.supplier_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">
                        {formatCurrency(purchase.total_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(purchase.payment_status)}`}>
                        {purchase.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(purchase.status)}`}>
                        {purchase.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedPurchase(purchase.id)}
                        className="text-primary-600 hover:text-primary-700"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedPurchase && (
        <PurchaseDetailsModal
          purchaseId={selectedPurchase}
          onClose={() => setSelectedPurchase(null)}
          onUpdate={loadPurchases}
        />
      )}

      {showFormModal && (
        <PurchaseFormModal
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            setShowFormModal(false);
            loadPurchases();
            toast.success('Purchase created successfully!');
          }}
        />
      )}
    </div>
  );
}
