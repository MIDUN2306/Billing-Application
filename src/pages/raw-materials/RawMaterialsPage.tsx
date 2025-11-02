import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, RefreshCw, History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { RawMaterialStockForm } from './RawMaterialStockForm';
import { RefillRawMaterialModal } from './RefillRawMaterialModal';
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

interface PurchaseLog {
  id: string;
  raw_material_name: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  total_cost: number;
  purchase_date: string;
  notes: string | null;
}

type TabType = 'stock' | 'logs';

export function RawMaterialsPage() {
  const { currentStore } = useStoreStore();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [stocks, setStocks] = useState<RawMaterialStock[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingStock, setEditingStock] = useState<RawMaterialStock | null>(null);
  const [refillStock, setRefillStock] = useState<RawMaterialStock | null>(null);

  useEffect(() => {
    if (currentStore) {
      if (activeTab === 'stock') {
        loadStocks();
      } else {
        loadPurchaseLogs();
      }
    }
  }, [currentStore, activeTab]);

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
      console.error('Error loading raw materials:', error);
      toast.error('Failed to load raw materials');
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseLogs = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('raw_material_purchases')
        .select(`
          id,
          quantity,
          unit,
          purchase_price,
          total_cost,
          purchase_date,
          notes,
          raw_materials (
            name
          )
        `)
        .eq('store_id', currentStore.id)
        .order('purchase_date', { ascending: false });

      if (error) throw error;

      const logs: PurchaseLog[] = (data || []).map((item: any) => ({
        id: item.id,
        raw_material_name: item.raw_materials.name,
        quantity: item.quantity,
        unit: item.unit,
        purchase_price: item.purchase_price,
        total_cost: item.total_cost,
        purchase_date: item.purchase_date,
        notes: item.notes,
      }));

      setPurchaseLogs(logs);
    } catch (error: any) {
      console.error('Error loading purchase logs:', error);
      toast.error('Failed to load purchase logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this stock entry?')) return;

    try {
      const { error } = await supabase
        .from('raw_material_stock')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Stock entry deleted successfully');
      loadStocks();
    } catch (error: any) {
      console.error('Error deleting stock:', error);
      toast.error('Failed to delete stock entry');
    }
  };

  const handleEdit = (stock: RawMaterialStock) => {
    setEditingStock(stock);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingStock(null);
    loadStocks();
  };

  const handleRefillClose = () => {
    setRefillStock(null);
    loadStocks();
  };

  const filteredStocks = stocks.filter(stock =>
    stock.raw_material_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'in_stock': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusLabel = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary-900">Raw Materials</h1>
          <p className="text-secondary-600 mt-1">Manage your raw materials inventory</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Material
        </button>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'stock'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <Package className="w-5 h-5" />
            Stock View
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-secondary-600 hover:text-secondary-900'
            }`}
          >
            <History className="w-5 h-5" />
            Purchase Logs
          </button>
        </div>
      </div>

      {/* Search - Only for stock view */}
      {activeTab === 'stock' && (
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search raw materials by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'stock' ? (
        /* Stock Cards Grid */
        filteredStocks.length === 0 ? (
          <div className="card py-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <Package className="w-10 h-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No raw materials found</h3>
              <p className="text-secondary-500 text-sm">Add your first raw material to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredStocks.map((stock) => (
              <div
                key={stock.id}
                className="bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 relative overflow-hidden group"
              >
                {/* Status Badge */}
                <div className="absolute top-5 right-5 z-10">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${getStockStatusColor(stock.stock_status)}`}>
                    {getStockStatusLabel(stock.stock_status)}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Material Name */}
                  <div className="mb-6 pr-24">
                    <h3 className="text-xl font-bold text-secondary-900 truncate leading-tight">
                      {stock.raw_material_name}
                    </h3>
                  </div>

                  {/* Quantity Section */}
                  <div className="mb-5">
                    <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-2">
                      Quantity
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-primary-800">
                        {stock.quantity}
                      </p>
                      <span className="text-lg font-medium text-secondary-600">{stock.unit}</span>
                    </div>
                  </div>

                  {/* Purchase Price Section */}
                  <div className="mb-6">
                    <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-2">
                      Purchase Price
                    </p>
                    <p className="text-xl font-bold text-secondary-900">
                      ₹{stock.purchase_price.toFixed(2)}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-5 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(stock)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => setRefillStock(stock)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refill
                    </button>
                    <button
                      onClick={() => handleDelete(stock.id)}
                      className="flex items-center justify-center px-3 py-2.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Decorative gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/0 to-primary-100/0 group-hover:from-primary-50/30 group-hover:to-primary-100/10 transition-all duration-300 pointer-events-none rounded-xl"></div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Purchase Logs Table */
        <div className="card overflow-hidden">
          {purchaseLogs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                <History className="w-10 h-10 text-secondary-400" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No purchase logs yet</h3>
              <p className="text-secondary-500 text-sm">Purchase logs will appear here when you add or refill stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Material
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Price/Unit
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchaseLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-900">
                        {new Date(log.purchase_date).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">
                        {log.raw_material_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-900">
                        {log.quantity} {log.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-secondary-900">
                        ₹{log.purchase_price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-primary-900">
                        ₹{log.total_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-600">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Form Modal */}
      {showForm && (
        <RawMaterialStockForm
          stock={editingStock}
          onClose={handleFormClose}
        />
      )}

      {/* Refill Modal */}
      {refillStock && (
        <RefillRawMaterialModal
          stock={refillStock}
          onClose={handleRefillClose}
          onSuccess={handleRefillClose}
        />
      )}
    </div>
  );
}
