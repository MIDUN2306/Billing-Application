import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Layers, Coffee } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { RecipeBatch, RecipeBatchIngredient } from '../../types/database.types';
import toast from 'react-hot-toast';

interface TeaPreparationModalProps {
  onClose: () => void;
}

interface RawMaterialWithStock {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface BatchWithIngredients extends RecipeBatch {
  ingredients: RecipeBatchIngredient[];
}

interface ProductWithBatches {
  id: string;
  name: string;
  batches: BatchWithIngredients[];
}

interface IngredientRow {
  raw_material_id: string;
  quantity_needed: string;
  unit: string;
}

export function TeaPreparationModal({ onClose }: TeaPreparationModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductWithBatches[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithBatches | null>(null);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    batch_name: '',
    producible_quantity: '',
  });
  
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);

  useEffect(() => {
    loadProductsWithBatches();
    loadRawMaterials();
  }, []);

  const loadProductsWithBatches = async () => {
    if (!currentStore) return;

    setLoading(true);
    try {
      // Load all product templates
      const { data: templates, error: templatesError } = await supabase
        .from('product_templates')
        .select('id, name')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .eq('has_ingredients', true)
        .order('name');

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Load batches for all templates
      const productsWithBatches: ProductWithBatches[] = await Promise.all(
        templates.map(async (template) => {
          const { data: batches, error: batchesError } = await supabase
            .from('recipe_batches')
            .select('*')
            .eq('product_template_id', template.id)
            .eq('store_id', currentStore.id)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .order('batch_name');

          if (batchesError) throw batchesError;

          const batchesWithIngredients: BatchWithIngredients[] = await Promise.all(
            (batches || []).map(async (batch) => {
              const { data: ingredients, error: ingredientsError } = await supabase
                .from('recipe_batch_ingredients')
                .select('*')
                .eq('recipe_batch_id', batch.id)
                .eq('store_id', currentStore.id);

              if (ingredientsError) throw ingredientsError;

              return {
                ...batch,
                ingredients: ingredients || [],
              };
            })
          );

          return {
            id: template.id,
            name: template.name,
            batches: batchesWithIngredients,
          };
        })
      );

      setProducts(productsWithBatches);
    } catch (error) {
      console.error('Error loading products with batches:', error);
      toast.error('Failed to load tea preparation data');
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
            name
          )
        `)
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      if (error) throw error;

      const materials: RawMaterialWithStock[] = (data || []).map((item: any) => ({
        id: item.raw_materials.id,
        name: item.raw_materials.name,
        unit: item.unit,
        quantity: item.quantity,
      }));

      setRawMaterials(materials);
    } catch (error) {
      console.error('Error loading raw materials:', error);
    }
  };

  const handleProductSelect = (product: ProductWithBatches) => {
    setSelectedProduct(product);
    setShowBatchForm(false);
  };

  const handleAddBatch = () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    setShowBatchForm(true);
    setEditingBatchId(null);
    setFormData({ batch_name: '', producible_quantity: '' });
    setIngredientRows([]);
  };

  const handleEditBatch = (batch: BatchWithIngredients) => {
    setShowBatchForm(true);
    setEditingBatchId(batch.id);
    setFormData({
      batch_name: batch.batch_name,
      producible_quantity: batch.producible_quantity.toString(),
    });
    
    const ingredients: IngredientRow[] = batch.ingredients.map(ing => ({
      raw_material_id: ing.raw_material_id,
      quantity_needed: ing.quantity_needed.toString(),
      unit: ing.unit,
    }));
    setIngredientRows(ingredients);
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!selectedProduct) return;

    if (selectedProduct.batches.length === 1) {
      toast.error('Cannot delete the last batch. At least one batch is required.');
      return;
    }

    if (!confirm('Are you sure you want to delete this batch?')) return;

    try {
      const { error } = await supabase
        .from('recipe_batches')
        .update({ is_active: false })
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Batch deleted successfully');
      loadProductsWithBatches();
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      toast.error(error.message || 'Failed to delete batch');
    }
  };

  const handleSetDefault = async (batchId: string) => {
    if (!currentStore || !selectedProduct) return;

    try {
      // Unset all defaults for this template
      await supabase
        .from('recipe_batches')
        .update({ is_default: false })
        .eq('product_template_id', selectedProduct.id)
        .eq('store_id', currentStore.id);

      // Set the selected batch as default
      const { error } = await supabase
        .from('recipe_batches')
        .update({ is_default: true })
        .eq('id', batchId);

      if (error) throw error;

      toast.success('Default batch updated');
      loadProductsWithBatches();
    } catch (error: any) {
      console.error('Error setting default batch:', error);
      toast.error(error.message || 'Failed to set default batch');
    }
  };

  const addIngredientRow = () => {
    setIngredientRows([
      ...ingredientRows,
      {
        raw_material_id: '',
        quantity_needed: '',
        unit: '',
      },
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
      toast.error('Please enter producible quantity');
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
    if (!currentStore || !selectedProduct) return;
    if (!validateBatchForm()) return;

    setLoading(true);
    try {
      if (editingBatchId) {
        // Update existing batch
        const { error: updateError } = await supabase
          .from('recipe_batches')
          .update({
            batch_name: formData.batch_name.trim(),
            producible_quantity: parseFloat(formData.producible_quantity),
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
            product_template_id: selectedProduct.id,
            batch_name: formData.batch_name.trim(),
            producible_quantity: parseFloat(formData.producible_quantity),
            is_default: selectedProduct.batches.length === 0,
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
      setFormData({ batch_name: '', producible_quantity: '' });
      setIngredientRows([]);
      loadProductsWithBatches();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      toast.error(error.message || 'Failed to save batch');
    } finally {
      setLoading(false);
    }
  };

  const totalBatches = products.reduce((sum, p) => sum + p.batches.length, 0);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <div>
            <h2 className="text-2xl font-display font-bold text-secondary-900 flex items-center gap-3">
              <Coffee className="w-7 h-7 text-amber-600" />
              Tea Preparation Batches
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              Manage recipe batches for all your tea products • {totalBatches} total batches
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <Coffee className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-secondary-900 mb-2">No Recipe Products Found</h3>
              <p className="text-secondary-600 mb-4">
                Create products with recipes first to manage their batches
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Product List */}
              <div className="col-span-4 space-y-2">
                <h3 className="text-sm font-semibold text-secondary-700 mb-3 px-2">Products</h3>
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedProduct?.id === product.id
                        ? 'border-amber-500 bg-amber-50 shadow-md'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-secondary-900">{product.name}</h4>
                        <p className="text-xs text-secondary-600 mt-1">
                          {product.batches.length} {product.batches.length === 1 ? 'batch' : 'batches'}
                        </p>
                      </div>
                      <Layers className="w-5 h-5 text-amber-600" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Right Content - Batch Management */}
              <div className="col-span-8">
                {!selectedProduct ? (
                  <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-secondary-600">Select a product to manage its batches</p>
                  </div>
                ) : !showBatchForm ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {selectedProduct.name} - Batches
                      </h3>
                      <button
                        onClick={handleAddBatch}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Batch
                      </button>
                    </div>

                    {selectedProduct.batches.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Layers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-secondary-600 mb-4">No batches yet for this product</p>
                        <button
                          onClick={handleAddBatch}
                          className="btn-primary"
                        >
                          Create First Batch
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedProduct.batches.map((batch) => (
                          <div
                            key={batch.id}
                            className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 transition-colors bg-white shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-secondary-900">
                                    {batch.batch_name}
                                  </h4>
                                  {batch.is_default && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-secondary-600 mt-1">
                                  Makes {batch.producible_quantity} units
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {!batch.is_default && (
                                  <button
                                    onClick={() => handleSetDefault(batch.id)}
                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                    title="Set as default"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEditBatch(batch)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit batch"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBatch(batch.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete batch"
                                  disabled={selectedProduct.batches.length === 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                              <p className="text-xs font-semibold text-secondary-700 mb-2">Ingredients:</p>
                              <div className="space-y-1">
                                {batch.ingredients.map((ing) => {
                                  const material = rawMaterials.find(m => m.id === ing.raw_material_id);
                                  return (
                                    <div key={ing.id} className="text-sm text-secondary-700 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                      <span className="font-medium">{material?.name || 'Unknown'}:</span>
                                      <span>{ing.quantity_needed} {ing.unit}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-secondary-900">
                        {editingBatchId ? 'Edit Batch' : 'Add New Batch'}
                      </h3>
                      <button
                        onClick={() => setShowBatchForm(false)}
                        className="text-sm text-secondary-600 hover:text-secondary-900"
                      >
                        ← Back to batches
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Batch Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.batch_name}
                        onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="e.g., Small Batch, Large Batch, 2L Milk Recipe"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-secondary-700 mb-2">
                        Producible Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        step="1"
                        value={formData.producible_quantity}
                        onChange={(e) => setFormData({ ...formData, producible_quantity: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="How many units can be made"
                      />
                      <p className="text-xs text-secondary-500 mt-1">
                        Example: "50" if this recipe makes 50 cups
                      </p>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-secondary-900">Ingredients *</h4>
                        <button
                          type="button"
                          onClick={addIngredientRow}
                          className="text-sm px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Ingredient
                        </button>
                      </div>

                      {ingredientRows.length > 0 ? (
                        <div className="space-y-3">
                          {ingredientRows.map((row, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2">
                              <div className="col-span-5">
                                <select
                                  value={row.raw_material_id}
                                  onChange={(e) => handleRawMaterialChange(index, e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                  <option value="">Select Raw Material</option>
                                  {rawMaterials.map((material) => (
                                    <option key={material.id} value={material.id}>
                                      {material.name} ({material.quantity} {material.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={row.quantity_needed}
                                  onChange={(e) => handleQuantityChange(index, e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Quantity"
                                />
                              </div>
                              <div className="col-span-3">
                                <div className="px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-lg text-secondary-600">
                                  {row.unit || '-'}
                                </div>
                              </div>
                              <div className="col-span-1">
                                <button
                                  type="button"
                                  onClick={() => removeIngredientRow(index)}
                                  className="w-full p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 mx-auto" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-secondary-500 text-center py-4">
                          No ingredients added yet. Click "Add Ingredient" to start.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBatchForm(false);
                          setFormData({ batch_name: '', producible_quantity: '' });
                          setIngredientRows([]);
                        }}
                        className="btn-secondary"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBatch}
                        className="btn-primary"
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : (editingBatchId ? 'Update Batch' : 'Create Batch')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
