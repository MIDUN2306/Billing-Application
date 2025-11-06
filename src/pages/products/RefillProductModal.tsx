import { useState, useEffect } from 'react';
import { X, AlertTriangle, Layers } from 'lucide-react';
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
            const { data: stockData, error: stockError } = await supabase
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
              Refill Product
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
          {/* Draft Selector */}
          {availableDrafts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Select Recipe Draft *
              </label>
              <select
                value={selectedDraftId}
                onChange={(e) => handleDraftSelection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {availableDrafts.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.batch_name}
                    {draft.is_default && ' (Default)'}
                    {' • '}
                    {draft.ingredient_count} ingredient{draft.ingredient_count !== 1 ? 's' : ''}
                    {' • Yields '}
                    {draft.producible_quantity} {product.unit}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2 mt-2 text-xs text-secondary-500">
                <Layers className="w-4 h-4" />
                <span>
                  {availableDrafts.length} recipe draft{availableDrafts.length !== 1 ? 's' : ''} available
                </span>
              </div>
            </div>
          )}

          {/* Recipe Info */}
          {hasIngredients && ingredients.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-secondary-900 mb-3">
                Recipe Ingredients
              </h3>
              <div className="space-y-2">
                {ingredients.map((ingredient) => {
                  const isOutOfStock = ingredient.available_stock === 0;
                  const isLowStock = ingredient.available_stock > 0 && ingredient.available_stock < ingredient.quantity_needed;
                  
                  return (
                    <div key={ingredient.raw_material_id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className={`${isOutOfStock ? 'text-red-700 font-medium' : 'text-secondary-700'}`}>
                          {ingredient.raw_material_name}
                          {isOutOfStock && ' ⚠️'}
                        </span>
                        <span className="text-secondary-600">
                          {ingredient.quantity_needed} {ingredient.unit} per batch
                        </span>
                      </div>
                      <div className={`text-xs ${isOutOfStock ? 'text-red-600 font-medium' : isLowStock ? 'text-yellow-600' : 'text-secondary-500'}`}>
                        Available: {ingredient.available_stock} {ingredient.unit}
                        {isOutOfStock && ' - OUT OF STOCK'}
                      </div>
                      {stockWarnings[ingredient.raw_material_id] && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">
                            {stockWarnings[ingredient.raw_material_id]}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {producibleQuantity && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-secondary-700">
                    Recipe Yield: <span className="font-medium">{producibleQuantity} {product.unit}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Quantity to Add */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Quantity to {hasIngredients ? 'Produce' : 'Add'} *
            </label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder={`Enter quantity in ${product.unit}`}
              autoFocus
            />
            {quantityToAdd && hasIngredients && producibleQuantity && (
              <p className="text-xs text-secondary-500 mt-1">
                {parseFloat(quantityToAdd) !== producibleQuantity ? (
                  <>
                    This will produce {quantityToAdd} {product.unit}
                    {` (${(parseFloat(quantityToAdd) / producibleQuantity).toFixed(2)}× the recipe)`}
                  </>
                ) : (
                  `This will produce ${quantityToAdd} ${product.unit} (1× the recipe)`
                )}
              </p>
            )}
          </div>

          {/* Result Preview */}
          {quantityToAdd && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-secondary-700">
                New Stock Level: <span className="font-medium text-green-700">
                  {product.quantity} + {quantityToAdd} = {product.quantity + parseFloat(quantityToAdd)} {product.unit}
                </span>
              </p>
            </div>
          )}

          {/* Stock Warning Summary */}
          {Object.keys(stockWarnings).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">
                    Cannot Produce - Insufficient Stock
                  </p>
                  <p className="text-xs text-red-700">
                    Please reduce quantity or add more raw materials before producing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || Object.keys(stockWarnings).length > 0}
            >
              {loading 
                ? (hasIngredients ? 'Producing...' : 'Adding...') 
                : (hasIngredients ? 'Produce & Add' : 'Add Stock')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
