import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Printer, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { RecordPaymentModal } from './RecordPaymentModal';

interface SaleDetails {
  id: string;
  invoice_number: string;
  sale_date: string;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  status: string;
  notes: string | null;
  items: SaleItem[];
  payments: Payment[];
}

interface SaleItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  notes: string | null;
}

interface SaleDetailsModalProps {
  saleId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function SaleDetailsModal({ saleId, onClose, onUpdate }: SaleDetailsModalProps) {
  const [sale, setSale] = useState<SaleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadSaleDetails();
  }, [saleId]);

  const loadSaleDetails = async () => {
    setLoading(true);
    try {
      // Load sale with customer
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          customers (
            name,
            phone
          )
        `)
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      // Load sale items with product names
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          products (
            name
          )
        `)
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      // Load payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('reference_type', 'sale')
        .eq('reference_id', saleId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      setSale({
        id: saleData.id,
        invoice_number: saleData.invoice_number,
        sale_date: saleData.sale_date,
        customer_name: saleData.customers?.name || 'Walk-in Customer',
        customer_phone: saleData.customers?.phone || null,
        subtotal: saleData.subtotal,
        discount_amount: saleData.discount_amount,
        tax_amount: saleData.tax_amount,
        total_amount: saleData.total_amount,
        payment_status: saleData.payment_status,
        payment_method: saleData.payment_method,
        status: saleData.status,
        notes: saleData.notes,
        items: itemsData.map((item: any) => ({
          id: item.id,
          product_name: item.products.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: item.discount_amount,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount,
        })),
        payments: paymentsData || [],
      });
    } catch (error: any) {
      console.error('Load sale details error:', error);
      toast.error('Failed to load sale details');
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = sale?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = (sale?.total_amount || 0) - totalPaid;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-800 mx-auto"></div>
          <p className="mt-2 text-secondary-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">{sale.invoice_number}</h2>
            <p className="text-sm text-secondary-600">{formatDate(sale.sale_date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success('Print feature coming soon!')}
              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Print Invoice"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Customer</h3>
              <p className="text-secondary-900">{sale.customer_name}</p>
              {sale.customer_phone && (
                <p className="text-sm text-secondary-600">{sale.customer_phone}</p>
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Method</h3>
              <p className="text-secondary-900 capitalize">{sale.payment_method}</p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-3">Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Discount</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tax</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-secondary-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-900">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600">
                        {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-600">
                        {formatCurrency(item.tax_amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-secondary-900">
                        {formatCurrency(item.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-secondary-900">{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="text-red-600">-{formatCurrency(sale.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="text-secondary-900">{formatCurrency(sale.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary-600">{formatCurrency(sale.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {sale.payments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">Payment History</h3>
              <div className="space-y-2">
                {sale.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-secondary-900">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">
                        {payment.payment_method} • {formatDate(payment.payment_date)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Balance Due */}
          {balanceDue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-800 font-medium">Balance Due</p>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(balanceDue)}</p>
                </div>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Record Payment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <RecordPaymentModal
          saleId={sale.id}
          customerId={sale.customer_name !== 'Walk-in Customer' ? sale.id : null}
          balanceDue={balanceDue}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadSaleDetails();
            onUpdate();
            toast.success('Payment recorded successfully!');
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
