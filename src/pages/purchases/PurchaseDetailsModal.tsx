import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Package, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../../lib/utils';
import { RecordPurchasePaymentModal } from './RecordPurchasePaymentModal';

interface PurchaseDetails {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier_name: string;
  supplier_phone: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  payment_status: string;
  status: string;
  items: PurchaseItem[];
  payments: Payment[];
}

interface PurchaseItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
}

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
}

interface PurchaseDetailsModalProps {
  purchaseId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function PurchaseDetailsModal({ purchaseId, onClose, onUpdate }: PurchaseDetailsModalProps) {
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadPurchaseDetails();
  }, [purchaseId]);

  const loadPurchaseDetails = async () => {
    setLoading(true);
    try {
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select(`
          *,
          suppliers (
            name,
            phone
          )
        `)
        .eq('id', purchaseId)
        .single();

      if (purchaseError) throw purchaseError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('purchase_items')
        .select(`
          *,
          products (
            name
          )
        `)
        .eq('purchase_id', purchaseId);

      if (itemsError) throw itemsError;

      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('reference_type', 'purchase')
        .eq('reference_id', purchaseId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      setPurchase({
        id: purchaseData.id,
        purchase_number: purchaseData.purchase_number,
        purchase_date: purchaseData.purchase_date,
        supplier_name: purchaseData.suppliers?.name || 'Unknown',
        supplier_phone: purchaseData.suppliers?.phone || null,
        subtotal: purchaseData.subtotal,
        tax_amount: purchaseData.tax_amount,
        total_amount: purchaseData.total_amount,
        payment_status: purchaseData.payment_status,
        status: purchaseData.status,
        items: itemsData.map((item: any) => ({
          id: item.id,
          product_name: item.products.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          tax_amount: item.tax_amount,
          total_amount: item.total_amount,
        })),
        payments: paymentsData || [],
      });
    } catch (error: any) {
      console.error('Load purchase details error:', error);
      toast.error('Failed to load purchase details');
    } finally {
      setLoading(false);
    }
  };

  const markAsReceived = async () => {
    if (!purchase || purchase.status === 'received') return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('purchases')
        .update({ status: 'received' })
        .eq('id', purchaseId);

      if (error) throw error;

      toast.success('Purchase marked as received! Inventory updated.');
      loadPurchaseDetails();
      onUpdate();
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error('Failed to update purchase status');
    } finally {
      setUpdating(false);
    }
  };

  const totalPaid = purchase?.payments.reduce((sum, p) => sum + p.amount, 0) || 0;
  const balanceDue = (purchase?.total_amount || 0) - totalPaid;

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

  if (!purchase) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">{purchase.purchase_number}</h2>
            <p className="text-sm text-secondary-600">{formatDate(purchase.purchase_date)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Supplier Info & Actions */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Supplier</h3>
              <p className="text-secondary-900 font-medium">{purchase.supplier_name}</p>
              {purchase.supplier_phone && (
                <p className="text-sm text-secondary-600">{purchase.supplier_phone}</p>
              )}
            </div>
            {purchase.status === 'ordered' && (
              <button
                onClick={markAsReceived}
                disabled={updating}
                className="btn-primary flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                {updating ? 'Updating...' : 'Mark as Received'}
              </button>
            )}
          </div>

          {/* Status */}
          <div className="flex gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                purchase.status === 'received' ? 'bg-green-100 text-green-800' :
                purchase.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {purchase.status}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Payment Status</h3>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                purchase.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                purchase.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {purchase.payment_status}
              </span>
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
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tax</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {purchase.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-sm text-secondary-900">{item.product_name}</td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right text-secondary-900">
                        {formatCurrency(item.unit_price)}
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
                <span className="text-secondary-900">{formatCurrency(purchase.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="text-secondary-900">{formatCurrency(purchase.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary-600">{formatCurrency(purchase.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {purchase.payments.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-3">Payment History</h3>
              <div className="space-y-2">
                {purchase.payments.map((payment) => (
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
        <RecordPurchasePaymentModal
          purchaseId={purchase.id}
          supplierId={purchase.id}
          balanceDue={balanceDue}
          onSuccess={() => {
            setShowPaymentModal(false);
            loadPurchaseDetails();
            onUpdate();
            toast.success('Payment recorded successfully!');
          }}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
