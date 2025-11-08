import { useState, useEffect } from 'react';
import { History, Calendar, Package, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductionLog, ProductionLogIngredient } from '../../types/database.types';
import { formatQuantity } from '../../utils/unitConversion';
import toast from 'react-hot-toast';

interface ProductionLogWithDetails extends ProductionLog {
  ingredients: ProductionLogIngredient[];
  produced_by_name: string | null;
}

interface BatchProductionSummary {
  batch_id: string;
  batch_name: string;
  product_name: string;
  production_count: number;
  total_liters_produced: number;
  last_produced_at: string;
  productions: ProductionLogWithDetails[];
}

export function ProductionHistoryView() {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(true);
  const [batchSummaries, setBatchSummaries] = useState<BatchProductionSummary[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchProductionSummary | null>(null);

  useEffect(() => {
    loadProductionHistory();
  }, []);

  const loadProductionHistory = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      // Load all production logs
      const { data: logsData, error: logsError } = await supabase
        .from('production_logs')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('store_id', currentStore.id)
        .order('produced_at', { ascending: false });

      if (logsError) throw logsError;

      // Load ingredients for each log
      const logsWithDetails: ProductionLogWithDetails[] = await Promise.all(
        (logsData || []).map(async (log: any) => {
          const { data: ingredients, error: ingredientsError } = await supabase
            .from('production_log_ingredients')
            .select('*')
            .eq('production_log_id', log.id)
            .eq('store_id', currentStore.id);

          if (ingredientsError) throw ingredientsError;

          return {
            ...log,
            ingredients: ingredients || [],
            produced_by_name: log.profiles?.full_name || null,
          };
        })
      );

      // Group by batch and calculate summaries
      const batchMap = new Map<string, BatchProductionSummary>();

      for (const log of logsWithDetails) {
        const batchId = log.recipe_batch_id || 'unknown';
        
        if (!batchMap.has(batchId)) {
          batchMap.set(batchId, {
            batch_id: batchId,
            batch_name: log.batch_name,
            product_name: log.product_name,
            production_count: 0,
            total_liters_produced: 0,
            last_produced_at: log.produced_at,
            productions: [],
          });
        }

        const summary = batchMap.get(batchId)!;
        summary.production_count++;
        summary.total_liters_produced += log.quantity_produced;
        summary.productions.push(log);
        
        // Update last produced date if this is more recent
        if (new Date(log.produced_at) > new Date(summary.last_produced_at)) {
          summary.last_produced_at = log.produced_at;
        }
      }

      // Convert map to array and sort by last produced date
      const summaries = Array.from(batchMap.values()).sort(
        (a, b) => new Date(b.last_produced_at).getTime() - new Date(a.last_produced_at).getTime()
      );

      setBatchSummaries(summaries);
    } catch (error) {
      console.error('Error loading production history:', error);
      toast.error('Failed to load production history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {batchSummaries.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <History className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Production History</h3>
          <p className="text-secondary-600">
            Start producing tea to see your production history here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Left - Batch Summaries */}
          <div className="col-span-5 space-y-3">
            <h3 className="text-sm font-semibold text-secondary-700 mb-3 px-2">
              Production by Batch ({batchSummaries.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {batchSummaries.map((batch) => {
                const formatted = formatQuantity(batch.total_liters_produced, 'L');
                return (
                  <button
                    key={batch.batch_id}
                    onClick={() => setSelectedBatch(batch)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedBatch?.batch_id === batch.batch_id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-secondary-900">{batch.product_name}</h4>
                        <p className="text-sm text-secondary-600">{batch.batch_name}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                        <p className="text-xs text-secondary-600">Total Produced</p>
                        <p className="text-lg font-bold text-green-600">{formatted.displayText}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                        <p className="text-xs text-secondary-600">Productions</p>
                        <p className="text-lg font-bold text-blue-600">{batch.production_count}x</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-secondary-500">
                      <Calendar className="w-3 h-3" />
                      Last: {formatDate(batch.last_produced_at)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right - Individual Productions */}
          <div className="col-span-7">
            {!selectedBatch ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-secondary-600">Select a batch to view production details</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Batch Summary Header */}
                <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                  <h3 className="text-2xl font-bold text-secondary-900 mb-2">
                    {selectedBatch.product_name}
                  </h3>
                  <p className="text-lg text-secondary-700 mb-4">{selectedBatch.batch_name}</p>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-secondary-600 mb-1">Total Produced</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatQuantity(selectedBatch.total_liters_produced, 'L').displayText}
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-secondary-600 mb-1">Productions</p>
                      <p className="text-xl font-bold text-blue-600">
                        {selectedBatch.production_count}x
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-xs text-secondary-600 mb-1">Last Produced</p>
                      <p className="text-xs font-semibold text-secondary-900">
                        {formatDate(selectedBatch.last_produced_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Individual Productions List */}
                <div className="card">
                  <h4 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    Production History ({selectedBatch.production_count})
                  </h4>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {selectedBatch.productions.map((log, index) => (
                      <div
                        key={log.id}
                        className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              #{selectedBatch.production_count - index}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-secondary-900">
                                {formatQuantity(log.quantity_produced, log.unit).displayText}
                              </p>
                              <p className="text-xs text-secondary-600 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(log.produced_at)}
                              </p>
                            </div>
                          </div>
                          {log.produced_by_name && (
                            <div className="text-right">
                              <p className="text-xs text-secondary-600">Produced by</p>
                              <p className="text-sm font-medium text-secondary-900">{log.produced_by_name}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Ingredients for this production */}
                        {log.ingredients.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-secondary-700 mb-2">Ingredients Used:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {log.ingredients.map((ing) => (
                                <div key={ing.id} className="text-xs text-secondary-600 flex items-center gap-1">
                                  <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                                  <span className="font-medium">{ing.raw_material_name}:</span>
                                  <span>{formatQuantity(ing.quantity_used, ing.unit).displayText}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
