import { useEffect, useState } from 'react';
import { X, TrendingDown, Milk, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface RawMaterialPurchase {
  id: string;
  raw_material_name: string;
  quantity: number;
  unit: string;
  purchase_price: number;
  total_cost: number;
  purchase_date: string;
}

interface PettyCashRecord {
  id: string;
  amount: number;
  recipient_name: string;
  purpose: string;
  given_date: string;
  notes: string | null;
}

interface CombinedExpense {
  id: string;
  type: 'raw_material' | 'petty_cash';
  description: string;
  amount: number;
  date: string;
  details: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  filterLabel: string;
}

type TabType = 'combined' | 'raw_materials' | 'petty_cash';

const PAGE_SIZE = 20;

export function ExpensesDetailsModal({ isOpen, onClose, startDate, endDate, filterLabel }: Props) {
  const { currentStore } = useStoreStore();
  const [activeTab, setActiveTab] = useState<TabType>('combined');
  
  // State for each tab
  const [combinedExpenses, setCombinedExpenses] = useState<CombinedExpense[]>([]);
  const [rawMaterialPurchases, setRawMaterialPurchases] = useState<RawMaterialPurchase[]>([]);
  const [pettyCashRecords, setPettyCashRecords] = useState<PettyCashRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Totals
  const [totalCombined, setTotalCombined] = useState(0);
  const [totalRawMaterials, setTotalRawMaterials] = useState(0);
  const [totalPettyCash, setTotalPettyCash] = useState(0);
  
  const [totalCountCombined, setTotalCountCombined] = useState(0);
  const [totalCountRawMaterials, setTotalCountRawMaterials] = useState(0);
  const [totalCountPettyCash, setTotalCountPettyCash] = useState(0);

  useEffect(() => {
    if (isOpen && currentStore) {
      setCurrentPage(1);
      loadTotals();
      loadData(1);
    }
  }, [isOpen, currentStore, activeTab]);

  const loadTotals = async () => {
    if (!currentStore) return;

    try {
      // Load raw materials total
      const { data: rmData, error: rmError } = await supabase
        .from('raw_material_purchases')
        .select('total_cost')
        .eq('store_id', currentStore.id)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate + 'T23:59:59');

      if (!rmError) {
        const rmTotal = (rmData || []).reduce((sum, item) => sum + item.total_cost, 0);
        setTotalRawMaterials(rmTotal);
        setTotalCountRawMaterials(rmData?.length || 0);
      }

      // Load petty cash total
      const { data: pcData, error: pcError } = await supabase
        .from('petty_cash')
        .select('amount')
        .eq('store_id', currentStore.id)
        .gte('given_date', startDate)
        .lte('given_date', endDate);

      if (!pcError) {
        const pcTotal = (pcData || []).reduce((sum, item) => sum + item.amount, 0);
        setTotalPettyCash(pcTotal);
        setTotalCountPettyCash(pcData?.length || 0);
      }

      // Combined total
      setTotalCombined((rmData?.reduce((sum, item) => sum + item.total_cost, 0) || 0) + 
                       (pcData?.reduce((sum, item) => sum + item.amount, 0) || 0));
      setTotalCountCombined((rmData?.length || 0) + (pcData?.length || 0));
    } catch (error: any) {
      console.error('Error loading totals:', error);
    }
  };

  const loadData = async (page: number) => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (activeTab === 'combined') {
        // Load both raw materials and petty cash
        const [rmRes, pcRes] = await Promise.all([
          supabase
            .from('raw_material_purchases')
            .select(`
              id,
              quantity,
              unit,
              purchase_price,
              total_cost,
              purchase_date,
              raw_materials (name)
            `)
            .eq('store_id', currentStore.id)
            .gte('purchase_date', startDate)
            .lte('purchase_date', endDate + 'T23:59:59')
            .order('purchase_date', { ascending: false }),
          
          supabase
            .from('petty_cash')
            .select('*')
            .eq('store_id', currentStore.id)
            .gte('given_date', startDate)
            .lte('given_date', endDate)
            .order('created_at', { ascending: false })
        ]);

        if (rmRes.error) throw rmRes.error;
        if (pcRes.error) throw pcRes.error;

        // Combine and format
        const combined: CombinedExpense[] = [
          ...(rmRes.data || []).map((item: any) => ({
            id: item.id,
            type: 'raw_material' as const,
            description: item.raw_materials?.name || 'Unknown',
            amount: item.total_cost,
            date: item.purchase_date,
            details: `${item.quantity} ${item.unit} @ ₹${item.purchase_price.toFixed(2)}`
          })),
          ...(pcRes.data || []).map((item: any) => ({
            id: item.id,
            type: 'petty_cash' as const,
            description: item.recipient_name,
            amount: item.amount,
            date: item.given_date,
            details: item.purpose
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Paginate combined results
        setCombinedExpenses(combined.slice(from, to + 1));
      } else if (activeTab === 'raw_materials') {
        const { data, error } = await supabase
          .from('raw_material_purchases')
          .select(`
            id,
            quantity,
            unit,
            purchase_price,
            total_cost,
            purchase_date,
            raw_materials (name)
          `)
          .eq('store_id', currentStore.id)
          .gte('purchase_date', startDate)
          .lte('purchase_date', endDate + 'T23:59:59')
          .order('purchase_date', { ascending: false })
          .range(from, to);

        if (error) throw error;

        const formatted: RawMaterialPurchase[] = (data || []).map((item: any) => ({
          id: item.id,
          raw_material_name: item.raw_materials?.name || 'Unknown',
          quantity: item.quantity,
          unit: item.unit,
          purchase_price: item.purchase_price,
          total_cost: item.total_cost,
          purchase_date: item.purchase_date
        }));

        setRawMaterialPurchases(formatted);
      } else if (activeTab === 'petty_cash') {
        const { data, error } = await supabase
          .from('petty_cash')
          .select('*')
          .eq('store_id', currentStore.id)
          .gte('given_date', startDate)
          .lte('given_date', endDate)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        setPettyCashRecords(data || []);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load expense records');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadData(newPage);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const getCurrentTotal = () => {
    switch (activeTab) {
      case 'combined': return totalCombined;
      case 'raw_materials': return totalRawMaterials;
      case 'petty_cash': return totalPettyCash;
    }
  };

  const getCurrentCount = () => {
    switch (activeTab) {
      case 'combined': return totalCountCombined;
      case 'raw_materials': return totalCountRawMaterials;
      case 'petty_cash': return totalCountPettyCash;
    }
  };

  const totalPages = Math.ceil(getCurrentCount() / PAGE_SIZE);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-900">Expense Details</h2>
              <p className="text-sm text-red-700">{filterLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            onClick={() => handleTabChange('combined')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'combined'
                ? 'bg-white text-red-700 border-b-2 border-red-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingDown className="w-4 h-4" />
              <span>Combined</span>
              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                ₹{totalCombined.toLocaleString()}
              </span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('raw_materials')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'raw_materials'
                ? 'bg-white text-orange-700 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Milk className="w-4 h-4" />
              <span>Raw Materials</span>
              <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                ₹{totalRawMaterials.toLocaleString()}
              </span>
            </div>
          </button>
          <button
            onClick={() => handleTabChange('petty_cash')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'petty_cash'
                ? 'bg-white text-purple-700 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Wallet className="w-4 h-4" />
              <span>Petty Cash</span>
              <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                ₹{totalPettyCash.toLocaleString()}
              </span>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              {/* Combined Tab */}
              {activeTab === 'combined' && (
                combinedExpenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {combinedExpenses.map((expense) => (
                          <tr key={`${expense.type}-${expense.id}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                expense.type === 'raw_material' 
                                  ? 'bg-orange-100 text-orange-700' 
                                  : 'bg-purple-100 text-purple-700'
                              }`}>
                                {expense.type === 'raw_material' ? <Milk className="w-3 h-3" /> : <Wallet className="w-3 h-3" />}
                                {expense.type === 'raw_material' ? 'Raw Material' : 'Petty Cash'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{expense.description}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">{expense.details}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-semibold text-red-700">₹{expense.amount.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {new Date(expense.date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(expense.date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No expenses for this period</p>
                  </div>
                )
              )}

              {/* Raw Materials Tab */}
              {activeTab === 'raw_materials' && (
                rawMaterialPurchases.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raw Material</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price/Unit</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Cost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {rawMaterialPurchases.map((purchase) => (
                          <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{purchase.raw_material_name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-900">{purchase.quantity} {purchase.unit}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-900">₹{purchase.purchase_price.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-semibold text-orange-700">₹{purchase.total_cost.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">
                                {new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(purchase.purchase_date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Milk className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No raw material purchases for this period</p>
                  </div>
                )
              )}

              {/* Petty Cash Tab */}
              {activeTab === 'petty_cash' && (
                pettyCashRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Given To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pettyCashRecords.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{record.recipient_name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{record.purpose}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-semibold text-purple-700">₹{record.amount.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-600">{record.notes || '-'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-600">
                                {new Date(record.given_date).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No petty cash records for this period</p>
                  </div>
                )
              )}
            </>
          )}
        </div>

        {/* Footer with Total and Pagination */}
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Total Summary */}
          <div className={`px-6 py-4 ${
            activeTab === 'combined' ? 'bg-red-50' : 
            activeTab === 'raw_materials' ? 'bg-orange-50' : 'bg-purple-50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Total {
                activeTab === 'combined' ? 'Expenses' : 
                activeTab === 'raw_materials' ? 'Raw Materials Cost' : 'Petty Cash'
              }:</span>
              <span className={`text-xl font-bold ${
                activeTab === 'combined' ? 'text-red-700' : 
                activeTab === 'raw_materials' ? 'text-orange-700' : 'text-purple-700'
              }`}>
                ₹{getCurrentTotal().toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {getCurrentCount()} total records
            </div>
          </div>

          {/* Pagination and Close */}
          <div className="flex items-center justify-between px-6 py-4">
            {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            ) : (
              <div></div>
            )}
            <button onClick={onClose} className="btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
