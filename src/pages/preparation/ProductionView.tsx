import { useState, useEffect } from 'react';
import { Play, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { useAuthStore } from '../../stores/authStore';
import { RecipeBatch, RecipeBatchIngredient } from '../../types/database.types';
import { formatQuantity } from '../../utils/unitConversion';
import toast from 'react-hot-toast';

interface BatchWithIngredients extends RecipeBatch {
  ingredients: (RecipeBatchIngredient & { raw_material_name: string; available_stock: number })[];
  product_name: string;
}

export function ProductionView() {
  const { currentStore } = useStoreStore();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [producing, setProducing] = useState(false);
  const [batches, setBatches] = useState<BatchWithIngredients[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchWithIngredients | null>(null);
  const [quantityToProduce, setQuantityToProduce] = useState('');

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      // Load standalone batches (no product_template_id)
      const { data: batchesData, error: batchesError } = await supabase
        .from('recipe_batches')
        .select('*')
        .eq('store_id', currentStore.id)
        .is('product_template_id', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;

      const allBatches: BatchWithIngredients[] = [];

      for (const batch of batchesData || []) {
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('recipe_batch_ingredients')
          .select(`
            *,
            raw_materials (
              name
            )
          `)
          .eq('recipe_batch_id', batch.id)
          .eq('store_id', currentStore.id);

        if (ingredientsError) throw ingredientsError;

        // Get stock for each ingredient
        const ingredientsWithStock = await Promise.all(
          (ingredients || []).map(async (ing: any) => {
            const { data: stock } = await supabase
              .from('raw_material_stock')
              .select('quantity')
              .eq('raw_material_id', ing.raw_material_id)
              .eq('store_id', currentStore.id)
              .eq('is_active', true)
              .single();

            return {
              ...ing,
              raw_material_name: ing.raw_materials.name,
              available_stock: stock?.quantity || 0,
            };
          })
        );

        allBatches.push({
          ...batch,
          product_name: batch.batch_name, // Use batch name as product name
          ingredients: ingredientsWithStock,
        });
      }

      setBatches(allBatches);
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const calculateRequirements = () => {
    if (!selectedBatch || !quantityToProduce) return [];

    const qty = parseFloat(quantityToProduce);
    if (isNaN(qty) || qty <= 0) return [];

    const batchRatio = qty / selectedBatch.producible_quantity;

    return selectedBatch.ingredients.map(ing => {
      const needed = ing.quantity_needed * batchRatio;
      const available = ing.available_stock;
      const sufficient = available >= needed;

      return {
        ...ing,
        needed,
        sufficient,
      };
    });
  };

  const requirements = calculateRequirements();
  const canProduce = requirements.length > 0 && requirements.every(r => r.sufficient);

  const handleProduce = async () => {
    if (!selectedBatch || !currentStore || !user) return;
    
    // Use batch's producible_quantity if no custom quantity entered
    const finalQuantity = quantityToProduce || selectedBatch.producible_quantity.toString();
    
    if (!finalQuantity || parseFloat(finalQuantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!canProduce) {
      toast.error('Insufficient raw materials to produce');
      return;
    }

    setProducing(true);
    try {
      const qty = parseFloat(finalQuantity);
      const batchRatio = qty / selectedBatch.producible_quantity;

      // Create production log (standalone batch - no product_id needed)
      const { data: productionLog, error: logError } = await supabase
        .from('production_logs')
        .insert([{
          product_name: selectedBatch.batch_name,
          recipe_batch_id: selectedBatch.id,
          batch_name: selectedBatch.batch_name,
          quantity_produced: qty,
          unit: 'L',
          produced_at: new Date().toISOString(),
          production_date: new Date().toISOString().split('T')[0],
          produced_by: user.id,
          store_id: currentStore.id,
        }])
        .select()
        .single();

      if (logError) {
        console.error('Production log error:', logError);
        throw logError;
      }

      // Add tea to general stock pool
      const { error: stockError } = await supabase.rpc('add_tea_to_stock', {
        p_store_id: currentStore.id,
        p_liters: qty,
      });

      if (stockError) {
        console.error('Error adding tea to stock:', stockError);
        throw stockError;
      }

      // Deduct raw materials and log usage
      for (const ing of selectedBatch.ingredients) {
        const needed = ing.quantity_needed * batchRatio;

        // Deduct from stock
        const { error: deductError } = await supabase.rpc('deduct_raw_material_stock', {
          p_raw_material_id: ing.raw_material_id,
          p_store_id: currentStore.id,
          p_quantity: needed,
        });

        if (deductError) throw deductError;

        // Log usage
        await supabase
          .from('raw_material_usage_logs')
          .insert([{
            raw_material_id: ing.raw_material_id,
            store_id: currentStore.id,
            quantity_used: needed,
            unit: ing.unit,
            usage_type: 'production',
            reference_type: 'production_log',
            reference_id: productionLog.id,
            used_at: new Date().toISOString(),
            notes: `Used for producing ${qty}L of ${selectedBatch.product_name} (${selectedBatch.batch_name})`,
          }]);

        // Log production ingredient
        await supabase
          .from('production_log_ingredients')
          .insert([{
            production_log_id: productionLog.id,
            raw_material_id: ing.raw_material_id,
            raw_material_name: ing.raw_material_name,
            quantity_used: needed,
            unit: ing.unit,
            store_id: currentStore.id,
          }]);
      }

      const formatted = formatQuantity(qty, 'L');
      toast.success(
        `Successfully produced ${formatted.displayText} of ${selectedBatch.product_name}!`,
        { duration: 5000 }
      );

      // Reset form
      setSelectedBatch(null);
      setQuantityToProduce('');
      loadBatches();
    } catch (error: any) {
      console.error('Error producing tea:', error);
      toast.error(error.message || 'Failed to produce tea');
    } finally {
      setProducing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {batches.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Batches Available</h3>
          <p className="text-secondary-600">
            Create batches first in the "Manage Batches" tab
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-semibold text-secondary-700 mb-3">
              Select Batch to Produce
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch) => (
                <button
                  key={batch.id}
                  onClick={() => {
                    setSelectedBatch(batch);
                    // Auto-fill with batch's producible quantity
                    setQuantityToProduce(batch.producible_quantity.toString());
                  }}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedBatch?.id === batch.id
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-secondary-900">{batch.product_name}</h4>
                      <p className="text-sm text-secondary-600">{batch.batch_name}</p>
                    </div>
                    {batch.is_default && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-500">
                    Makes {batch.producible_quantity}L • {batch.ingredients.length} ingredients
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Production Form */}
          {selectedBatch && (
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-secondary-900 mb-4">
                Produce {selectedBatch.product_name}
              </h3>

              {/* Quantity Display - Fixed from batch */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-secondary-700 mb-2">
                  Quantity to Produce (in Liters)
                </label>
                <div className="w-full px-4 py-3 text-lg border-2 border-green-300 rounded-lg bg-gray-100 text-secondary-700 font-semibold cursor-not-allowed">
                  {quantityToProduce}
                </div>
                {quantityToProduce && parseFloat(quantityToProduce) > 0 && (
                  <p className="text-sm text-green-700 mt-2 font-medium">
                    ✓ Will produce: {formatQuantity(parseFloat(quantityToProduce), 'L').displayText}
                  </p>
                )}
              </div>

              {/* Requirements */}
              {requirements.length > 0 && (
                <div className="bg-white rounded-lg p-4 border border-green-200 mb-6">
                  <h4 className="text-sm font-semibold text-secondary-900 mb-3">
                    Required Ingredients:
                  </h4>
                  <div className="space-y-2">
                    {requirements.map((req) => (
                      <div
                        key={req.id}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          req.sufficient ? 'bg-green-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {req.sufficient ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium text-secondary-900">
                              {req.raw_material_name}
                            </p>
                            <p className="text-sm text-secondary-600">
                              Need: {req.needed.toFixed(2)} {req.unit} • 
                              Available: {req.available_stock.toFixed(2)} {req.unit}
                            </p>
                          </div>
                        </div>
                        {!req.sufficient && (
                          <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                            Short by {(req.needed - req.available_stock).toFixed(2)} {req.unit}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Produce Button */}
              <button
                onClick={handleProduce}
                disabled={!canProduce || producing}
                className={`w-full py-4 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                  canProduce && !producing
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Play className="w-6 h-6" />
                {producing ? 'Producing...' : 'Produce Tea'}
              </button>

              {!canProduce && requirements.length > 0 && (
                <p className="text-sm text-red-600 text-center mt-3 font-medium">
                  ⚠️ Insufficient raw materials. Please refill stock first.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
