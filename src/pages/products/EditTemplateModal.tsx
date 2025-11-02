import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import toast from 'react-hot-toast';

interface EditTemplateModalProps {
  template: {
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    mrp: number | null;
    producible_quantity: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface Ingredient {
  raw_material_id: string;
  quantity_needed: string;
  unit: string;
}

export function EditTemplateModal({ template, onClose, onSuccess }: EditTemplateModalProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [formData, setFormData] = useState({
    name: template.name,
    sku: template.sku || '',
    unit: template.unit,
    mrp: template.mrp?.toString() || '',
    producible_quantity: template.producible_quantity.toString(),
  });

  useEffect(() => {
    loadRawMaterials();
    loadIngredients();
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

      const materials: RawMaterial[] = (data || []).map((item: any) => ({
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

  const loadIngredients = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('product_ingredients')
        .select('raw_material_id, quantity_needed, unit')
        .eq('product_template_id', template.id)
        .eq('store_id', currentStore.id);

      if (error) throw error;

      const ingredientList = (data || []).map((item: any) => ({
        raw_material_id: item.raw_material_id,
        quantity_needed: item.quantity_needed.toString(),
        unit: item.unit,
      }));

      setIngredients(ingredientList);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { raw_material_id: '', quantity_needed: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    
    // Auto-fill unit when raw material is selected
    if (field === 'raw_material_id') {
      const material = rawMaterials.find(m => m.id === value);
      if (material) {
        newIngredients[index].unit = material.unit;
      }
    }
    
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;

    if (!formData.name.trim()) {
      toast.error('Please enter template name');
      return;
    }

    if (ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }

    for (let i = 0; i < ingredients.length; i++) {
      if (!ingredients[i].raw_material_id || !ingredients[i].quantity_needed) {
        toast.error(`Please complete ingredient ${i + 1}`);
        return;
      }
    }

    if (!formData.producible_quantity || parseFloat(formData.producible_quantity) <= 0) {
      toast.error('Please enter recipe yield');
      return;
    }

    setLoading(true);
    try {
      // Update template
      const { error: templateError } = await supabase
        .from('product_templates')
        .update({
          name: formData.name.trim(),
          sku: formData.sku || null,
          unit: formData.unit,
          mrp: formData.mrp ? parseFloat(formData.mrp) : null,
          producible_quantity: parseFloat(formData.producible_quantity),
          updated_at: new Date().toISOString(),
        })
        .eq('id', template.id);

      if (templateError) throw templateError;

      // Delete old ingredients
      const { error: deleteError } = await supabase
        .from('product_ingredients')
        .delete()
        .eq('product_template_id', template.id);

      if (deleteError) throw deleteError;

      // Insert new ingredients
      const ingredientsToInsert = ingredients.map(ing => ({
        product_template_id: template.id,
        raw_material_id: ing.raw_material_id,
        quantity_needed: parseFloat(ing.quantity_needed),
        unit: ing.unit,
        store_id: currentStore.id,
      }));

      const { error: ingredientsError } = await supabase
        .from('product_ingredients')
        .insert(ingredientsToInsert);

      if (ingredientsError) throw ingredientsError;

      toast.success('Recipe template updated successfully');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating template:', error);
      toast.error(error.message || 'Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-display font-bold text-secondary-900">
            Edit Recipe Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., Tea Masala"
            />
          </div>

          {/* Unit and Recipe Yield */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Unit *
              </label>
              <select
                required
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="pcs">Pieces</option>
                <option value="kg">Kilogram</option>
                <option value="ltr">Liter</option>
                <option value="box">Box</option>
                <option value="pack">Pack</option>
                <option value="cup">Cup</option>
                <option value="glass">Glass</option>
                <option value="packet">Packet</option>
                <option value="plate">Plate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Recipe Yield *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.producible_quantity}
                onChange={(e) => setFormData({ ...formData, producible_quantity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="20"
              />
            </div>
          </div>

          {/* SKU and MRP */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="002"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Price (MRP)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="20.00"
              />
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-secondary-900">Recipe Ingredients *</h3>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Ingredient
              </button>
            </div>

            {ingredients.length > 0 ? (
              <div className="space-y-3">
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <select
                        value={ingredient.raw_material_id}
                        onChange={(e) => updateIngredient(index, 'raw_material_id', e.target.value)}
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
                        value={ingredient.quantity_needed}
                        onChange={(e) => updateIngredient(index, 'quantity_needed', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Quantity"
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="px-2 py-1.5 text-sm bg-gray-100 border border-gray-300 rounded-lg text-secondary-600">
                        {ingredient.unit || '-'}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
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
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
