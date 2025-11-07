import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductTemplateWithDetails, ProductName } from '../../types/database.types';
import { AddProductNameModal } from './AddProductNameModal';
import { SearchableSelect } from '../../components/SearchableSelect';
import toast from 'react-hot-toast';

interface ProductTemplateFormProps {
  template?: ProductTemplateWithDetails | null;
  onClose: () => void;
}

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

export function ProductTemplateForm({ template, onClose }: ProductTemplateFormProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [showAddProductName, setShowAddProductName] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [existingIngredients, setExistingIngredients] = useState<any[]>([]);
  const [stockWarnings, setStockWarnings] = useState<{ [key: number]: string }>({});

  const [formData, setFormData] = useState({
    product_name_id: template?.product_name_id || '',
    unit: template?.unit || 'pcs',
    sku: template?.sku || '',
    mrp: template?.mrp?.toString() || '',
    has_ingredients: template?.has_ingredients ?? true,
    producible_quantity: template?.producible_quantity?.toString() || '',
  });

  useEffect(() => {
    loadProductNames();
    loadRawMaterials();
    if (template) {
      loadExistingIngredients();
    }
  }, []);

  const loadProductNames = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('product_names')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProductNames(data || []);
    } catch (error) {
      console.error('Error loading product names:', error);
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
    }
  };

  const loadExistingIngredients = async () => {
    if (!currentStore || !template) return;

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

  const generateSKU = () => {
    const selectedProduct = productNames.find(p => p.id === formData.product_name_id);
    if (!selectedProduct) {
      toast.error('Please select a product name first');
      return;
    }
    const prefix = selectedProduct.name.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData({ ...formData, sku: `${prefix}-${random}` });
  };

  const handleProductNameAdded = (productNameId: string) => {
    setFormData({ ...formData, product_name_id: productNameId });
    loadProductNames();
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

    const newWarnings = { ...stockWarnings };
    delete newWarnings[index];
    setStockWarnings(newWarnings);
  };

  const handleQuantityChange = (index: number, value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    const newRows = [...ingredientRows];
    newRows[index] = {
      ...newRows[index],
      quantity_needed: value,
    };
    setIngredientRows(newRows);

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

  const validateForm = (): boolean => {
    if (!formData.product_name_id) {
      toast.error('Please select a product name');
      return false;
    }

    if (formData.has_ingredients) {
      if (existingIngredients.length === 0 && ingredientRows.length === 0) {
        toast.error('Please add at least one ingredient for recipe-based products');
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

        const duplicateInNew = ingredientRows.findIndex(
          (r, idx) => idx !== i && r.raw_material_id === row.raw_material_id
        );
        if (duplicateInNew !== -1) {
          toast.error('Duplicate raw materials are not allowed');
          return false;
        }

        const duplicateInExisting = existingIngredients.find(
          e => e.raw_material_id === row.raw_material_id
        );
        if (duplicateInExisting) {
          toast.error('This raw material is already added to the template');
          return false;
        }
      }

      if (!formData.producible_quantity || parseFloat(formData.producible_quantity) <= 0) {
        toast.error('Please enter how many units can be produced with these ingredients');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore) return;
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedProduct = productNames.find(p => p.id === formData.product_name_id);
      if (!selectedProduct) {
        toast.error('Please select a product name');
        return;
      }

      const templateData = {
        name: selectedProduct.name,
        product_name_id: formData.product_name_id,
        unit: formData.unit,
        sku: formData.sku || null,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        has_ingredients: formData.has_ingredients,
        producible_quantity: formData.has_ingredients && formData.producible_quantity
          ? parseFloat(formData.producible_quantity)
          : null,
        store_id: currentStore.id,
      };

      let templateId = template?.id;

      if (template) {
        const { error } = await supabase
          .from('product_templates')
          .update(templateData)
          .eq('id', template.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('product_templates')
          .insert([templateData])
          .select()
          .single();

        if (error) throw error;
        templateId = data.id;
      }

      if (formData.has_ingredients && ingredientRows.length > 0 && templateId) {
        const ingredientsToInsert = ingredientRows.map(row => ({
          product_template_id: templateId,
          raw_material_id: row.raw_material_id,
          quantity_needed: parseFloat(row.quantity_needed),
          unit: row.unit,
          store_id: currentStore.id,
        }));

        const { error: ingredientsError } = await supabase
          .from('product_ingredients')
          .insert(ingredientsToInsert);

        if (ingredientsError) throw ingredientsError;
      }

      toast.success(template ? 'Product template updated successfully' : 'Product template created successfully');
      onClose();
    } catch (error: any) {
      console.error('Error saving template:', error);
      toast.error(error.message || 'Failed to save product template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-display font-bold text-secondary-900">
            {template ? 'Edit Product Template' : 'Add New Product Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Product Name *
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <SearchableSelect
                  options={productNames.map((product) => ({
                    value: product.id,
                    label: product.name,
                    subtitle: product.sku ? `SKU: ${product.sku}` : undefined,
                    badge: product.category || undefined,
                  }))}
                  value={formData.product_name_id}
                  onChange={(value) => setFormData({ ...formData, product_name_id: value })}
                  placeholder="Select Product Name"
                  searchPlaceholder="Search by name or SKU..."
                  disabled={!!template}
                />
              </div>
              {!template && (
                <button
                  type="button"
                  onClick={() => setShowAddProductName(true)}
                  className="px-4 py-2 bg-gray-100 text-secondary-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              )}
            </div>
          </div>

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

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-secondary-900 mb-3">
              Product Type *
            </h3>
            <p className="text-xs text-secondary-600 mb-4">
              Choose how this product is prepared
            </p>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-white"
                style={{
                  borderColor: formData.has_ingredients ? '#8b1a39' : '#e5e7eb',
                  backgroundColor: formData.has_ingredients ? '#fef2f2' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="has_ingredients"
                  checked={formData.has_ingredients}
                  onChange={() => setFormData({ ...formData, has_ingredients: true })}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-secondary-900 text-sm">
                    📦 Recipe-based (Manufactured)
                  </div>
                  <div className="text-xs text-secondary-600 mt-1">
                    Made from raw materials (e.g., Tea, Coffee, Juice)
                  </div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-white"
                style={{
                  borderColor: !formData.has_ingredients ? '#8b1a39' : '#e5e7eb',
                  backgroundColor: !formData.has_ingredients ? '#fef2f2' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="has_ingredients"
                  checked={!formData.has_ingredients}
                  onChange={() => setFormData({ ...formData, has_ingredients: false })}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-secondary-900 text-sm">
                    🛒 Simple Product (Purchased)
                  </div>
                  <div className="text-xs text-secondary-600 mt-1">
                    Bought ready-made (e.g., Biscuits, Samosas, Chips)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {formData.has_ingredients && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-secondary-900">Recipe Ingredients</h3>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-sm px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </button>
              </div>

              {existingIngredients.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-secondary-600 mb-2">Current Ingredients:</p>
                  <div className="space-y-2">
                    {existingIngredients.map((ingredient) => (
                      <div
                        key={ingredient.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg"
                      >
                        <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                          <span className="font-medium text-secondary-900">{ingredient.raw_material_name}</span>
                          <span className="text-secondary-600">{ingredient.quantity_needed} {ingredient.unit}</span>
                          <span className="text-secondary-500">Stock: {ingredient.available_stock} {ingredient.stock_unit}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteExisting(ingredient.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ingredientRows.length > 0 && (
                <div className="space-y-3">
                  {ingredientRows.map((row, index) => (
                    <div key={index} className="space-y-2">
                      <div className="grid grid-cols-12 gap-2">
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
                      {stockWarnings[index] && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">{stockWarnings[index]}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ingredientRows.length === 0 && existingIngredients.length === 0 && (
                <p className="text-xs text-secondary-500 text-center py-4">
                  No ingredients added yet. Click "Add Ingredient" to start.
                </p>
              )}

              {(ingredientRows.length > 0 || existingIngredients.length > 0) && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-secondary-900 mb-2">
                    Producible Quantity *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary-600">With the above ingredients, I can make</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.producible_quantity}
                      onChange={(e) => setFormData({ ...formData, producible_quantity: e.target.value })}
                      className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="50"
                    />
                    <span className="text-sm text-secondary-600">{formData.unit}</span>
                  </div>
                  <p className="text-xs text-secondary-500 mt-1">
                    Example: "With 2L milk + tea powder + sugar, I can make 50 cups"
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                SKU
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., TEA-001"
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-4 py-2 bg-gray-100 text-secondary-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                MRP (per {formData.unit})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

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
              {loading ? 'Saving...' : template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>

      {showAddProductName && (
        <AddProductNameModal
          onClose={() => setShowAddProductName(false)}
          onSuccess={handleProductNameAdded}
        />
      )}
    </div>
  );
}
