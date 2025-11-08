import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Coffee, Beaker } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { RecipeBatch, RecipeBatchIngredient } from '../../types/database.types';
import { formatQuantity, toBaseUnit } from '../../utils/unitConversion';
import toast from 'react-hot-toast';

interface RawMaterialWithStock {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface BatchWithIngredients extends RecipeBatch {
  ingredients: (RecipeBatchIngredient & { raw_material_name: string })[];
  calculated_volume_ml: number;
  total_produced_liters: number;
  production_count: number;
}

interface IngredientRow {
  raw_material_id: string;
  quantity_needed: string;
  unit: string;
}

export function SimplifiedBatchManagementView() {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<BatchWithIngredients[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [totalAvailableTea, setTotalAvailableTea] = useState(0); // in liters
  
  const [formData, setFormData] = useState({
    batch_name: '',
    producible_quantity: '',
    producible_unit: 'L' as 'L' | 'ml',
  });
  
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadBatches();
    loadRawMaterials();
    loadTotalAvailableTea();
    
    // Auto-refresh tea stock every 10 seconds
    const interval = setInterval(() => {
      loadTotalAvailableTea();
    }, 10000);
    
    return () => clearInterval(interval);
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

      // Load ingredients and production stats for each batch
      const batchesWithIngredients: BatchWithIngredients[] = await Promise.all(
        (batchesData || []).map(async (batch) => {
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

          const ingredientsWithNames = (ingredients || []).map((ing: any) => ({
            ...ing,
            raw_material_name: ing.raw_materials.name,
          }));

          // Calculate total volume in ML
          const volumeMl = calculateTotalVolumeMl(ingredientsWithNames);

          // Get production stats for this batch
          const { data: productionLogs, error: productionError } = await supabase
            .from('production_logs')
            .select('quantity_produced')
            .eq('recipe_batch_id', batch.id)
            .eq('store_id', currentStore.id);

          if (productionError) throw productionError;

          const totalProduced = (productionLogs || []).reduce(
            (sum, log) => sum + log.quantity_produced,
            0
          );
          const productionCount = (productionLogs || []).length;

          return {
            ...batch,
            ingredients: ingredientsWithNames,
            calculated_volume_ml: volumeMl,
            total_produced_liters: totalProduced,
            production_count: productionCount,
          };
        })
      );

      setBatches(batchesWithIngredients);
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const loadRawMaterials = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('raw_material_stock')
        .select(`
          id,
          raw_material_id,
          unit,
          quantity,
          raw_materials (
            id,
            name,
            product_type
          )
        `)
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      if (error) throw error;

      // Filter only "making" category raw materials
      const materials: RawMaterialWithStock[] = (data || [])
        .filter((item: any) => item.raw_materials.product_type === 'making')
        .map((item: any) => ({
          id: item.raw_materials.id,
          name: item.raw_materials.name,
          unit: item.unit,
          quantity: item.quantity,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

      setRawMaterials(materials);
    } catch (error) {
      console.error('Error loading raw materials:', error);
    }
  };

  const loadTotalAvailableTea = async () => {
    if (!currentStore) return;

    try {
      // Get total produced from all production logs (all batches combined)
      const { data: productionLogs, error: productionError } = await supabase
        .from('production_logs')
        .select('quantity_produced')
        .eq('store_id', currentStore.id);

      if (productionError) throw productionError;

      // Sum all produced quantities (in liters)
      const totalProduced = (productionLogs || []).reduce(
        (sum, log) => sum + log.quantity_produced,
        0
      );

      // Get total consumed from POS sales
      const { data: consumptionLogs, error: consumptionError } = await supabase
        .from('tea_consumption_log')
        .select('total_liters_consumed')
        .eq('store_id', currentStore.id);

      if (consumptionError) throw consumptionError;

      // Sum all consumed quantities (in liters)
      const totalConsumed = (consumptionLogs || []).reduce(
        (sum, log) => sum + log.total_liters_consumed,
        0
      );

      // Available = Produced - Consumed
      const available = totalProduced - totalConsumed;
      setTotalAvailableTea(Math.max(0, available)); // Ensure non-negative
    } catch (error) {
      console.error('Error loading total available tea:', error);
    }
  };

  const calculateTotalVolumeMl = (ingredients: any[]): number => {
    let totalMl = 0;

    for (const ing of ingredients) {
      const unit = ing.unit.toLowerCase();
      const quantity = ing.quantity_needed;

      // Only count liquid ingredients
      if (unit === 'l' || unit === 'ltr' || unit === 'litre' || unit === 'liter') {
        // Convert liters to ml
        totalMl += toBaseUnit(quantity, 'L', 'ml');
      } else if (unit === 'ml' || unit === 'milliliter' || unit === 'millilitre') {
        // Already in ml
        totalMl += quantity;
      }
    }

    return totalMl;
  };

  // Get display text for producible quantity
  const getProducibleDisplay = (): string => {
    if (!formData.producible_quantity) return '';
    
    const quantity = parseFloat(formData.producible_quantity);
    if (isNaN(quantity) || quantity <= 0) return '';

    if (formData.producible_unit === 'L') {
      const ml = quantity * 1000;
      return `${quantity.toFixed(2)} L (${ml.toFixed(0)} ml)`;
    } else {
      const liters = quantity / 1000;
      return `${quantity.toFixed(0)} ml (${liters.toFixed(2)} L)`;
    }
  };

  const handleAddBatch = () => {
    setShowBatchForm(true);
    setEditingBatchId(null);
    setFormData({ 
      batch_name: '',
      producible_quantity: '',
      producible_unit: 'L',
    });
    setIngredientRows([]);
  };

  const handleEditBatch = (batch: BatchWithIngredients) => {
    setShowBatchForm(true);
    setEditingBatchId(batch.id);
    
    // Convert stored L to display format
    const volumeL = batch.producible_quantity;
    setFormData({
      batch_name: batch.batch_name,
      producible_quantity: volumeL.toString(),
      producible_unit: 'L',
    });
    
    const ingredients: IngredientRow[] = batch.ingredients.map(ing => ({
      raw_material_id: ing.raw_material_id,
      quantity_needed: ing.quantity_needed.toString(),
      unit: ing.unit,
    }));
    setIngredientRows(ingredients);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('recipe_batches')
        .update({ is_active: false })
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Batch deleted successfully');
      loadBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast.error(error.message || 'Failed to delete batch');
    }
  };

  const addIngredientRow = () => {
    setIngredientRows([
      ...ingredientRows,
      { raw_material_id: '', quantity_needed: '', unit: '' },
    ]);
  };

  const removeIngredientRow = (index: number) => {
    setIngredientRows(ingredientRows.filter((_, i) => i !== index));
  };

  const handleRawMaterialChange = (index: number, rawMaterialId: string) => {
    const material = rawMaterials.find(m => m.id === rawMaterialId);
    const newRows = [...ingredientRows];
    newRows[index] = {
      ...newRows[index],
      raw_material_id: rawMaterialId,
      unit: material?.unit || '',
    };
    setIngredientRows(newRows);
    
    // Clear search term after selection
    const newSearchTerms = { ...searchTerms };
    delete newSearchTerms[index];
    setSearchTerms(newSearchTerms);
  };

  const handleSearchChange = (index: number, value: string) => {
    setSearchTerms({
      ...searchTerms,
      [index]: value,
    });
  };

  const getFilteredMaterials = (index: number) => {
    const searchTerm = searchTerms[index]?.toLowerCase() || '';
    if (!searchTerm) return rawMaterials;
    
    return rawMaterials.filter(material =>
      material.name.toLowerCase().includes(searchTerm)
    );
  };

  const handleQuantityChange = (index: number, value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    const newRows = [...ingredientRows];
    newRows[index] = {
      ...newRows[index],
      quantity_needed: value,
    };
    setIngredientRows(newRows);
  };

  const validateBatchForm = (): boolean => {
    if (!formData.batch_name.trim()) {
      toast.error('Please enter batch name');
      return false;
    }

    if (!formData.producible_quantity || parseFloat(formData.producible_quantity) <= 0) {
      toast.error('Please enter how much you will produce');
      return false;
    }

    if (ingredientRows.length === 0) {
      toast.error('Please add at least one ingredient');
      return false;
    }

    for (let i = 0; i < ingredientRows.length; i++) {
      const row = ingredientRows[i];
      
      if (!row.raw_material_id) {
        toast.error(`Please select a raw material for ingredient ${i + 1}`);
        return false;
      }

      if (!row.quantity_needed || parseFloat(row.quantity_needed) <= 0) {
        toast.error(`Please enter a valid quantity for ingredient ${i + 1}`);
        return false;
      }

      const duplicateIndex = ingredientRows.findIndex(
        (r, idx) => idx !== i && r.raw_material_id === row.raw_material_id
      );
      if (duplicateIndex !== -1) {
        toast.error('Duplicate raw materials are not allowed');
        return false;
      }
    }

    return true;
  };

  const handleSaveBatch = async () => {
    if (!currentStore) return;
    if (!validateBatchForm()) return;

    setLoading(true);
    try {
      // Convert user input to liters for storage
      const quantity = parseFloat(formData.producible_quantity);
      const volumeL = formData.producible_unit === 'L' ? quantity : quantity / 1000;

      if (editingBatchId) {
        // Update existing batch
        const { error: updateError } = await supabase
          .from('recipe_batches')
          .update({
            batch_name: formData.batch_name.trim(),
            producible_quantity: volumeL,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingBatchId);

        if (updateError) throw updateError;

        // Delete old ingredients
        await supabase
          .from('recipe_batch_ingredients')
          .delete()
          .eq('recipe_batch_id', editingBatchId);

        // Insert new ingredients
        const ingredientsToInsert = ingredientRows.map(row => ({
          recipe_batch_id: editingBatchId,
          raw_material_id: row.raw_material_id,
          quantity_needed: parseFloat(row.quantity_needed),
          unit: row.unit,
          store_id: currentStore.id,
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_batch_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) throw ingredientsError;

        toast.success('Batch updated successfully');
      } else {
        // Create new batch
        const { data: newBatch, error: batchError } = await supabase
          .from('recipe_batches')
          .insert([{
            product_template_id: null, // Standalone batch
            batch_name: formData.batch_name.trim(),
            producible_quantity: volumeL,
            is_default: false,
            store_id: currentStore.id,
          }])
          .select()
          .single();

        if (batchError) throw batchError;

        // Insert ingredients
        const ingredientsToInsert = ingredientRows.map(row => ({
          recipe_batch_id: newBatch.id,
          raw_material_id: row.raw_material_id,
          quantity_needed: parseFloat(row.quantity_needed),
          unit: row.unit,
          store_id: currentStore.id,
        }));

        const { error: ingredientsError } = await supabase
          .from('recipe_batch_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) throw ingredientsError;

        toast.success('Batch created successfully');
      }

      setShowBatchForm(false);
      setFormData({ 
        batch_name: '',
        producible_quantity: '',
        producible_unit: 'L',
      });
      setIngredientRows([]);
      loadBatches();
      loadTotalAvailableTea(); // Refresh total available tea
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast.error(error.message || 'Failed to save batch');
    } finally {
      setLoading(false);
    }
  };

  const producibleDisplay = getProducibleDisplay();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {!showBatchForm ? (
        <>
          {/* Available Tea Stock Card */}
          <div className="mb-6 card bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                  <Coffee className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">
                    Current Available Tea Stock
                  </h3>
                  <p className="text-sm text-secondary-600">
                    Produced minus sold through POS
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-cyan-600">
                  {totalAvailableTea.toFixed(2)} L
                </p>
                <p className="text-sm text-secondary-600 mt-1">
                  ({(totalAvailableTea * 1000).toFixed(0)} ml)
                </p>
              </div>
            </div>
          </div>

          {/* Header with Create Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-secondary-900">Tea Batches</h3>
              <p className="text-sm text-secondary-600 mt-1">
                {batches.length} {batches.length === 1 ? 'batch' : 'batches'} created
              </p>
            </div>
            <button
              onClick={handleAddBatch}
              className="btn-primary flex items-center gap-2 px-6 py-3 text-lg shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Create Batch
            </button>
          </div>

          {/* Batches Grid */}
          {batches.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
              <Coffee className="w-20 h-20 text-amber-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Batches Yet</h3>
              <p className="text-secondary-600 mb-6">
                Create your first tea batch to start production
              </p>
              <button
                onClick={handleAddBatch}
                className="btn-primary inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create First Batch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch) => {
                const volumeFormatted = formatQuantity(batch.calculated_volume_ml, 'ml');
                return (
                  <div
                    key={batch.id}
                    className="bg-white rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:shadow-xl transition-all duration-200 p-6"
                  >
                    {/* Batch Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-secondary-900 mb-1">
                          {batch.batch_name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-secondary-600">
                          <Beaker className="w-4 h-4" />
                          <span>{batch.ingredients.length} ingredients</span>
                        </div>
                      </div>
                    </div>

                    {/* Production Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-secondary-600 mb-1">Batch Size</p>
                        <p className="text-lg font-bold text-green-600">
                          {volumeFormatted.displayText}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-secondary-600 mb-1">Total Produced</p>
                        <p className="text-lg font-bold text-blue-600">
                          {batch.total_produced_liters > 0 
                            ? formatQuantity(batch.total_produced_liters, 'L').displayText
                            : '0 L'}
                        </p>
                        {batch.production_count > 0 && (
                          <p className="text-xs text-blue-500 mt-1">
                            {batch.production_count}x produced
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ingredients List */}
                    <div className="bg-amber-50 rounded-lg p-3 mb-4 border border-amber-100">
                      <p className="text-xs font-semibold text-secondary-700 mb-2">Ingredients:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {batch.ingredients.map((ing) => (
                          <div key={ing.id} className="text-sm text-secondary-700 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                            <span className="font-medium">{ing.raw_material_name}:</span>
                            <span>{ing.quantity_needed} {ing.unit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditBatch(batch)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBatch(batch.id)}
                        className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Batch Form */
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl border-2 border-amber-200 shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-secondary-900">
                {editingBatchId ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              <button
                onClick={() => setShowBatchForm(false)}
                className="text-sm text-secondary-600 hover:text-secondary-900 font-medium"
              >
                ← Back to batches
              </button>
            </div>

            <div className="space-y-6">
              {/* Batch Name */}
              <div>
                <label className="block text-sm font-semibold text-secondary-700 mb-2">
                  Batch Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Morning Tea, Special Blend, Masala Chai"
                  autoFocus
                />
              </div>

              {/* Producible Quantity */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-200">
                <label className="block text-sm font-semibold text-secondary-700 mb-3">
                  How much will you produce? *
                </label>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-7">
                    <input
                      type="number"
                      required
                      min="0.1"
                      step="0.1"
                      value={formData.producible_quantity}
                      onChange={(e) => setFormData({ ...formData, producible_quantity: e.target.value })}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="col-span-5">
                    <select
                      value={formData.producible_unit}
                      onChange={(e) => setFormData({ ...formData, producible_unit: e.target.value as 'L' | 'ml' })}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="L">Liters (L)</option>
                      <option value="ml">Milliliters (ml)</option>
                    </select>
                  </div>
                </div>
                
                {/* Display Conversion */}
                {producibleDisplay && (
                  <div className="mt-4 p-4 bg-white rounded-lg border-2 border-purple-300">
                    <p className="text-sm text-secondary-600 mb-1">Will produce:</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {producibleDisplay}
                    </p>
                  </div>
                )}
              </div>

              {/* Ingredients Section */}
              <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-secondary-900">Ingredients *</h4>
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ingredient
                  </button>
                </div>

                {ingredientRows.length > 0 ? (
                  <div className="space-y-3">
                    {ingredientRows.map((row, index) => {
                      const filteredMaterials = getFilteredMaterials(index);
                      const selectedMaterial = rawMaterials.find(m => m.id === row.raw_material_id);
                      
                      return (
                        <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                          <div className="grid grid-cols-12 gap-3">
                            {/* Raw Material Selection with Search */}
                            <div className="col-span-5">
                              <div className="space-y-2">
                                {/* Search Input */}
                                <input
                                  type="text"
                                  value={searchTerms[index] || ''}
                                  onChange={(e) => handleSearchChange(index, e.target.value)}
                                  placeholder="🔍 Search raw material..."
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                />
                                
                                {/* Dropdown */}
                                <select
                                  value={row.raw_material_id}
                                  onChange={(e) => handleRawMaterialChange(index, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                  <option value="">Select Raw Material</option>
                                  {filteredMaterials.length === 0 ? (
                                    <option value="" disabled>No materials found</option>
                                  ) : (
                                    filteredMaterials.map((material) => (
                                      <option key={material.id} value={material.id}>
                                        {material.name} ({material.quantity} {material.unit})
                                      </option>
                                    ))
                                  )}
                                </select>
                                
                                {/* Selected Material Display */}
                                {selectedMaterial && (
                                  <div className="text-xs text-green-600 font-medium">
                                    ✓ {selectedMaterial.name}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Quantity Input */}
                            <div className="col-span-3">
                              <label className="block text-xs text-secondary-600 mb-1">Quantity</label>
                              <input
                                type="text"
                                value={row.quantity_needed}
                                onChange={(e) => handleQuantityChange(index, e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="0"
                              />
                            </div>
                            
                            {/* Unit Display */}
                            <div className="col-span-3">
                              <label className="block text-xs text-secondary-600 mb-1">Unit</label>
                              <div className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-secondary-600 font-medium">
                                {row.unit || '-'}
                              </div>
                            </div>
                            
                            {/* Delete Button */}
                            <div className="col-span-1">
                              <label className="block text-xs text-transparent mb-1">Del</label>
                              <button
                                type="button"
                                onClick={() => removeIngredientRow(index)}
                                className="w-full h-[38px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                title="Remove ingredient"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-500 text-center py-8">
                    No ingredients added yet. Click "Add Ingredient" to start.
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowBatchForm(false);
                    setFormData({ 
                      batch_name: '',
                      producible_quantity: '',
                      producible_unit: 'L',
                    });
                    setIngredientRows([]);
                  }}
                  className="px-6 py-3 text-secondary-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBatch}
                  className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingBatchId ? 'Update Batch' : 'Create Batch')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
