import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { Download, Eye, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateBillPDF } from '../../utils/billGenerator';

interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: string;
  status: string;
  items_count: number;
  created_at: string;
}

interface SaleDetails extends Sale {
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    product_sku: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
  }>;
}

interface SalesSummary {
  total_sales: number;
  total_transactions: number;
  total_paid: number;
  total_pending: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  credit_sales: number;
  bank_transfer_sales: number;
  avg_transaction_value: number;
}

type DateFilter = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';
type PaymentMethodFilter = 'all' | 'cash' | 'card' | 'upi' | 'credit' | 'bank_transfer';

export function SalesHistoryPage() {
  const { currentStore } = useStoreStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethodFilter>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<SaleDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  useEffect(() => {
    if (currentStore) {
      setCurrentPage(1); // Reset to first page when filters change
      loadSales();
      loadSummary();
    }
  }, [currentStore, dateFilter, paymentMethodFilter, customStartDate, customEndDate]);

  useEffect(() => {
    if (currentStore) {
      loadSales();
    }
  }, [currentPage, searchTerm]);

  const getDateRange = () => {
    // Get current date in local timezone
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate = new Date(today);
    let endDate = new Date(today);

    switch (dateFilter) {
      case 'today':
        // Today: start and end are the same date
        break;
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1);
        endDate.setDate(endDate.getDate() - 1);
        break;
      case 'last7days':
        startDate.setDate(startDate.getDate() - 6);
        break;
      case 'last30days':
        startDate.setDate(startDate.getDate() - 29);
        break;
      case 'custom':
        if (customStartDate) {
          startDate = new Date(customStartDate + 'T00:00:00');
        }
        if (customEndDate) {
          endDate = new Date(customEndDate + 'T00:00:00');
        }
        break;
    }

    // Format dates as YYYY-MM-DD in local timezone
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(startDate),
      end: formatDate(endDate),
    };
  };

  const loadSummary = async () => {
    try {
      const { start, end } = getDateRange();

      const { data, error } = await supabase.rpc('get_sales_summary', {
        p_store_id: currentStore!.id,
        p_start_date: start,
        p_end_date: end,
        p_payment_method: paymentMethodFilter === 'all' ? null : paymentMethodFilter,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setSummary(data[0]);
      }
    } catch (error: any) {
      console.error('Error loading sales summary:', error);
      toast.error('Failed to load sales summary');
    }
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data, error } = await supabase.rpc('get_sales_paginated', {
        p_store_id: currentStore!.id,
        p_start_date: start,
        p_end_date: end,
        p_payment_method: paymentMethodFilter === 'all' ? null : paymentMethodFilter,
        p_search_term: searchTerm || null,
        p_page: currentPage,
        p_page_size: pageSize,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSales(data);
        setTotalCount(data[0].total_count || 0);
      } else {
        setSales([]);
        setTotalCount(0);
      }
    } catch (error: any) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const loadSaleDetails = async (saleId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_sale_details', {
        p_sale_id: saleId,
        p_store_id: currentStore!.id,
      });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setSelectedSale(data[0]);
      }
    } catch (error: any) {
      console.error('Error loading sale details:', error);
      toast.error('Failed to load sale details');
    }
  };

  const downloadBill = async (sale: SaleDetails) => {
    try {
      if (!sale.items || sale.items.length === 0) {
        toast.error('No items found for this sale');
        return;
      }

      await generateBillPDF({
        invoiceNumber: sale.invoice_number,
        storeName: currentStore!.name,
        storeAddress: currentStore!.address || undefined,
        storePhone: currentStore!.phone || undefined,
        storeGST: currentStore!.gst_number || undefined,
        customerName: sale.customer_name || undefined,
        customerPhone: sale.customer_phone || undefined,
        date: new Date(sale.sale_date).toLocaleDateString('en-IN'),
        items: sale.items.map(item => ({
          name: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount_amount || 0,
          total: item.total_amount,
        })),
        subtotal: sale.items.reduce((sum, item) => sum + item.total_amount + (item.discount_amount || 0), 0),
        discount: sale.items.reduce((sum, item) => sum + (item.discount_amount || 0), 0),
        tax: 0,
        total: sale.total_amount,
        paymentMethod: sale.payment_method,
      });

      toast.success('Bill downloaded successfully!');
    } catch (error: any) {
      console.error('Error downloading bill:', error);
      toast.error('Failed to download bill');
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        <p className="text-gray-600">View and manage your sales records</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        {/* Date Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'today', label: 'Today' },
            { value: 'yesterday', label: 'Yesterday' },
            { value: 'last7days', label: 'Last 7 Days' },
            { value: 'last30days', label: 'Last 30 Days' },
            { value: 'custom', label: 'Custom Range' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDateFilter(filter.value as DateFilter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === filter.value
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}

        {/* Payment Method Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Methods' },
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'upi', label: 'UPI' },
              { value: 'credit', label: 'Credit' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
            ].map((method) => (
              <button
                key={method.value}
                onClick={() => setPaymentMethodFilter(method.value as PaymentMethodFilter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  paymentMethodFilter === method.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by invoice, customer name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">
            ₹ {summary?.total_sales?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {summary?.total_transactions || 0} transactions
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Amount Received</p>
          <p className="text-2xl font-bold text-green-600">
            ₹ {summary?.total_paid?.toFixed(2) || '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
          <p className="text-2xl font-bold text-red-600">
            ₹ {summary?.total_pending?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      {summary && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Method Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-gray-600">Cash</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{summary.cash_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Card</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{summary.card_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">UPI</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{summary.upi_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Credit</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{summary.credit_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Bank Transfer</p>
              <p className="text-lg font-semibold text-gray-900">
                ₹{summary.bank_transfer_sales?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-xs text-gray-600">Average Transaction Value</p>
            <p className="text-lg font-semibold text-gray-900">
              ₹ {summary.avg_transaction_value?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading sales...</div>
        ) : sales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sales found for the selected period
          </div>
        ) : (
          <>
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
                      Items
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paid
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {sale.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(sale.sale_date).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.customer_name ? (
                          <div>
                            <p className="font-medium">{sale.customer_name}</p>
                            <p className="text-xs text-gray-500">{sale.customer_phone}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Walk-in</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {sale.items_count} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        ₹ {sale.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                        ₹ {sale.paid_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {sale.payment_method.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sale.balance_amount > 0
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {sale.balance_amount > 0 ? 'Pending' : 'Paid'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => loadSaleDetails(sale.id)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-lg ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onDownload={() => downloadBill(selectedSale)}
        />
      )}
    </div>
  );
}

// Sale Details Modal Component
function SaleDetailsModal({
  sale,
  onClose,
  onDownload,
}: {
  sale: SaleDetails;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold">Sale Details</h2>
            <p className="text-sm text-gray-600">Invoice: {sale.invoice_number}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Sale Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{new Date(sale.sale_date).toLocaleDateString('en-IN')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium">{sale.payment_method.toUpperCase()}</p>
            </div>
            {sale.customer_name && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{sale.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{sale.customer_phone}</p>
                </div>
              </>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Discount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{item.product_name}</p>
                        {item.product_sku && (
                          <p className="text-xs text-gray-500">{item.product_sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">₹ {item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {item.discount_amount > 0 ? `-₹ ${item.discount_amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ₹ {item.total_amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹ {sale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-semibold text-green-600">₹ {sale.paid_amount.toFixed(2)}</span>
            </div>
            {sale.balance_amount > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Balance:</span>
                <span className="font-semibold text-red-600">₹ {sale.balance_amount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onDownload}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Bill
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
