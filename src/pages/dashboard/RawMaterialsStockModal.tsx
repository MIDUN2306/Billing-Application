import { useEffect, useState } from 'react';
import { X, Milk, AlertTriangle, CheckCircle, RefreshCw, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { RefillRawMaterialModal } from '../raw-materials/RefillRawMaterialModal';
import toast from 'react-hot-toast';

interface RawMaterialStock {
  id: string;
  raw_material_id: string;
  raw_material_name: string;
  unit: string;
  quantity: number;
  purchase_price: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function RawMaterialsStockModal({ isOpen, onClose }: Props) {
  const { currentStore } = useStoreStore();
  const [stocks, setStocks] = useState<RawMaterialStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refillStock, setRefillStock] = useState<RawMaterialStock | null>(null);

  useEffect(() => {
    if (isOpen && currentStore) {
      loadStocks();
    }
  }, [isOpen, currentStore]);

  const loadStocks = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_raw_material_stock_status')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('raw_material_name');

      if (error) throw error;
      setStocks(data || []);
    } catch (error: any) {
      console.error('Error loading raw material stocks:', error);
      toast.error('Failed to load raw material stocks');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockStatusIcon = (status: string) => {
    switch (status) {
      case 'out_of_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4" />;
      case 'in_stock': return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getStockStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleRefillClose = () => {
    setRefillStock(null);
    loadStocks(); // Reload to show updated quantities
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                <Milk className="w-7 h-7 text-orange-700" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-orange-900">Raw Materials Stock</h2>
                <p className="text-sm text-orange-700">Current inventory levels - Track and refill stock</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-white rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : stocks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stocks.map((stock) => (
                  <div
                    key={stock.id}
                    className={`border-2 rounded-xl p-5 transition-all hover:shadow-lg ${
                      stock.stock_status === 'out_of_stock' ? 'border-red-300 bg-red-50' :
                      stock.stock_status === 'low_stock' ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200 bg-white hover:border-orange-300'
                    }`}
                  >
                    {/* Material Name & Status */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">
                        {stock.raw_material_name}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStockStatusColor(stock.stock_status)}`}>
                        {getStockStatusIcon(stock.stock_status)}
                        {getStockStatusLabel(stock.stock_status)}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Current Stock
                      </p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-3xl font-bold ${
                          stock.stock_status === 'out_of_stock' ? 'text-red-600' :
                          stock.stock_status === 'low_stock' ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {stock.quantity}
                        </p>
                        <span className="text-lg font-medium text-gray-600">{stock.unit}</span>
                      </div>
                    </div>

                    {/* Purchase Price */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Last Purchase Price
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        ₹{stock.purchase_price.toFixed(2)} <span className="text-sm font-normal text-gray-500">per {stock.unit}</span>
                      </p>
                    </div>

                    {/* Refill Button */}
                    <button
                      onClick={() => setRefillStock(stock)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                        stock.stock_status === 'out_of_stock' 
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : stock.stock_status === 'low_stock'
                          ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      {stock.stock_status === 'out_of_stock' ? 'Restock Now' : 'Refill Stock'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                  <Milk className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Raw Materials</h3>
                <p className="text-gray-500 mb-4">Add raw materials to start tracking inventory</p>
                <button
                  onClick={onClose}
                  className="btn-primary"
                >
                  Go to Raw Materials Page
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{stocks.length}</span> raw material{stocks.length !== 1 ? 's' : ''} tracked
              {stocks.filter(s => s.stock_status === 'low_stock' || s.stock_status === 'out_of_stock').length > 0 && (
                <span className="ml-3 text-red-600 font-semibold">
                  • {stocks.filter(s => s.stock_status === 'low_stock' || s.stock_status === 'out_of_stock').length} need attention
                </span>
              )}
            </div>
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Refill Modal */}
      {refillStock && (
        <RefillRawMaterialModal
          stock={refillStock}
          onClose={handleRefillClose}
          onSuccess={handleRefillClose}
        />
      )}
    </>
  );
}
