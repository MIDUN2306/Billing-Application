import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle, Layers, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { AddProductNameModal } from '../product-templates/AddProductNameModal';
import { RecipeBatch } from '../../types/database.types';
import toast from 'react-hot-toast';

interface ProductFormWithInlineDraftsProps {
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

interface DraftOption extends RecipeBatch {
  ingredient_count: number;
}

export function ProductFormWithInlineDrafts({ product, onClose }: ProductFormWithInlineDraftsProps) {
  const isEditMode = !!product;
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [availableDrafts, setAvailableDrafts] = useState<DraftOption[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string>('');
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [stockWarnings, setStockWarnings] = useState<{ [key: number]: string }>({});
  const [showAddProductName, setShowAddProductName] = useState(false);
  const [saveDraft, setSaveDraft] = useState(false);
  const [draftName, setDraftName] = useState('');
  
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

  useEffect(() => {
    if (formData.product_name_id) {
      loadAvailableDrafts();
    }
  }, [formData.product_name_id]);

  useEffect(() => {
    if (formData.product_type === 'manufactured' && ingredientRows.length > 0) {
      validateStock();
    }
  }, [formData.quantity_to_add, formData.producible_quantity, ingredientRows, formData.product_type]);

  const loadAvailableDrafts = async () => {
    if (!currentStore || !formData.product_name_id) return;

    try {
      const { data: templates, error: templatesError } = await supabase
        .from('product_templates')
        .select('id')
        .eq('product_name_id', formData.product_name_id)
        .eq('store_id', currentStore.id)
        .eq('is_active', true);

      if (templatesError) throw templatesError;

      if (!templates || templates.length === 0) {
        setAvailableDrafts([]);
        return;
      }

      const templateIds = templates.map(t => t.id);

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
        setAvailableDrafts([]);
        return;
      }

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
    } catch (error) {
      console.error('Error loading drafts:', error);
    }
  };

  const handleLoadDraft = async (draftId: string) => {
    if (!draftId || draftId === 'none') {
      setSelectedDraftId('');
      setIngredientRows([]);
      setFormData(prev => ({ ...prev, producible_quantity: '' }));
      return;
    }

    const draft = availableDrafts.find(d => d.id === draftId);
    if (!draft) return;

    try {
      const { data: ingredients, error } = await supabase
        .from('recipe_batch_ingredients')
        .select('*')
        .eq('recipe_batch_id', draftId)
        .eq('store_id', currentStore!.id);

      if (error) throw error;

      const ingredientRows: IngredientRow[] = (ingredients || []).map(ing => ({
        raw_material_id: ing.raw_material_id,
        quantity_needed: ing.quantity_needed.toString(),
        unit: ing.unit,
      }));

      setSelectedDraftId(draftId);
      setIngredientRows(ingredientRows);
      setFormData(prev => ({
        ...prev,
        producible_quantity: draft.producible_quantity.toString(),
        quantity_to_add: draft.producible_quantity.toString(),
      }));

      toast.success(`Loaded draft: ${draft.batch_name}`);
    } catch (error) {
      console.error('Error loading draft ingredients:', error);
      toast.error('Failed to load draft ingredients');
    }
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

        // Load draft information if product has ingredients
        if (template.has_ingredients) {
          // Try to find the draft/batch used for this template
          const { data: batches, error: batchError } = await supabase
            .from('recipe_batches')
            .select('*')
            .eq('product_template_id', template.id)
            .eq('store_id', currentStore.id)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .limit(1);

          if (!batchError && batches && batches.length > 0) {
            const batch = batches[0];
            setSelectedDraftId(batch.id);

            // Load ingredients for this batch
            const { data: ingredients, error: ingredientsError } = await supabase
              .from('recipe_batch_ingredients')
              .select('*')
              .eq('recipe_batch_id', batch.id)
              .eq('store_id', currentStore.id);

            if (!ingredientsError && ingredients) {
              const ingredientRows: IngredientRow[] = ingredients.map(ing => ({
                raw_material_id: ing.raw_material_id,
                quantity_needed: ing.quantity_needed.toString(),
                unit: ing.unit,
              }));
              setIngredientRows(ingredientRows);
            }
          }
        }
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
    
    setSelectedDraftId('');
    setIngredientRows([]);
    setStockWarnings({});
    setSaveDraft(false);
    setDraftName('');
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
      if (ingredientRows.length === 0) {
        toast.error('Please add at least one ingredient for manufactured products');
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

      if (!formData.producible_quantity || parseFloat(formData.producible_quantity) <= 0) {
        toast.error('Please enter how many units can be made with these ingredients');
        return false;
      }

      if (Object.keys(stockWarnings).length > 0) {
        toast.error('Insufficient stock for some ingredients');
        return false;
      }

      if (saveDraft && !draftName.trim()) {
        toast.error('Please enter a name for the draft');
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

        // Update ingredients if they exist
        if (ingredientRows.length > 0 && product.product_template_id) {
          // Update template's producible quantity
          if (formData.producible_quantity) {
            const { error: templateUpdateError } = await supabase
              .from('product_templates')
              .update({
                producible_quantity: parseFloat(formData.producible_quantity),
                updated_at: new Date().toISOString(),
              })
              .eq('id', product.product_template_id);

            if (templateUpdateError) throw templateUpdateError;
          }

          // Handle draft saving/updating
          if (saveDraft && draftName.trim()) {
            // Create new draft with modified ingredients
            const { data: newBatch, error: batchError } = await supabase
              .from('recipe_batches')
              .insert([{
                product_template_id: product.product_template_id,
                batch_name: draftName.trim(),
                producible_quantity: parseFloat(formData.producible_quantity),
                is_default: false,
                store_id: currentStore.id,
              }])
              .select()
              .single();

            if (batchError) throw batchError;

            // Insert ingredients for new draft
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

            toast.success(`Product updated and new draft "${draftName}" created successfully`);
          } else if (selectedDraftId) {
            // Update existing draft
            // Delete old ingredients
            await supabase
              .from('recipe_batch_ingredients')
              .delete()
              .eq('recipe_batch_id', selectedDraftId);

            // Insert updated ingredients
            const ingredientsToInsert = ingredientRows.map(row => ({
              recipe_batch_id: selectedDraftId,
              raw_material_id: row.raw_material_id,
              quantity_needed: parseFloat(row.quantity_needed),
              unit: row.unit,
              store_id: currentStore.id,
            }));

            const { error: ingredientsError } = await supabase
              .from('recipe_batch_ingredients')
              .insert(ingredientsToInsert);

            if (ingredientsError) throw ingredientsError;

            // Update batch's producible quantity
            if (formData.producible_quantity) {
              const { error: batchUpdateError } = await supabase
                .from('recipe_batches')
                .update({
                  producible_quantity: parseFloat(formData.producible_quantity),
                  updated_at: new Date().toISOString(),
                })
                .eq('id', selectedDraftId);

              if (batchUpdateError) throw batchUpdateError;
            }

            toast.success('Product and recipe updated successfully');
          } else {
            toast.success('Product updated successfully');
          }
        } else {
          toast.success('Product updated successfully');
        }

        onClose();
        return;
      }

      const quantityToAdd = parseFloat(formData.quantity_to_add);
      const isManufactured = formData.product_type === 'manufactured';

      let template;

      if (isManufactured && ingredientRows.length > 0) {
        const templateData = {
          name: formData.product_name.trim(),
          unit: formData.unit,
          sku: formData.sku || null,
          mrp: formData.mrp ? parseFloat(formData.mrp) : null,
          has_ingredients: true,
          producible_quantity: parseFloat(formData.producible_quantity),
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

        if (saveDraft && draftName.trim()) {
          const { data: newBatch, error: batchError } = await supabase
            .from('recipe_batches')
            .insert([{
              product_template_id: template.id,
              batch_name: draftName.trim(),
              producible_quantity: parseFloat(formData.producible_quantity),
              is_default: availableDrafts.length === 0,
              store_id: currentStore.id,
            }])
            .select()
            .single();

          if (batchError) throw batchError;

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

          toast.success(`Draft "${draftName}" saved successfully`);
        }

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
      } else {
        const templateData = {
          name: formData.product_name.trim(),
          unit: formData.unit,
          sku: formData.sku || null,
          mrp: formData.mrp ? parseFloat(formData.mrp) : null,
          has_ingredients: false,
          producible_quantity: null,
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

          {isEditMode && formData.product_name_id && availableDrafts.length > 1 && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-secondary-900">Switch Recipe Draft (Optional)</h3>
              </div>
              <select
                value={selectedDraftId}
                onChange={(e) => handleLoadDraft(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {availableDrafts.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.batch_name} - Makes {draft.producible_quantity} {formData.unit} ({draft.ingredient_count} ingredients)
                    {draft.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-2">
                💡 Switch to a different draft to load its ingredients, or edit the current one below
              </p>
            </div>
          )}

          {isEditMode && ingredientRows.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-medium text-secondary-900">Recipe Ingredients</h3>
                  {selectedDraftId && availableDrafts.length > 0 && (
                    <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                      {availableDrafts.find(d => d.id === selectedDraftId)?.batch_name || 'Draft'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={addIngredientRow}
                  className="text-sm px-3 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Ingredient
                </button>
              </div>

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
                  </div>
                ))}
              </div>

              {ingredientRows.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-secondary-900 mb-2">
                    Recipe Yield
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary-600">With the above ingredients, I can make</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.producible_quantity}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          producible_quantity: e.target.value
                        });
                      }}
                      className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="50"
                    />
                    <span className="text-sm text-secondary-600">{formData.unit}</span>
                  </div>
                </div>
              )}

              {ingredientRows.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveDraft}
                      onChange={(e) => setSaveDraft(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <Save className="w-4 h-4 text-secondary-600" />
                    <span className="text-sm font-medium text-secondary-900">
                      Save as new draft
                    </span>
                  </label>
                  {saveDraft && (
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter new draft name (e.g., Modified Recipe, Large Batch v2)"
                    />
                  )}
                  <p className="text-xs text-secondary-500 mt-2">
                    {saveDraft 
                      ? '💡 This will create a new draft without modifying the existing one' 
                      : '💡 Changes will update the current draft, or check above to save as new draft'}
                  </p>
                </div>
              )}
            </div>
          )}

          {isEditMode && ingredientRows.length === 0 && formData.product_name_id && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-medium text-secondary-900">Add Recipe Ingredients</h3>
              </div>
              <p className="text-sm text-secondary-600 mb-3">
                This product doesn't have ingredients yet. You can add them now.
              </p>
              {availableDrafts.length > 0 ? (
                <>
                  <select
                    value={selectedDraftId}
                    onChange={(e) => handleLoadDraft(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-3"
                  >
                    <option value="">Select a draft to load ingredients</option>
                    {availableDrafts.map((draft) => (
                      <option key={draft.id} value={draft.id}>
                        {draft.batch_name} - Makes {draft.producible_quantity} {formData.unit} ({draft.ingredient_count} ingredients)
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-secondary-500 text-center mb-2">or</p>
                </>
              ) : null}
              <button
                type="button"
                onClick={addIngredientRow}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Ingredients Manually
              </button>
            </div>
          )}

          {!isEditMode && formData.product_name_id && availableDrafts.length > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-medium text-secondary-900">Load Ingredient Draft (Optional)</h3>
              </div>
              <select
                value={selectedDraftId}
                onChange={(e) => handleLoadDraft(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="none">None - Enter ingredients manually</option>
                {availableDrafts.map((draft) => (
                  <option key={draft.id} value={draft.id}>
                    {draft.batch_name} - Makes {draft.producible_quantity} {formData.unit} ({draft.ingredient_count} ingredients)
                    {draft.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-2">
                💡 Load a saved draft to quickly populate ingredients, or enter them manually below
              </p>
            </div>
          )}

          {!isEditMode && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-secondary-900">Recipe Ingredients *</h3>
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
              ) : (
                <p className="text-xs text-secondary-500 text-center py-4">
                  No ingredients added yet. Click "Add Ingredient" to start.
                </p>
              )}

              {ingredientRows.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-secondary-900 mb-2">
                    Recipe Yield *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-secondary-600">With the above ingredients, I can make</span>
                    <input
                      type="number"
                      step="1"
                      min="1"
                      value={formData.producible_quantity}
                      onChange={(e) => {
                        const newYield = e.target.value;
                        setFormData({ 
                          ...formData, 
                          producible_quantity: newYield,
                          quantity_to_add: newYield || '1'
                        });
                      }}
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

              {ingredientRows.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveDraft}
                      onChange={(e) => setSaveDraft(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <Save className="w-4 h-4 text-secondary-600" />
                    <span className="text-sm font-medium text-secondary-900">
                      Save as draft for future use
                    </span>
                  </label>
                  {saveDraft && (
                    <input
                      type="text"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter draft name (e.g., Small Batch, 2L Milk Recipe)"
                    />
                  )}
                  <p className="text-xs text-secondary-500 mt-2">
                    💡 Save this ingredient combination to reuse it later
                  </p>
                </div>
              )}
            </div>
          )}

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

          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {ingredientRows.length > 0 ? 'Quantity to Produce *' : 'Quantity to Add *'}
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
              {formData.quantity_to_add && ingredientRows.length > 0 && formData.producible_quantity && (
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
                ? (isEditMode ? 'Updating...' : (ingredientRows.length > 0 ? 'Producing...' : 'Adding...'))
                : (isEditMode ? 'Update Product' : (ingredientRows.length > 0 ? 'Produce Product' : 'Add Product'))
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
