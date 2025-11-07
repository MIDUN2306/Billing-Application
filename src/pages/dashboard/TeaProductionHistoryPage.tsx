import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coffee, Package, Clock, User, ChevronDown, ChevronUp, RotateCw, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductionLogWithDetails } from '../../types/database.types';
import toast from 'react-hot-toast';

interface ProductionSummary {
  product_name: string;
  product_template_id: string;
  total_quantity: number;
  batch_count: number;
  batches: ProductionLogWithDetails[];
}

interface TeaTypeGroup {
  type: string;
  displayName: string;
  color: string;
  icon: string;
  products: ProductionSummary[];
  totalQuantity: number;
  totalBatches: number;
}

// Tea type classification
const classifyTeaType = (productName: string): { type: string; displayName: string; color: string; icon: string } => {
  const name = productName.toLowerCase();
  
  // Parcel teas
  if (name.includes('parcel')) {
    return { type: 'parcel', displayName: 'Parcel Tea', color: 'amber', icon: '📦' };
  }
  
  // Super Buster
  if (name.includes('super buster')) {
    return { type: 'super_buster', displayName: 'Super Buster Tea', color: 'red', icon: '🔥' };
  }
  
  // Buster
  if (name.includes('buster')) {
    return { type: 'buster', displayName: 'Buster Tea', color: 'orange', icon: '⚡' };
  }
  
  // Ginger
  if (name.includes('ginger')) {
    return { type: 'ginger', displayName: 'Ginger Tea', color: 'yellow', icon: '🫚' };
  }
  
  // Special variants
  if (name.includes('without sugar')) {
    return { type: 'no_sugar', displayName: 'Tea (No Sugar)', color: 'teal', icon: '🍃' };
  }
  
  // Regular/Plain tea
  return { type: 'regular', displayName: 'Regular Tea', color: 'green', icon: '☕' };
};

