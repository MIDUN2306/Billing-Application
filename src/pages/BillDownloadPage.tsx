import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateBillPDF } from '../utils/billGenerator';
import { Download, FileText } from 'lucide-react';

export function BillDownloadPage() {
  const { invoiceNumber } = useParams<{ invoiceNumber: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [billData, setBillData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadBillData();
  }, [invoiceNumber]);

  // Auto-download PDF when bill data is loaded
  useEffect(() => {
    if (billData && !loading && !error) {
      // Small delay to ensure page is rendered
      const timer = setTimeout(() => {
        downloadBill();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [billData, loading, error]);

  const loadBillData = async () => {
    try {
      setLoading(true);
      
      // Fetch sale data
      const { data: sales, error: saleError } = await supabase
        .from('sales')
        .select(`
          *,
          customers!sales_customer_id_fkey(name, phone),
          sale_items(
            *,
            products(name, sku)
          ),
          stores!sales_store_id_fkey(name, address, phone, gst_number)
        `)
        .eq('invoice_number', invoiceNumber);

      if (saleError) throw saleError;
      if (!sales || sales.length === 0) throw new Error('Bill not found');
      
      const sale = sales[0];
      
      // Restructure the data to match expected format
      const billData = {
        ...sale,
        customer: sale.customers,
        store: sale.stores
      };

      setBillData(billData);
    } catch (error: any) {
      console.error('Error loading bill:', error);
      setError(error.message || 'Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const downloadBill = async () => {
    if (!billData || downloading) return;

    try {
      setDownloading(true);
      await generateBillPDF({
        invoiceNumber: billData.invoice_number,
        storeName: billData.store.name,
        storeAddress: billData.store.address,
        storePhone: billData.store.phone,
        storeGST: billData.store.gst_number,
        customerName: billData.customer?.name,
        customerPhone: billData.customer?.phone,
        date: new Date(billData.sale_date).toLocaleDateString('en-IN'),
        items: billData.sale_items.map((item: any) => ({
          name: item.products?.name || 'Unknown Product',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          discount: item.discount_amount || 0,
          total: item.total_amount,
        })),
        subtotal: billData.sale_items.reduce((sum: number, item: any) => 
          sum + item.total_amount + (item.discount_amount || 0), 0),
        discount: billData.sale_items.reduce((sum: number, item: any) => 
          sum + (item.discount_amount || 0), 0),
        tax: 0,
        total: billData.total_amount,
        paymentMethod: billData.payment_method,
      });
      setDownloading(false);
    } catch (error) {
      console.error('Download error:', error);
      setDownloading(false);
      alert('Failed to download bill');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bill...</p>
        </div>
      </div>
    );
  }

  if (error || !billData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested bill could not be found.'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Auto-download notification */}
        {downloading && (
          <div className="bg-primary-600 text-white rounded-lg shadow-lg p-4 mb-6 flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="font-semibold">Downloading your bill...</span>
          </div>
        )}

        {!downloading && billData && (
          <div className="bg-green-600 text-white rounded-lg shadow-lg p-4 mb-6 text-center">
            <p className="font-semibold">✓ Your bill has been downloaded!</p>
            <p className="text-sm mt-1">Check your downloads folder</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {billData.store.name}
            </h1>
            <p className="text-gray-600">{billData.store.address}</p>
            {billData.store.phone && (
              <p className="text-gray-600">Ph: {billData.store.phone}</p>
            )}
            {billData.store.gst_number && (
              <p className="text-gray-600">GST: {billData.store.gst_number}</p>
            )}
          </div>
        </div>

        {/* Bill Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="border-b pb-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Invoice Number</p>
                <p className="text-lg font-bold">{billData.invoice_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Date</p>
                <p className="text-lg font-bold">
                  {new Date(billData.sale_date).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {billData.customer && (
            <div className="border-b pb-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Customer</p>
              <p className="font-semibold">{billData.customer.name}</p>
              {billData.customer.phone && (
                <p className="text-sm text-gray-600">{billData.customer.phone}</p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Items</h3>
            <div className="space-y-2">
              {billData.sale_items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div className="flex-1">
                    <p className="font-medium">{item.products?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity} × Rs{item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">Rs{item.total_amount.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary-600">Rs{billData.total_amount.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Payment Method: {billData.payment_method.toUpperCase()}
            </p>
          </div>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadBill}
          disabled={downloading}
          className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-6 h-6" />
          {downloading ? 'Downloading...' : 'Download Again'}
        </button>

        {/* Eco Message */}
        <p className="text-center text-sm text-gray-600 mt-4">
          🌱 Digital receipt - Save paper, Save trees
        </p>
      </div>
    </div>
  );
}
