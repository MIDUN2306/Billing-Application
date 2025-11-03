import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { Download, Eye, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateBillPDF } from '../../utils/billGenerator';

interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  sale_date: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  customer?: {
    name: string;
    phone: string;
  };
  sale_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_amount: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
}

type DateFilter = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

export function SalesHistoryPage() {
  const { currentStore } = useStoreStore();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (currentStore) {
      loadSales();
    }
  }, [currentStore, dateFilter, customStartDate, customEndDate]);

  const getDateRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let startDate = new Date(today);
    let endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    switch (dateFilter) {
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
        if (customStartDate) startDate = new Date(customStartDate);
        if (customEndDate) {
          endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };

  const loadSales = async () => {
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          customer:customers(name, phone),
          sale_items(
            *,
            product:products(name, sku)
          )
        `)
        .eq('store_id', currentStore!.id)
        .gte('sale_date', start)
        .lte('sale_date', end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      console.error('Error loading sales:', error);
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const downloadBill = async (sale: Sale) => {
    try {
      if (!sale.sale_items || sale.sale_items.length === 0) {
        toast.error('No items found for this sale');
        return;
      }

      await generateBillPDF({
        invoiceNumber: sale.invoice_number,
        storeName: currentStore!.name,
        storeAddress: currentStore!.address || undefined,
        storePhone: currentStore!.phone || undefined,
        storeGST: currentStore!.gst_number || undefined,
        customerName: sale.customer?.name,
        customerPhone: sale.customer?.phone,
        date: new Date(sale.sale_date).toLocaleDateString('en-IN'),
        items: sale.sale_items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount_amount || 0,
          total: item.total_amount,
        })),
        subtotal: sale.sale_items.reduce((sum, item) => sum + item.total_amount + (item.discount_amount || 0), 0),
        discount: sale.sale_items.reduce((sum, item) => sum + (item.discount_amount || 0), 0),
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

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sale.invoice_number.toLowerCase().includes(search) ||
      sale.customer?.name?.toLowerCase().includes(search) ||
      sale.customer?.phone?.includes(search)
    );
  });

  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
  const totalPaid = filteredSales.reduce((sum, sale) => sum + sale.paid_amount, 0);
  const totalPending = filteredSales.reduce((sum, sale) => sum + sale.balance_amount, 0);

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
          <p className="text-2xl font-bold text-gray-900">₹{totalSales.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">{filteredSales.length} transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Amount Received</p>
          <p className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-1">Pending Amount</p>
          <p className="text-2xl font-bold text-red-600">₹{totalPending.toFixed(2)}</p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading sales...</div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No sales found for the selected period
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
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {sale.invoice_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(sale.sale_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {sale.customer ? (
                        <div>
                          <p className="font-medium">{sale.customer.name}</p>
                          <p className="text-xs text-gray-500">{sale.customer.phone}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">Walk-in</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {sale.sale_items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      ₹{sale.total_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600">
                      ₹{sale.paid_amount.toFixed(2)}
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
                          onClick={() => setSelectedSale(sale)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => downloadBill(sale)}
                          className="text-green-600 hover:text-green-800"
                          title="Download Bill"
                        >
                          <Download className="w-5 h-5" />
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
  sale: Sale;
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
            {sale.customer && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">{sale.customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{sale.customer.phone}</p>
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
                  {sale.sale_items?.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{item.product.name}</p>
                        {item.product.sku && (
                          <p className="text-xs text-gray-500">{item.product.sku}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right">₹{item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {item.discount_amount > 0 ? `-₹${item.discount_amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ₹{item.total_amount.toFixed(2)}
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
              <span className="font-semibold">₹{sale.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paid Amount:</span>
              <span className="font-semibold text-green-600">₹{sale.paid_amount.toFixed(2)}</span>
            </div>
            {sale.balance_amount > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-gray-600">Balance:</span>
                <span className="font-semibold text-red-600">₹{sale.balance_amount.toFixed(2)}</span>
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
