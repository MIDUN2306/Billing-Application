import { useEffect, useState } from 'react';
import { X, TrendingDown, Milk, Wallet } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface CostBreakdown {
  category: string;
  amount: number;
  icon: any;
  color: string;
  bgColor: string;
  items: CostItem[];
}

interface CostItem {
  description: string;
  amount: number;
  time: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  filterLabel: string;
}

export function TotalCostsDetailsModal({ isOpen, onClose, startDate, endDate, filterLabel }: Props) {
  const { currentStore } = useStoreStore();
  const [breakdown, setBreakdown] = useState<CostBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    if (isOpen && currentStore) {
      loadCostBreakdown();
    }
  }, [isOpen, currentStore]);

  const loadCostBreakdown = async () => {
    if (!currentStore) return;

    try {
      setLoading(true);

      // Load cost data in parallel (limited to 50 per category for performance)
      const [rawMaterialsRes, pettyCashRes] = await Promise.all([
        supabase
          .from('raw_material_purchases')
          .select(`
            total_cost,
            purchase_date,
            raw_materials (name)
          `)
          .eq('store_id', currentStore.id)
          .gte('purchase_date', startDate)
          .lte('purchase_date', endDate + 'T23:59:59')
          .order('purchase_date', { ascending: false })
          .limit(50),
        
        supabase
          .from('petty_cash')
          .select('amount, recipient_name, purpose, given_date')
          .eq('store_id', currentStore.id)
          .gte('given_date', startDate)
          .lte('given_date', endDate)
          .order('created_at', { ascending: false })
          .limit(50)
      ]);

      if (rawMaterialsRes.error) throw rawMaterialsRes.error;
      if (pettyCashRes.error) throw pettyCashRes.error;

      // Format raw materials
      const rawMaterialsItems: CostItem[] = (rawMaterialsRes.data || []).map((item: any) => ({
        description: item.raw_materials?.name || 'Unknown',
        amount: item.total_cost,
        time: new Date(item.purchase_date).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      const rawMaterialsTotal = rawMaterialsItems.reduce((sum, item) => sum + item.amount, 0);

      // Format petty cash
      const pettyCashItems: CostItem[] = (pettyCashRes.data || []).map((item: any) => ({
        description: `${item.recipient_name} - ${item.purpose}`,
        amount: item.amount,
        time: new Date(item.given_date).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      const pettyCashTotal = pettyCashItems.reduce((sum, item) => sum + item.amount, 0);

      const costBreakdown: CostBreakdown[] = [
        {
          category: 'Raw Materials',
          amount: rawMaterialsTotal,
          icon: Milk,
          color: 'text-orange-700',
          bgColor: 'bg-orange-50',
          items: rawMaterialsItems
        },
        {
          category: 'Petty Cash',
          amount: pettyCashTotal,
          icon: Wallet,
          color: 'text-purple-700',
          bgColor: 'bg-purple-50',
          items: pettyCashItems
        }
      ];

      setBreakdown(costBreakdown);
      setTotalCost(rawMaterialsTotal + pettyCashTotal);
    } catch (error: any) {
      console.error('Error loading cost breakdown:', error);
      toast.error('Failed to load cost breakdown');
    } finally {
      setLoading(false);
    }
  };

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
              <h2 className="text-xl font-bold text-red-900">Total Costs Breakdown</h2>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {breakdown.map((category, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${category.bgColor}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <category.icon className={`w-5 h-5 ${category.color}`} />
                      <span className={`text-sm font-medium ${category.color}`}>
                        {category.category}
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${category.color}`}>
                      ₹{category.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {category.items.length} transaction{category.items.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detailed Breakdown */}
              {breakdown.map((category, categoryIndex) => (
                category.items.length > 0 && (
                  <div key={categoryIndex} className="border rounded-lg overflow-hidden">
                    <div className={`px-6 py-3 ${category.bgColor} border-b`}>
                      <div className="flex items-center gap-2">
                        <category.icon className={`w-5 h-5 ${category.color}`} />
                        <h3 className={`font-semibold ${category.color}`}>
                          {category.category}
                        </h3>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Description
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {category.items.map((item, itemIndex) => (
                            <tr key={itemIndex} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{item.description}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <div className={`text-sm font-semibold ${category.color}`}>
                                  ₹{item.amount.toLocaleString()}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-600">{item.time}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              ))}

              {/* Grand Total */}
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-8 h-8 text-red-700" />
                    <div>
                      <p className="text-sm text-red-700 font-medium">Total Costs</p>
                      <p className="text-xs text-red-600">All expenses combined</p>
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-red-700">
                    ₹{totalCost.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
