import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { Search, Eye, Printer } from 'lucide-react';
import { SaleDetailsModal } from './SaleDetailsModal';
import { formatCurrency, formatDate } from '../../lib/utils';

interface Sale {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  total_amount: number;
  payment_status: 'paid' | 'pending' | 'partial';
  payment_method: 'cash' | 'card' | 'upi' | 'credit';
  status: 'draft' | 'completed' | 'cancelled';
}

export function SalesPage() {
  const { currentStore } = useStoreStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedSale, setSelectedSale] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (currentStore) {
      loadSales();
    }
  }, [currentStore, statusFilter, paymentFilter, dateFrom, dateTo]);

  const loadSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('sales')
        .select(`
          id,
          invoice_number,
          sale_date,
          total_amount,
          payment_status,
          payment_method,
          status,
          customers (
            name
          )
        `)
        .eq('store_id', currentStore!.id)
        .order('sale_date', { ascending: false });

      // Apply filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (paymentFilter !== 'all') {
        query = query.eq('payment_status', paymentFilter);
      }
      if (dateFrom) {
        query = query.gte('sale_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('sale_date', dateTo + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedSales = data.map((sale: any) => ({
        id: sale.id,
        invoice_number: sale.invoice_number,
        sale_date: sale.sale_date,
        customer_name: sale.customers?.name || 'Walk-in Customer',
        total_amount: sale.total_amount,
        payment_status: sale.payment_status,
        payment_method: sale.payment_method,
        status: sale.status,
      }));

      setSales(formattedSales);
    } catch (error: any) {
      console.error('Load sales error:', error);
      toast.error('Failed to load sales');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      draft: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || styles.draft;
  };

  const getPaymentStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-red-100 text-red-800',
      partial: 'bg-yellow-100 text-yellow-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const paidSales = filteredSales.filter(s => s.payment_status === 'paid').length;
  const pendingSales = filteredSales.filter(s => s.payment_status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Sales</h1>
          <p className="text-secondary-600">View and manage all sales transactions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Sales</div>
          <div className="text-2xl font-bold text-secondary-900">{filteredSales.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-primary-600">{formatCurrency(totalSales)}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Paid</div>
          <div className="text-2xl font-bold text-green-600">{paidSales}</div>
        </div>
        <div className="card">
          <div className="text-sm text-secondary-600 mb-1">Pending</div>
          <div className="text-2xl font-bold text-red-600">{pendingSales}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by invoice or customer..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Filter */}
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

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto"></div>
            <p className="mt-2 text-secondary-600">Loading sales...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-600">No sales found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
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
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">{sale.invoice_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                      {formatDate(sale.sale_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                      {sale.customer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-secondary-900">
                        {formatCurrency(sale.total_amount)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">{sale.payment_method}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(sale.payment_status)}`}>
                        {sale.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sale.status)}`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSale(sale.id)}
                          className="text-primary-600 hover:text-primary-700"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toast.success('Print feature coming soon!')}
                          className="text-gray-600 hover:text-gray-700"
                          title="Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          saleId={selectedSale}
          onClose={() => setSelectedSale(null)}
          onUpdate={loadSales}
        />
      )}
    </div>
  );
}
