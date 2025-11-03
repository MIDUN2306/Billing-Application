import { useEffect, useState } from 'react';
import { X, Milk, ChevronLeft, ChevronRight } from 'lucide-react';
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  filterLabel: string;
}

const PAGE_SIZE = 20;

export function RawMaterialsDetailsModal({ isOpen, onClose, startDate, endDate, filterLabel }: Props) {
  const { currentStore } = useStoreStore();
  const [purchases, setPurchases] = useState<RawMaterialPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen && currentStore) {
      setCurrentPage(1);
      loadPurchases(1);
      loadTotalCost();
    }
  }, [isOpen, currentStore]);

  const loadTotalCost = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('raw_material_purchases')
        .select('total_cost')
        .eq('store_id', currentStore.id)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate + 'T23:59:59');

      if (error) throw error;

      const total = (data || []).reduce((sum, item) => sum + item.total_cost, 0);
      setTotalCost(total);
      setTotalCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error loading total cost:', error);
    }
  };

  const loadPurchases = async (page: number) => {
    if (!currentStore) return;

    try {
      setLoading(true);
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      
      const { data, error } = await supabase
        .from('raw_material_purchases')
        .select(`
          id,
          quantity,
          unit,
          purchase_price,
          total_cost,
          purchase_date,
          raw_materials (
            name
          )
        `)
        .eq('store_id', currentStore.id)
        .gte('purchase_date', startDate)
        .lte('purchase_date', endDate + 'T23:59:59')
        .order('purchase_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      const formattedData: RawMaterialPurchase[] = (data || []).map((item: any) => ({
        id: item.id,
        raw_material_name: item.raw_materials?.name || 'Unknown',
        quantity: item.quantity,
        unit: item.unit,
        purchase_price: item.purchase_price,
        total_cost: item.total_cost,
        purchase_date: item.purchase_date
      }));

      setPurchases(formattedData);
    } catch (error: any) {
      console.error('Error loading raw material purchases:', error);
      toast.error('Failed to load raw material purchases');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadPurchases(newPage);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-200 rounded-lg flex items-center justify-center">
              <Milk className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-orange-900">Raw Materials Purchases</h2>
              <p className="text-sm text-orange-700">{filterLabel}</p>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : purchases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raw Material
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Price
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{purchase.raw_material_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">
                          {purchase.quantity} {purchase.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-gray-900">₹{purchase.purchase_price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-orange-700">
                          ₹{purchase.total_cost.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {new Date(purchase.purchase_date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-orange-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      Total:
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-orange-700">
                      ₹{totalCost.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Milk className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No raw material purchases for this period</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages} ({totalCount} records)
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
          {totalPages <= 1 && <div></div>}
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
