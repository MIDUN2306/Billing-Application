import { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { AddProductNameModal } from '../product-templates/AddProductNameModal';
import { RecipeBatch, RecipeBatchIngredient } from '../../types/database.types';
import toast from 'react-hot-toast';

interface ProductFormWithBatchesProps {
  product?: {
    id: string;
    name: string;
    sku: string | null;
    category_id: string | null;
    unit: string;
    mrp: number | null;
    quantity: number;
    product_template_id: string | null;
  } | null;
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
  raw_material_id: string;
  quantity_needed: string;
  unit: string;
}

interface ProductName {
  id: string;
  name: string;
  sku: string | null;
}

interface RecipeBatchOption extends RecipeBatch {
  ingredients: RecipeBatchIngredient[];
}

export function ProductFormWithBatches({ product, onClose }: ProductFormWithBatchesProps) {
  const isEditMode = !!product;
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [recipeBatches, setRecipeBatches] = useState<RecipeBatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [stockWarnings, setStockWarnings] = useState<{ [key: number]: string }>({});
  const [showAddProductName, setShowAddProductName] = useState(false);
  
  const [formData, setFormData] = useState({
    product_name_id: '',
    product_name: '',
    unit: 'pcs',
    sku: '',
    mrp: '',
    product_type: 'manufactured',
    producible_quantity: '',
    quantity_to_add: '1',
  });

  useEffect(() => {
    loadRawMaterials();
    loadProductNames();
    
    if (isEditMode && product) {
      loadProductData();
    }
  }, []);

  // Load recipe batches when product name changes
  useEffect(() => {
    if (formData.product_name_id && !isEditMode) {
      loadRecipeBatches();
    }
  }, [formData.product_name_id]);

  const loadRecipeBatches = async () => {
    if (!currentStore || !formData.product_name_id) return;

    try {
      // Find templates for this product name
      const { data: templates, error: templatesError } = await supabase
        .from('product_templates')
        .select('id')
        .eq('product_name_id', formData.product_name_id)
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        setRecipeBatches([]);
        return;
      }

      const templateIds = templates.map(t => t.id);

      // Load all batches for these templates
      const { data: batches, error: batchesError } = await supabase
        .from('recipe_batches')
        .select('*')
        .in('product_template_id', templateIds)
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('batch_name');

      if (batchesError) throw batchesError;

      if (!batches || batches.length === 0) {
        setRecipeBatches([]);
        return;
      }

      // Load ingredients for each batch
      const batchesWithIngredients: RecipeBatchOption[] = await Promise.all(
        batches.map(async (batch) => {
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

      setRecipeBatches(batchesWithIngredients);

      // Auto-select if only one batch or if there's a default
      if (batchesWithIngredients.length === 1) {
        handleBatchSelection(batchesWithIngredients[0].id);
      } else {
        const defaultBatch = batchesWithIngredients.find(b => b.is_default);
        if (defaultBatch) {
          handleBatchSelection(defaultBatch.id);
        }
      }
    } catch (error) {
      console.error('Error loading recipe batches:', error);
    }
  };

  const handleBatchSelection = (batchId: string) => {
    const batch = recipeBatches.find(b => b.id === batchId);
    if (!batch) return;

    setSelectedBatchId(batchId);

    // Populate ingredients from batch
    const ingredients: IngredientRow[] = batch.ingredients.map(ing => ({
      raw_material_id: ing.raw_material_id,
      quantity_needed: ing.quantity_needed.toString(),
      unit: ing.unit,
    }));

    setIngredientRows(ingredients);

    // Set producible quantity
    setFormData(prev => ({
      ...prev,
      producible_quantity: batch.producible_quantity.toString(),
      quantity_to_add: batch.producible_quantity.toString(), // Auto-fill with batch yield
    }));
  };

  const loadProductData = async () => {
    if (!product || !currentStore) return;

    try {
      if (product.product_template_id) {
        const { data: template, error: templateError } = await supabase
          .from('product_templates')
          .select('*, product_names(id, name, sku)')
          .eq('id', product.product_template_id)
          .single();

        if (templateError) throw templateError;

        setFormData({
          product_name_id: template.product_name_id || '',
          product_name: product.name,
          unit: product.unit,
          sku: product.sku || '',
          mrp: product.mrp?.toString() || '',
          product_type: template.has_ingredients ? 'manufactured' : 'simple',
          producible_quantity: template.producible_quantity?.toString() || '',
          quantity_to_add: product.quantity.toString(),
        });
      } else {
        setFormData({
          product_name_id: '',
          product_name: product.name,
          unit: product.unit,
          sku: product.sku || '',
          mrp: product.mrp?.toString() || '',
          product_type: 'simple',
          producible_quantity: '',
          quantity_to_add: product.quantity.toString(),
        });
      }
    } catch (error) {
      console.error('Error loading product data:', error);
      toast.error('Failed to load product data');
    }
  };

  useEffect(() => {
    if (formData.product_type === 'manufactured' && ingredientRows.length > 0) {
      validateStock();
    }
  }, [formData.quantity_to_add, formData.producible_quantity, ingredientRows, formData.product_type]);

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

  const loadProductNames = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('product_names')
        .select('id, name, sku')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProductNames(data || []);
    } catch (error) {
      console.error('Error loading product names:', error);
    }
  };

  const generateSKU = () => {
    if (!formData.product_name) {
      toast.error('Please select product name first');
      return;
    }
    const prefix = formData.product_name.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    setFormData({ ...formData, sku: `${prefix}-${random}` });
  };

  const handleProductNameChange = (productNameId: string) => {
    const selectedName = productNames.find(pn => pn.id === productNameId);
    setFormData({
      ...formData,
      product_name_id: productNameId,
      product_name: selectedName?.name || '',
      sku: selectedName?.sku || formData.sku,
    });
    
    // Reset batch selection and ingredients
    setSelectedBatchId('');
    setIngredientRows([]);
    setStockWarnings({});
  };

  const handleAddProductNameSuccess = async (newProductNameId: string) => {
    await loadProductNames();
    
    try {
      const { data, error } = await supabase
        .from('product_names')
        .select('id, name, sku')
        .eq('id', newProductNameId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        setFormData({
          ...formData,
          product_name_id: data.id,
          product_name: data.name,
          sku: data.sku || formData.sku,
        });
      }
    } catch (error) {
      console.error('Error fetching new product name:', error);
    }
  };

  const validateStock = () => {
    if (ingredientRows.length === 0) {
      setStockWarnings({});
      return;
    }

    const newWarnings: { [key: number]: string } = {};
    const hasRecipeYield = formData.producible_quantity && formData.quantity_to_add;
    const quantityToAdd = hasRecipeYield ? parseFloat(formData.quantity_to_add) : 0;
    const producibleQty = hasRecipeYield ? parseFloat(formData.producible_quantity) : 0;
    const canCalculateBatch = hasRecipeYield && 
                              !isNaN(quantityToAdd) && 
                              !isNaN(producibleQty) && 
                              quantityToAdd > 0 && 
                              producibleQty > 0;

    ingredientRows.forEach((row, index) => {
      if (row.raw_material_id && row.quantity_needed) {
        const material = rawMaterials.find(m => m.id === row.raw_material_id);
        if (material) {
          const quantityNeeded = parseFloat(row.quantity_needed);
          if (!isNaN(quantityNeeded) && quantityNeeded > 0) {
            let totalNeeded = quantityNeeded;
            
            if (canCalculateBatch) {
              const batchRatio = quantityToAdd / producibleQty;
              totalNeeded = quantityNeeded * batchRatio;
            }
            
            if (totalNeeded > material.quantity) {
              const shortage = totalNeeded - material.quantity;
              newWarnings[index] = `Need ${totalNeeded.toFixed(2)} ${material.unit}, have only ${material.quantity} ${material.unit} (short by ${shortage.toFixed(2)} ${material.unit})`;
            }
          }
        }
      }
    });

    setStockWarnings(newWarnings);
  };

  const validateForm = (): boolean => {
    if (!formData.product_name.trim()) {
      toast.error('Please select product name');
      return false;
    }

    if (!isEditMode) {
      if (!formData.quantity_to_add || parseFloat(formData.quantity_to_add) <= 0) {
        toast.error('Please enter quantity to add');
        return false;
      }
    }

    if (formData.product_type === 'manufactured' && !isEditMode) {
      if (!selectedBatchId && recipeBatches.length > 0) {
        toast.error('Please select a recipe batch');
        return false;
      }

      if (ingredientRows.length === 0) {
        toast.error('Please add at least one ingredient for manufactured products');
        return false;
      }

      if (!formData.producible_quantity || parseFloat(formData.producible_quantity) <= 0) {
        toast.error('Please enter how many units can be made with these ingredients');
        return false;
      }

      if (Object.keys(stockWarnings).length > 0) {
        toast.error('Insufficient stock for some ingredients');
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
      if (isEditMode && product) {
        const updateData: any = {
          name: formData.product_name.trim(),
          unit: formData.unit,
          sku: formData.sku || null,
          mrp: formData.mrp ? parseFloat(formData.mrp) : null,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', product.id);

        if (updateError) throw updateError;

        toast.success('Product updated successfully');
        onClose();
        return;
      }

      const quantityToAdd = parseFloat(formData.quantity_to_add);
      const isManufactured = formData.product_type === 'manufactured';

      // Get the selected batch's template
      let template;
      if (selectedBatchId) {
        const selectedBatch = recipeBatches.find(b => b.id === selectedBatchId);
        if (selectedBatch) {
          const { data: existingTemplate, error: templateError } = await supabase
            .from('product_templates')
            .select('*')
            .eq('id', selectedBatch.product_template_id)
            .single();

          if (templateError) throw templateError;
          template = existingTemplate;
        }
      }

      // If no template from batch, create new one (for new recipes)
      if (!template) {
        const templateData = {
          name: formData.product_name.trim(),
          unit: formData.unit,
          sku: formData.sku || null,
          mrp: formData.mrp ? parseFloat(formData.mrp) : null,
          has_ingredients: isManufactured,
          producible_quantity: isManufactured && formData.producible_quantity 
            ? parseFloat(formData.producible_quantity) 
            : null,
          store_id: currentStore.id,
          product_name_id: formData.product_name_id || null,
        };

        const { data: newTemplate, error: templateError } = await supabase
          .from('product_templates')
          .insert([templateData])
          .select()
          .single();

        if (templateError) throw templateError;
        template = newTemplate;
      }

      // Deduct raw materials based on batch
      if (isManufactured && ingredientRows.length > 0) {
        const batchRatio = quantityToAdd / parseFloat(formData.producible_quantity);

        for (const row of ingredientRows) {
          const totalNeeded = parseFloat(row.quantity_needed) * batchRatio;
          
          const { data: stockData, error: stockError } = await supabase
            .from('raw_material_stock')
            .select('quantity')
            .eq('raw_material_id', row.raw_material_id)
            .eq('store_id', currentStore.id)
            .single();

          if (stockError) throw stockError;

          const { error: updateError } = await supabase
            .from('raw_material_stock')
            .update({
              quantity: stockData.quantity - totalNeeded,
              updated_at: new Date().toISOString(),
            })
            .eq('raw_material_id', row.raw_material_id)
            .eq('store_id', currentStore.id);

          if (updateError) throw updateError;
        }
      }

      // Create product
      const productData = {
        product_template_id: template.id,
        name: formData.product_name.trim(),
        category_id: null,
        unit: formData.unit,
        sku: formData.sku || null,
        mrp: formData.mrp ? parseFloat(formData.mrp) : null,
        quantity: quantityToAdd,
        store_id: currentStore.id,
      };

      const { error: productError } = await supabase
        .from('products')
        .insert([productData]);

      if (productError) throw productError;

      const actionText = isManufactured ? 'produced' : 'added';
      toast.success(`Successfully ${actionText} ${quantityToAdd} ${formData.unit} of ${formData.product_name}`);
      onClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-display font-bold text-secondary-900">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Product Name *
            </label>
            {isEditMode ? (
              <input
                type="text"
                required
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            ) : (
              <>
                <div className="flex gap-2">
                  <select
                    required
                    value={formData.product_name_id}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  >
                    <option value="">Select Product Name</option>
                    {productNames.map((pn) => (
                      <option key={pn.id} value={pn.id}>
                        {pn.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddProductName(true)}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    title="Add New Product Name"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product
                  </button>
                </div>
                <p className="text-xs text-secondary-500 mt-1">
                  Select from existing products or add a new one
                </p>
              </>
            )}
          </div>

          {/* Recipe Batch Selection */}
          {!isEditMode && formData.product_name_id && recipeBatches.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-secondary-900">Select Recipe Batch *</h3>
              </div>
              <select
                required
                value={selectedBatchId}
                onChange={(e) => handleBatchSelection(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Choose a recipe batch...</option>
                {recipeBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batch_name} - Makes {batch.producible_quantity} {formData.unit}
                    {batch.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-2">
                💡 Different batches use different ingredient quantities
              </p>
            </div>
          )}

          {/* Ingredients Display (Read-only when batch is selected) */}
          {!isEditMode && selectedBatchId && ingredientRows.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="text-sm font-medium text-secondary-900 mb-3">Recipe Ingredients</h3>
              <div className="space-y-2">
                {ingredientRows.map((row, index) => {
                  const material = rawMaterials.find(m => m.id === row.raw_material_id);
                  return (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-secondary-900">
                          {material?.name || 'Unknown'}
                        </span>
                        <span className="text-sm text-secondary-600 ml-2">
                          - {row.quantity_needed} {row.unit}
                        </span>
                      </div>
                      {stockWarnings[index] && (
                        <div className="flex items-center gap-1 text-xs text-yellow-700">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Low stock</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-blue-600 mt-3">
                Makes {formData.producible_quantity} {formData.unit} with these ingredients
              </p>
            </div>
          )}

          {/* Unit Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Unit *
            </label>
            <select
              required
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={!!selectedBatchId}
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

          {/* Quantity to Produce */}
          {!isEditMode && selectedBatchId && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Quantity to Produce *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={formData.quantity_to_add}
                onChange={(e) => setFormData({ ...formData, quantity_to_add: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
              {formData.quantity_to_add && formData.producible_quantity && (
                <p className="text-xs text-secondary-500 mt-1">
                  {parseFloat(formData.quantity_to_add) !== parseFloat(formData.producible_quantity) ? (
                    <>
                      This will produce {formData.quantity_to_add} {formData.unit} 
                      {` (${(parseFloat(formData.quantity_to_add) / parseFloat(formData.producible_quantity)).toFixed(2)}× the recipe)`}
                    </>
                  ) : (
                    `This will produce ${formData.quantity_to_add} ${formData.unit} (1× the recipe)`
                  )}
                </p>
              )}
            </div>
          )}

          {/* SKU and MRP */}
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
                Price per {formData.unit}
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

          {/* Stock Warning Summary */}
          {!isEditMode && Object.keys(stockWarnings).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-1">Cannot Produce - Insufficient Stock</p>
                  <p className="text-xs text-red-700">
                    Please reduce ingredient quantities or add more stock before producing.
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
              disabled={loading || (!isEditMode && Object.keys(stockWarnings).length > 0)}
            >
              {loading 
                ? (isEditMode ? 'Updating...' : 'Producing...')
                : (isEditMode ? 'Update Product' : 'Produce Product')
              }
            </button>
          </div>
        </form>
      </div>

      {showAddProductName && (
        <AddProductNameModal
          onClose={() => setShowAddProductName(false)}
          onSuccess={handleAddProductNameSuccess}
        />
      )}
    </div>
  );
}