export function TeaProductionHistoryPage() {
  const navigate = useNavigate();
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [productionLogs, setProductionLogs] = useState<ProductionLogWithDetails[]>([]);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  const loadProductionHistory = useCallback(async (isRefresh = false) => {
    if (!currentStore) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch production logs for tea products on selected date
      const { data: logs, error: logsError } = await supabase
        .from('production_logs')
        .select(`
          id,
          product_id,
          product_template_id,
          product_name,
          recipe_batch_id,
          batch_name,
          quantity_produced,
          unit,
          produced_at,
          production_date,
          produced_by,
          store_id,
          notes,
          profiles:produced_by (
            full_name
          )
        `)
        .eq('store_id', currentStore.id)
        .eq('production_date', selectedDate)
        .ilike('product_name', '%tea%')
        .order('produced_at', { ascending: false });

      if (logsError) throw logsError;

      // Fetch ingredients for each log
      const logsWithDetails: ProductionLogWithDetails[] = await Promise.all(
        (logs || []).map(async (log: any) => {
          const { data: ingredients, error: ingredientsError } = await supabase
            .from('production_log_ingredients')
            .select('*')
            .eq('production_log_id', log.id);

          if (ingredientsError) {
            console.error('Error loading ingredients:', ingredientsError);
          }

          return {
            ...log,
            produced_by_name: log.profiles?.full_name || null,
            ingredients: ingredients || [],
            ingredient_count: ingredients?.length || 0,
            has_ingredients: (ingredients?.length || 0) > 0,
            template_yield: null,
          };
        })
      );

      setProductionLogs(logsWithDetails);

      if (isRefresh) {
        toast.success('Production history refreshed');
      }
    } catch (error: any) {
      console.error('Error loading production history:', error);
      toast.error('Failed to load production history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStore, selectedDate]);

  useEffect(() => {
    if (currentStore) {
      loadProductionHistory();
    }
  }, [currentStore, selectedDate, loadProductionHistory]);

  const handleRefresh = () => {
    loadProductionHistory(true);
  };

  const toggleProductExpansion = (productName: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productName)) {
      newExpanded.delete(productName);
    } else {
      newExpanded.add(productName);
    }
    setExpandedProducts(newExpanded);
  };

  // Group logs by product name
  const productionSummaries: ProductionSummary[] = productionLogs.reduce((acc, log) => {
    const existing = acc.find(s => s.product_name === log.product_name);
    if (existing) {
      existing.total_quantity += log.quantity_produced;
      existing.batch_count += 1;
      existing.batches.push(log);
    } else {
      acc.push({
        product_name: log.product_name,
        product_template_id: log.product_template_id,
        total_quantity: log.quantity_produced,
        batch_count: 1,
        batches: [log],
      });
    }
    return acc;
  }, [] as ProductionSummary[]);

  // Group by tea type
  const teaTypeGroups: TeaTypeGroup[] = productionSummaries.reduce((acc, summary) => {
    const classification = classifyTeaType(summary.product_name);
    
    let group = acc.find(g => g.type === classification.type);
    if (!group) {
      group = {
        type: classification.type,
        displayName: classification.displayName,
        color: classification.color,
        icon: classification.icon,
        products: [],
        totalQuantity: 0,
        totalBatches: 0,
      };
      acc.push(group);
    }
    
    group.products.push(summary);
    group.totalQuantity += summary.total_quantity;
    group.totalBatches += summary.batch_count;
    
    return acc;
  }, [] as TeaTypeGroup[]);

  // Sort groups by total quantity (most produced first)
  teaTypeGroups.sort((a, b) => b.totalQuantity - a.totalQuantity);

  // Calculate summary statistics
  const totalBatches = productionLogs.length;
  const totalUnitsProduced = productionLogs.reduce((sum, log) => sum + log.quantity_produced, 0);
  const mostProducedType = teaTypeGroups.length > 0
    ? teaTypeGroups.reduce((max, curr) => curr.totalQuantity > max.totalQuantity ? curr : max)
    : null;
  const totalTeaTypes = teaTypeGroups.length;
  
  // Calculate total raw materials used
  const totalRawMaterialsUsed = productionLogs.reduce((sum, log) => {
    const milkIngredient = log.ingredients.find(ing => ing.raw_material_name.toLowerCase().includes('milk'));
    return sum + (milkIngredient?.quantity_used || 0);
  }, 0);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors w-fit"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-secondary-900 flex items-center gap-2">
              <Coffee className="w-7 h-7 text-primary-700" />
              Tea Production History
            </h1>
            <p className="text-sm text-secondary-600 mt-1">
              {formatDate(selectedDate)}
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn-secondary flex items-center justify-center gap-2"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{totalBatches}</p>
              <p className="text-xs text-blue-700 font-medium">Batches Prepared</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Coffee className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{totalUnitsProduced}</p>
              <p className="text-xs text-green-700 font-medium">Units Produced</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-2xl">
              {mostProducedType?.icon || '☕'}
            </div>
            <div>
              <p className="text-sm font-bold text-purple-900 truncate">
                {mostProducedType?.displayName || '-'}
              </p>
              <p className="text-xs text-purple-700 font-medium">Most Produced Type</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-900">{totalRawMaterialsUsed.toFixed(1)}</p>
              <p className="text-xs text-orange-700 font-medium">Liters Milk Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Production Logs */}
      {teaTypeGroups.length === 0 ? (
        <div className="card py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Coffee className="w-10 h-10 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No tea batches found</h3>
            <p className="text-secondary-500 text-sm">
              No tea batches were prepared on {formatDate(selectedDate)}
            </p>
            <p className="text-secondary-400 text-xs mt-2">
              Try selecting a different date or prepare some tea batches
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tea Type Overview */}
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 mb-4">
              Tea Types Overview ({totalTeaTypes} type{totalTeaTypes !== 1 ? 's' : ''})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {teaTypeGroups.map((group) => {
                const colorClasses = {
                  green: 'from-green-50 to-green-100 border-green-200 text-green-900',
                  yellow: 'from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-900',
                  orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-900',
                  red: 'from-red-50 to-red-100 border-red-200 text-red-900',
                  amber: 'from-amber-50 to-amber-100 border-amber-200 text-amber-900',
                  teal: 'from-teal-50 to-teal-100 border-teal-200 text-teal-900',
                };
                
                return (
                  <div
                    key={group.type}
                    className={`card bg-gradient-to-br border-2 ${colorClasses[group.color as keyof typeof colorClasses] || colorClasses.green}`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-2">{group.icon}</div>
                      <p className="font-bold text-lg">{group.displayName}</p>
                      <div className="mt-2 pt-2 border-t border-current/20">
                        <p className="text-2xl font-bold">{group.totalQuantity}</p>
                        <p className="text-xs opacity-75">units • {group.totalBatches} batches</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Tea Type Groups */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-secondary-900">
              Detailed Production by Tea Type
            </h2>

            {teaTypeGroups.map((group) => {
              const colorClasses = {
                green: { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-900', badge: 'bg-green-600' },
                yellow: { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', badge: 'bg-yellow-600' },
                orange: { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-900', badge: 'bg-orange-600' },
                red: { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-900', badge: 'bg-red-600' },
                amber: { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', badge: 'bg-amber-600' },
                teal: { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', badge: 'bg-teal-600' },
              };
              const colors = colorClasses[group.color as keyof typeof colorClasses] || colorClasses.green;

              return (
                <div key={group.type} className="space-y-3">
                  {/* Tea Type Header */}
                  <div className={`card border-2 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-4xl">{group.icon}</div>
                        <div>
                          <h3 className={`text-xl font-bold ${colors.text}`}>
                            {group.displayName}
                          </h3>
                          <p className={`text-sm ${colors.text} opacity-75`}>
                            {group.products.length} variant{group.products.length !== 1 ? 's' : ''} • {group.totalQuantity} units • {group.totalBatches} batches
                          </p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 ${colors.badge} text-white rounded-lg text-center`}>
                        <p className="text-2xl font-bold">{group.totalQuantity}</p>
                        <p className="text-xs">Total Units</p>
                      </div>
                    </div>
                  </div>

                  {/* Products within this tea type */}
                  <div className="ml-4 space-y-3">
                    {group.products.map((summary) => {
                      const isExpanded = expandedProducts.has(summary.product_name);
                      
                      return (
                        <div key={summary.product_name} className="card border-2 border-gray-200 hover:border-primary-300 transition-colors">
                          {/* Product Summary Header */}
                          <button
                            onClick={() => toggleProductExpansion(summary.product_name)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <Coffee className="w-6 h-6 text-primary-700" />
                              </div>
                              <div className="text-left">
                                <h3 className="text-lg font-semibold text-secondary-900">
                                  {summary.product_name}
                                </h3>
                                <p className="text-sm text-secondary-600">
                                  {summary.batch_count} batch{summary.batch_count !== 1 ? 'es' : ''} • {summary.total_quantity} units produced
                                </p>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-secondary-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-secondary-400" />
                            )}
                          </button>

                          {/* Batch Details */}
                          {isExpanded && (
                            <div className="px-4 pb-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                              {summary.batches.map((batch) => (
                                <div
                                  key={batch.id}
                                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4"
                                >
                                  {/* Batch Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-4 h-4 text-secondary-500" />
                                        <span className="text-sm font-semibold text-secondary-900">
                                          {formatTime(batch.produced_at)}
                                        </span>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                          {batch.batch_name}
                                        </span>
                                      </div>
                                      {batch.produced_by_name && (
                                        <div className="flex items-center gap-2 text-xs text-secondary-600">
                                          <User className="w-3 h-3" />
                                          <span>Produced by: {batch.produced_by_name}</span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-2xl font-bold text-primary-700">
                                        {batch.quantity_produced}
                                      </p>
                                      <p className="text-xs text-secondary-600">{batch.unit}</p>
                                    </div>
                                  </div>

                                  {/* Ingredients */}
                                  {batch.ingredients.length > 0 && (
                                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                                      <p className="text-xs font-semibold text-secondary-700 mb-2 flex items-center gap-1">
                                        <Package className="w-3 h-3" />
                                        Ingredients Used:
                                      </p>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {batch.ingredients.map((ingredient) => (
                                          <div
                                            key={ingredient.id}
                                            className="flex items-center justify-between text-xs bg-gray-50 rounded px-2 py-1.5"
                                          >
                                            <span className="text-secondary-700 font-medium">
                                              {ingredient.raw_material_name}
                                            </span>
                                            <span className="text-secondary-900 font-semibold">
                                              {ingredient.quantity_used} {ingredient.unit}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {batch.notes && (
                                    <div className="mt-2 text-xs text-secondary-600 italic">
                                      Note: {batch.notes}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
