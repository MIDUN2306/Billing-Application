import { useState, useEffect } from 'react';
import { X, AlertTriangle, Layers, Check, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { RecipeBatch } from '../../types/database.types';
import toast from 'react-hot-toast';

interface RefillProductModalProps {
  product: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    product_template_id: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface Ingredient {
  raw_material_id: string;
  raw_material_name: string;
  quantity_needed: number;
  unit: string;
  available_stock: number;
}

interface DraftOption extends RecipeBatch {
  ingredient_count: number;
}

export function RefillProductModal({ product, onClose, onSuccess }: RefillProductModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [quantityToAdd, setQuantityToAdd] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [producibleQuantity, setProducibleQuantity] = useState<number | null>(null);
  const [hasIngredients, setHasIngredients] = useState(false);
  const [stockWarnings, setStockWarnings] = useState<{ [key: string]: string }>({});
  const [availableDrafts, setAvailableDrafts] = useState<DraftOption[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');

  useEffect(() => {
    if (product.product_template_id) {
      loadDrafts();
    } else {
      setLoadingTemplate(false);
      setHasIngredients(false);
    }
  }, []);

  useEffect(() => {
    if (quantityToAdd && hasIngredients && producibleQuantity) {
      validateStock();
    }
  }, [quantityToAdd, ingredients, producibleQuantity]);

  const loadDrafts = async () => {
    if (!currentStore || !product.product_template_id) return;

    try {
      // Load available drafts for this template
      const { data: batches, error: batchesError } = await supabase
        .from('recipe_batches')
        .select('*')
        .eq('product_template_id', product.product_template_id)
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('batch_name');

      if (batchesError) throw batchesError;

      if (batches && batches.length > 0) {
        const draftsWithCounts: DraftOption[] = await Promise.all(
          batches.map(async (batch) => {
            const { count, error: countError } = await supabase
              .from('recipe_batch_ingredients')
              .select('*', { count: 'exact', head: true })
              .eq('recipe_batch_id', batch.id);

            if (countError) throw countError;

            return {
              ...batch,
              ingredient_count: count || 0,
            };
          })
        );

        setAvailableDrafts(draftsWithCounts);
        setHasIngredients(true);

        // Auto-select draft in priority order:
        // 1. Draft named "Standard Recipe" (case-insensitive)
        // 2. Draft marked as default
        // 3. First available draft
        const standardRecipe = draftsWithCounts.find(
          d => d.batch_name.toLowerCase() === 'standard recipe'
        );
        const defaultDraft = draftsWithCounts.find(d => d.is_default);
        const draftToSelect = standardRecipe || defaultDraft || draftsWithCounts[0];
        
        if (draftToSelect) {
          // Pass the draft data directly to avoid state timing issues
          handleDraftSelection(draftToSelect.id, draftToSelect);
        }
      } else {
        // No drafts, load from old system
        loadLegacyTemplate();
      }
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load recipe drafts');
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleDraftSelection = async (draftId: string, draftData?: DraftOption) => {
    if (!currentStore || !draftId) return;

    // Use provided draft data or find it in state
    const draft = draftData || availableDrafts.find(d => d.id === draftId);
    if (!draft) return;

    try {
      setSelectedDraftId(draftId);
      setProducibleQuantity(draft.producible_quantity);
      setQuantityToAdd(draft.producible_quantity.toString());

      // Load ingredients for this draft
      const { data: batchIngredients, error: ingredientsError } = await supabase
        .from('recipe_batch_ingredients')
        .select(`
          raw_material_id,
          quantity_needed,
          unit,
          raw_materials (
            name
          )
        `)
        .eq('recipe_batch_id', draftId)
        .eq('store_id', currentStore.id);

      if (ingredientsError) throw ingredientsError;

      if (batchIngredients) {
        // Get stock information for each raw material
        const ingredientsWithStock: Ingredient[] = await Promise.all(
          batchIngredients.map(async (ing: any) => {
            const { data: stockData } = await supabase
              .from('raw_material_stock')
              .select('quantity')
              .eq('raw_material_id', ing.raw_material_id)
              .eq('store_id', currentStore.id)
              .single();

            return {
              raw_material_id: ing.raw_material_id,
              raw_material_name: ing.raw_materials?.name || 'Unknown',
              quantity_needed: ing.quantity_needed,
              unit: ing.unit,
              available_stock: stockData?.quantity || 0,
            };
          })
        );

        setIngredients(ingredientsWithStock);
      }
    } catch (error) {
      console.error('Error loading draft ingredients:', error);
      toast.error('Failed to load draft ingredients');
    }
  };

  const loadLegacyTemplate = async () => {
    if (!currentStore || !product.product_template_id) return;

    try {
      const { data, error } = await supabase
        .from('v_product_ingredient_details')
        .select('*')
        .eq('product_template_id', product.product_template_id)
        .eq('store_id', currentStore.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const templateData = data[0];
        setProducibleQuantity(templateData.producible_quantity);
        setQuantityToAdd(templateData.producible_quantity?.toString() || '1');
        setHasIngredients(templateData.has_ingredients);

        if (templateData.has_ingredients) {
          const ingredientsList: Ingredient[] = data.map((item: any) => ({
            raw_material_id: item.raw_material_id,
            raw_material_name: item.raw_material_name,
            quantity_needed: item.quantity_needed,
            unit: item.unit,
            available_stock: item.available_stock,
          }));
          setIngredients(ingredientsList);
        }
      }
    } catch (error) {
      console.error('Error loading legacy template:', error);
      toast.error('Failed to load product template');
    }
  };

  const validateStock = () => {
    if (!producibleQuantity || !quantityToAdd) return;

    const newWarnings: { [key: string]: string } = {};
    const qty = parseFloat(quantityToAdd);
    
    if (isNaN(qty) || qty <= 0) return;

    const batchRatio = qty / producibleQuantity;

    ingredients.forEach((ingredient) => {
      const totalNeeded = ingredient.quantity_needed * batchRatio;
      
      if (totalNeeded > ingredient.available_stock) {
        const shortage = totalNeeded - ingredient.available_stock;
        newWarnings[ingredient.raw_material_id] = 
          `Need ${totalNeeded.toFixed(2)} ${ingredient.unit}, have only ${ingredient.available_stock} ${ingredient.unit} (short by ${shortage.toFixed(2)} ${ingredient.unit})`;
      }
    });

    setStockWarnings(newWarnings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    const qty = parseFloat(quantityToAdd);
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (Object.keys(stockWarnings).length > 0) {
      toast.error('Insufficient stock for some ingredients');
      return;
    }

    setLoading(true);
    try {
      // If product has ingredients, deduct raw materials
      if (hasIngredients && ingredients.length > 0 && producibleQuantity) {
        const batchRatio = qty / producibleQuantity;

        for (const ingredient of ingredients) {
          const totalNeeded = ingredient.quantity_needed * batchRatio;
          
          // Get current stock
          const { data: stockData, error: stockError } = await supabase
            .from('raw_material_stock')
            .select('quantity')
            .eq('raw_material_id', ingredient.raw_material_id)
            .eq('store_id', currentStore.id)
            .single();

          if (stockError) throw stockError;

          // Update stock
          const { error: updateError } = await supabase
            .from('raw_material_stock')
            .update({
              quantity: stockData.quantity - totalNeeded,
              updated_at: new Date().toISOString(),
            })
            .eq('raw_material_id', ingredient.raw_material_id)
            .eq('store_id', currentStore.id);

          if (updateError) throw updateError;
        }
      }

      // Update product quantity and save which draft was used
      const updateData: any = {
        quantity: product.quantity + qty,
        updated_at: new Date().toISOString(),
      };

      // If a draft was selected, save it
      if (selectedDraftId) {
        updateData.last_recipe_batch_id = selectedDraftId;
      }

      const { error: productError } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', product.id);

      if (productError) throw productError;

      const actionText = hasIngredients ? 'produced and added' : 'added';
      toast.success(`Successfully ${actionText} ${qty} ${product.unit} to ${product.name}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error refilling product:', error);
      const errorMessage = error?.message || error?.error_description || 'Failed to refill product';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loadingTemplate) {
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-display font-bold text-secondary-900">
              Produce Product
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              {product.name} • Current Stock: {product.quantity} {product.unit}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipe Batch Cards */}
          {availableDrafts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Select Recipe Batch *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableDrafts.map((draft) => {
                  const isSelected = selectedDraftId === draft.id;
                  return (
                    <button
                      key={draft.id}
                      type="button"
                      onClick={() => handleDraftSelection(draft.id)}
                      className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 shadow-md scale-[1.02]'
                          : 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center animate-in fade-in zoom-in duration-200">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Batch Name */}
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className={`w-4 h-4 ${isSelected ? 'text-primary-600' : 'text-secondary-400'}`} />
                        <h3 className={`font-semibold ${isSelected ? 'text-primary-900' : 'text-secondary-900'}`}>
                          {draft.batch_name}
                        </h3>
                      </div>

                      {/* Default Badge */}
                      {draft.is_default && (
                        <span className="inline-block px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full mb-2">
                          Default
                        </span>
                      )}

                      {/* Batch Info */}
                      <div className="space-y-1 text-sm">
                        <div className={`flex items-center justify-between ${isSelected ? 'text-primary-700' : 'text-secondary-600'}`}>
                          <span>Yields:</span>
                          <span className="font-medium">{draft.producible_quantity} {product.unit}</span>
                        </div>
                        <div className={`flex items-center justify-between ${isSelected ? 'text-primary-700' : 'text-secondary-600'}`}>
                          <span>Ingredients:</span>
                          <span className="font-medium">{draft.ingredient_count}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs text-secondary-500">
                <Package className="w-4 h-4" />
                <span>
                  {availableDrafts.length} recipe batch{availableDrafts.length !== 1 ? 'es' : ''} available
                </span>
              </div>
            </div>
          )}

          {/* Recipe Ingredients */}
          {hasIngredients && ingredients.length > 0 && selectedDraftId && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Required Ingredients
                </h3>
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                  {ingredients.length} items
                </span>
              </div>
              <div className="space-y-3">
                {ingredients.map((ingredient) => {
                  const isOutOfStock = ingredient.available_stock === 0;
                  const isLowStock = ingredient.available_stock > 0 && ingredient.available_stock < ingredient.quantity_needed;
                  const hasEnough = ingredient.available_stock >= ingredient.quantity_needed;
                  
                  return (
                    <div 
                      key={ingredient.raw_material_id} 
                      className={`p-3 rounded-lg border-2 transition-all ${
                        isOutOfStock 
                          ? 'bg-red-50 border-red-200' 
                          : isLowStock 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-white border-green-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium text-sm ${
                              isOutOfStock ? 'text-red-700' : 'text-secondary-900'
                            }`}>
                              {ingredient.raw_material_name}
                            </span>
                            {hasEnough && (
                              <Check className="w-4 h-4 text-green-600" />
                            )}
                            {isOutOfStock && (
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${
                          isOutOfStock ? 'text-red-700' : 'text-secondary-700'
                        }`}>
                          {ingredient.quantity_needed} {ingredient.unit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`${
                          isOutOfStock ? 'text-red-600 font-medium' : 
                          isLowStock ? 'text-yellow-700' : 
                          'text-green-600'
                        }`}>
                          Stock: {ingredient.available_stock} {ingredient.unit}
                        </span>
                        {isOutOfStock && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-medium">
                            OUT OF STOCK
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full font-medium">
                            LOW STOCK
                          </span>
                        )}
                        {hasEnough && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                            ✓ Available
                          </span>
                        )}
                      </div>
                      {stockWarnings[ingredient.raw_material_id] && (
                        <div className="flex items-start gap-2 mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                          <AlertTriangle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-yellow-800 leading-relaxed">
                            {stockWarnings[ingredient.raw_material_id]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity to Produce - Auto-filled and Locked */}
          {selectedDraftId && (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-lg p-4 border border-primary-200">
              <label className="block text-sm font-medium text-secondary-700 mb-3">
                Production Quantity
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={quantityToAdd}
                  readOnly
                  disabled
                  className="w-full px-4 py-3 border-2 border-primary-300 rounded-lg bg-white text-lg font-semibold text-primary-900 cursor-not-allowed opacity-90"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-primary-600 text-white text-xs font-medium rounded">
                  {product.unit}
                </div>
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Recipe Yield:</span>
                  <span className="font-medium text-primary-700">{producibleQuantity} {product.unit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Batch Multiplier:</span>
                  <span className="font-medium text-primary-700">1×</span>
                </div>
              </div>
              <p className="text-xs text-secondary-500 mt-3 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Quantity is auto-set based on selected recipe batch
              </p>
            </div>
          )}

          {/* Result Preview */}
          {quantityToAdd && selectedDraftId && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-5 border-2 border-green-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-secondary-900">Production Summary</h4>
                  <p className="text-xs text-secondary-600">Ready to produce</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Current Stock:</span>
                  <span className="font-medium text-secondary-900">{product.quantity} {product.unit}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Will Produce:</span>
                  <span className="font-semibold text-green-700">+{quantityToAdd} {product.unit}</span>
                </div>
                <div className="h-px bg-green-200 my-2"></div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-secondary-700">New Stock Level:</span>
                  <span className="text-lg font-bold text-green-700">
                    {product.quantity + parseFloat(quantityToAdd)} {product.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stock Warning Summary */}
          {Object.keys(stockWarnings).length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-lg p-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 mb-2">
                    ⚠️ Cannot Produce - Insufficient Stock
                  </p>
                  <p className="text-sm text-red-800 mb-3">
                    Some ingredients are out of stock or insufficient. Please add more raw materials before producing.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-red-200">
                    <p className="text-xs font-medium text-red-700 mb-1">Missing Items:</p>
                    <p className="text-xs text-red-600">
                      {Object.keys(stockWarnings).length} ingredient{Object.keys(stockWarnings).length !== 1 ? 's' : ''} need restocking
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-secondary-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-8 py-2.5 text-sm font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2 ${
                loading || Object.keys(stockWarnings).length > 0 || !selectedDraftId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
              disabled={loading || Object.keys(stockWarnings).length > 0 || !selectedDraftId}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {hasIngredients ? 'Producing...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  {hasIngredients ? 'Produce Now' : 'Add Stock'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
