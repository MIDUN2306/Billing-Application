import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductTemplateWithDetails, ProductIngredientWithDetails } from '../../types/database.types';
import toast from 'react-hot-toast';

interface RawMaterialWithStock {
  id: string;
  name: string;
  stock_id: string;
  unit: string;
  quantity: number;
}

interface IngredientRow {
  id?: string;
  raw_material_id: string;
  quantity_needed: string;
  unit: string;
  isNew: boolean;
}

interface ManageIngredientsModalProps {
  template: ProductTemplateWithDetails;
  onClose: () => void;
}

export function ManageIngredientsModal({ template, onClose }: ManageIngredientsModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [existingIngredients, setExistingIngredients] = useState<ProductIngredientWithDetails[]>([]);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [stockWarnings, setStockWarnings] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    loadRawMaterials();
    loadExistingIngredients();
  }, []);

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
        .eq('is_active', true)
        .gt('quantity', 0);

      if (error) throw error;

      const materials: RawMaterialWithStock[] = (data || []).map((item: any) => ({
        id: item.raw_materials.id,
        name: item.raw_materials.name,
        stock_id: item.id,
        unit: item.unit,
        quantity: item.quantity,
      }));

      setRawMaterials(materials);
    } catch (error) {
      console.error('Error loading raw materials:', error);
      toast.error('Failed to load raw materials');
    }
  };

  const loadExistingIngredients = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('v_product_ingredient_details')
        .select('*')
        .eq('product_template_id', template.id)
        .eq('store_id', currentStore.id);

      if (error) throw error;
      setExistingIngredients(data || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const addIngredientRow = () => {
    setIngredientRows([
      ...ingredientRows,
      {
        raw_material_id: '',
        quantity_needed: '',
        unit: '',
        isNew: true,
      },
    ]);
  };

  const removeIngredientRow = (index: number) => {
    const newRows = ingredientRows.filter((_, i) => i !== index);
    setIngredientRows(newRows);
    
    // Remove warning for this row
    const newWarnings = { ...stockWarnings };
    delete newWarnings[index];
    setStockWarnings(newWarnings);
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
    
    // Clear warning when changing material
    const newWarnings = { ...stockWarnings };
    delete newWarnings[index];
    setStockWarnings(newWarnings);
  };

  const handleQuantityChange = (index: number, value: string) => {
    // Allow only numbers and decimal point
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    const newRows = [...ingredientRows];
    newRows[index] = {
      ...newRows[index],
      quantity_needed: value,
    };
    setIngredientRows(newRows);

    // Validate against stock
    if (value && newRows[index].raw_material_id) {
      const material = rawMaterials.find(m => m.id === newRows[index].raw_material_id);
      if (material) {
        const quantityNeeded = parseFloat(value);
        if (quantityNeeded > material.quantity) {
          setStockWarnings({
            ...stockWarnings,
            [index]: `Only ${material.quantity} ${material.unit} available in stock`,
          });
        } else {
          const newWarnings = { ...stockWarnings };
          delete newWarnings[index];
          setStockWarnings(newWarnings);
        }
      }
    }
  };

  const handleDeleteExisting = async (ingredientId: string) => {
    if (!confirm('Are you sure you want to remove this ingredient?')) return;

    try {
      const { error } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('id', ingredientId);

      if (error) throw error;
      toast.success('Ingredient removed successfully');
      loadExistingIngredients();
    } catch (error: any) {
      console.error('Error deleting ingredient:', error);
      toast.error('Failed to remove ingredient');
    }
  };

  const validateIngredients = (): boolean => {
    // Check if at least one ingredient exists or is being added
    if (existingIngredients.length === 0 && ingredientRows.length === 0) {
      toast.error('Please add at least one ingredient');
      return false;
    }

    // Validate new ingredient rows
    for (let i = 0; i < ingredientRows.length; i++) {
      const row = ingredientRows[i];
      
      if (!row.raw_material_id) {
        toast.error(`Please select a raw material for row ${i + 1}`);
        return false;
      }

      if (!row.quantity_needed || parseFloat(row.quantity_needed) <= 0) {
        toast.error(`Please enter a valid quantity for row ${i + 1}`);
        return false;
      }

      // Check for duplicates in new rows
      const duplicateInNew = ingredientRows.findIndex(
        (r, idx) => idx !== i && r.raw_material_id === row.raw_material_id
      );
      if (duplicateInNew !== -1) {
        toast.error('Duplicate raw materials are not allowed');
        return false;
      }

      // Check for duplicates with existing ingredients
      const duplicateInExisting = existingIngredients.find(
        e => e.raw_material_id === row.raw_material_id
      );
      if (duplicateInExisting) {
        toast.error('This raw material is already added to the template');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!currentStore) return;
    if (!validateIngredients()) return;

    setLoading(true);
    try {
      // Insert new ingredients
      if (ingredientRows.length > 0) {
        const ingredientsToInsert = ingredientRows.map(row => ({
          product_template_id: template.id,
          raw_material_id: row.raw_material_id,
          quantity_needed: parseFloat(row.quantity_needed),
          unit: row.unit,
          store_id: currentStore.id,
        }));

        const { error } = await supabase
          .from('product_ingredients')
          .insert(ingredientsToInsert);

        if (error) throw error;
      }

      toast.success('Ingredients saved successfully');
      onClose();
    } catch (error: any) {
      console.error('Error saving ingredients:', error);
      toast.error(error.message || 'Failed to save ingredients');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-display font-bold text-secondary-900">
              Manage Ingredients
            </h2>
            <p className="text-sm text-secondary-600 mt-1">
              {template.name} {template.sku && `(${template.sku})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Ingredients */}
          {existingIngredients.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-secondary-700 mb-3">Current Ingredients</h3>
              <div className="space-y-2">
                {existingIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          {ingredient.raw_material_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600">
                          {ingredient.quantity_needed} {ingredient.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500">
                          Stock: {ingredient.available_stock} {ingredient.stock_unit}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteExisting(ingredient.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-secondary-700">Add New Ingredients</h3>
              <button
                onClick={addIngredientRow}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {ingredientRows.length === 0 && existingIngredients.length === 0 && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-secondary-500 text-sm">
                  No ingredients added yet. Click "Add Ingredient" to start.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {ingredientRows.map((row, index) => (
                <div key={index} className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Raw Material Dropdown */}
                    <div className="md:col-span-5">
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Raw Material *
                      </label>
                      <select
                        value={row.raw_material_id}
                        onChange={(e) => handleRawMaterialChange(index, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      >
                        <option value="">Select Raw Material</option>
                        {rawMaterials.map((material) => (
                          <option key={material.id} value={material.id}>
                            {material.name} (Stock: {material.quantity} {material.unit})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity Input */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Quantity *
                      </label>
                      <input
                        type="text"
                        value={row.quantity_needed}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="0.00"
                      />
                    </div>

                    {/* Unit Display */}
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-secondary-700 mb-1">
                        Unit
                      </label>
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm text-secondary-600">
                        {row.unit || '-'}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-1 flex items-end">
                      <button
                        onClick={() => removeIngredientRow(index)}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </div>
                  </div>

                  {/* Stock Warning */}
                  {stockWarnings[index] && (
                    <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <p className="text-xs text-yellow-800">{stockWarnings[index]}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Message */}
          {ingredientRows.length === 0 && existingIngredients.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Add ingredients to define what raw materials are needed to make this product.
              </p>
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
              onClick={handleSave}
              className="btn-primary"
              disabled={loading || ingredientRows.length === 0}
            >
              {loading ? 'Saving...' : 'Save Ingredients'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
