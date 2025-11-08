import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Package, History, RotateCw, Eye, ChevronUp, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

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

interface GroupedPurchaseLog {
  raw_material_name: string;
  unit: string;
  total_quantity: number;
  total_cost: number;
  purchase_count: number;
  latest_date: string;
  purchases: PurchaseLog[];
}

type TabType = 'stock' | 'logs';

export function RawMaterialsInventoryPage() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [stocks, setStocks] = useState<RawMaterialStock[]>([]);
  const [purchaseLogs, setPurchaseLogs] = useState<PurchaseLog[]>([]);
  const [groupedLogs, setGroupedLogs] = useState<GroupedPurchaseLog[]>([]);
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  const loadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadStocks = useCallback(async (isRefresh = false) => {
    if (!currentStore?.id) {
      setLoading(false);
      return;
    }
    
    if (loadingRef.current && !isRefresh) {
      return;
    }
    
    loadingRef.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('v_raw_material_stock_status')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('raw_material_name');

      if (error) throw error;
      
      if (isMountedRef.current) {
        setStocks(data || []);
      }
      
      if (isRefresh) {
        toast.success('Stock refreshed');
      }
    } catch (error: any) {
      console.error('Error loading raw materials:', error);
      toast.error('Failed to load raw materials');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [currentStore?.id]);

  const loadPurchaseLogs = useCallback(async (isRefresh = false) => {
    if (!currentStore?.id) {
      setLoading(false);
      return;
    }
    
    if (loadingRef.current && !isRefresh) {
      return;
    }
    
    loadingRef.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
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

      // Group purchases by raw material
      const grouped = logs.reduce((acc: { [key: string]: GroupedPurchaseLog }, log) => {
        const key = log.raw_material_name;
        
        if (!acc[key]) {
          acc[key] = {
            raw_material_name: log.raw_material_name,
            unit: log.unit,
            total_quantity: 0,
            total_cost: 0,
            purchase_count: 0,
            latest_date: log.purchase_date,
            purchases: [],
          };
        }
        
        acc[key].total_quantity += Number(log.quantity);
        acc[key].total_cost += Number(log.total_cost);
        acc[key].purchase_count += 1;
        acc[key].purchases.push(log);
        
        if (new Date(log.purchase_date) > new Date(acc[key].latest_date)) {
          acc[key].latest_date = log.purchase_date;
        }
        
        return acc;
      }, {});

      if (isMountedRef.current) {
        setPurchaseLogs(logs);
        setGroupedLogs(Object.values(grouped));
      }
      
      if (isRefresh) {
        toast.success('Logs refreshed');
      }
    } catch (error: any) {
      console.error('Error loading purchase logs:', error);
      toast.error('Failed to load purchase logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [currentStore?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    loadingRef.current = false;
    
    if (currentStore?.id) {
      if (activeTab === 'stock') {
        loadStocks();
      } else {
        loadPurchaseLogs();
      }
    } else {
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [currentStore?.id, activeTab, location.pathname, loadStocks, loadPurchaseLogs]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore?.id && isMountedRef.current) {
        loadingRef.current = false;
        if (activeTab === 'stock') {
          loadStocks();
        } else {
          loadPurchaseLogs();
        }
      }
    };

    const handleFocus = () => {
      if (currentStore?.id && isMountedRef.current) {
        loadingRef.current = false;
        if (activeTab === 'stock') {
          loadStocks();
        } else {
          loadPurchaseLogs();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore?.id, activeTab, loadStocks, loadPurchaseLogs]);

  const handleRefresh = () => {
    if (activeTab === 'stock') {
      loadStocks(true);
    } else {
      loadPurchaseLogs(true);
    }
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Inventory"
          >
            <ArrowLeft className="w-5 h-5 text-secondary-600" />
          </button>
          <div>
            <h1 className="text-2xl font-display font-bold text-secondary-900">Raw Materials Inventory</h1>
            <p className="text-secondary-600 mt-1">View stock levels and purchase history</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center justify-center gap-2"
          title="Refresh data"
        >
          <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
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
            Current Stock
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
            Purchase History
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
              <p className="text-secondary-500 text-sm">
                {searchQuery ? 'Try a different search term' : 'Add raw materials from the Raw Materials page'}
              </p>
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
                      <span className="text-sm font-medium text-secondary-600">/{stock.unit}</span>
                    </p>
                  </div>

                  {/* Total Value */}
                  <div className="pt-5 border-t border-gray-200">
                    <p className="text-xs font-bold text-secondary-500 uppercase tracking-wider mb-2">
                      Total Value
                    </p>
                    <p className="text-2xl font-bold text-primary-700">
                      ₹{(stock.quantity * stock.purchase_price).toFixed(2)}
                    </p>
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
                      Material
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Purchases
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {groupedLogs.map((group) => (
                    <>
                      <tr key={group.raw_material_name} className="hover:bg-gray-50 border-b border-gray-200">
                        <td className="px-6 py-4 text-sm font-semibold text-secondary-900">
                          {group.raw_material_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-secondary-900">
                          <span className="font-medium">{group.total_quantity.toFixed(2)}</span> {group.unit}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-primary-900">
                          ₹{group.total_cost.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {group.purchase_count} purchase{group.purchase_count > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setExpandedMaterial(
                              expandedMaterial === group.raw_material_name ? null : group.raw_material_name
                            )}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            {expandedMaterial === group.raw_material_name ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                View Details
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedMaterial === group.raw_material_name && (
                        <tr>
                          <td colSpan={5} className="px-0 py-0">
                            <div className="bg-gray-50 border-t border-b border-gray-200">
                              <table className="w-full">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-6 py-2 text-left text-xs font-medium text-secondary-600 uppercase">
                                      Date
                                    </th>
                                    <th className="px-6 py-2 text-right text-xs font-medium text-secondary-600 uppercase">
                                      Quantity
                                    </th>
                                    <th className="px-6 py-2 text-right text-xs font-medium text-secondary-600 uppercase">
                                      Price/Unit
                                    </th>
                                    <th className="px-6 py-2 text-right text-xs font-medium text-secondary-600 uppercase">
                                      Total Cost
                                    </th>
                                    <th className="px-6 py-2 text-left text-xs font-medium text-secondary-600 uppercase">
                                      Notes
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                  {group.purchases.map((purchase) => (
                                    <tr key={purchase.id} className="hover:bg-gray-50">
                                      <td className="px-6 py-3 text-sm text-secondary-700">
                                        {new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-right text-secondary-700">
                                        {purchase.quantity} {purchase.unit}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-right text-secondary-700">
                                        ₹{purchase.purchase_price.toFixed(2)}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-right font-medium text-secondary-900">
                                        ₹{purchase.total_cost.toFixed(2)}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-secondary-600">
                                        {purchase.notes || '-'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
