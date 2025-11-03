import { useState, useEffect } from 'react';
import { X, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { AddProductNameModal } from '../product-templates/AddProductNameModal';
import toast from 'react-hot-toast';

interface ProductFormSimplifiedProps {
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

export function ProductFormSimplified({ product, onClose }: ProductFormSimplifiedProps) {
  const isEditMode = !!product;
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [rawMaterials, setRawMaterials] = useState<RawMaterialWithStock[]>([]);
  const [productNames, setProductNames] = useState<ProductName[]>([]);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);
  const [stockWarnings, setStockWarnings] = useState<{ [key: number]: string }>({});
  const [showAddProductName, setShowAddProductName] = useState(false);
  
  const [formData, setFormData] = useState({
    product_name_id: '',
    product_name: '',
    unit: 'pcs',
    sku: '',
    mrp: '',
    product_type: 'manufactured', // 'manufactured' or 'simple'
    producible_quantity: '',
    quantity_to_add: '1',
  });

  useEffect(() => {
    loadRawMaterials();
    loadProductNames();
    
    // Load product data if editing
    if (isEditMode && product) {
      loadProductData();
    }
  }, []);

  const loadProductData = async () => {
    if (!product || !currentStore) return;

    try {
      // Get product template info
      if (product.product_template_id) {
        const { data: template, error: templateError } = await supabase
          .from('product_templates')
          .select('*, product_names(id, name, sku)')
          .eq('id', product.product_template_id)
          .single();

        if (templateError) throw templateError;

        // Check if product has ingredients
        const { data: ingredients, error: ingredientsError } = await supabase
          .from('product_ingredients')
          .select('raw_material_id, quantity_needed, unit')
          .eq('product_template_id', product.product_template_id)
          .eq('store_id', currentStore.id);

        if (ingredientsError) throw ingredientsError;

        const hasIngredients = ingredients && ingredients.length > 0;

        setFormData({
          product_name_id: template.product_name_id || '',
          product_name: product.name,
          unit: product.unit,
          sku: product.sku || '',
          mrp: product.mrp?.toString() || '',
          product_type: hasIngredients ? 'manufactured' : 'simple',
          producible_quantity: template.producible_quantity?.toString() || '',
          quantity_to_add: product.quantity.toString(),
        });

        // Load ingredients if they exist
        if (hasIngredients) {
          const ingredientRows = ingredients.map((ing: any) => ({
            raw_material_id: ing.raw_material_id,
            quantity_needed: ing.quantity_needed.toString(),
            unit: ing.unit,
          }));
          setIngredientRows(ingredientRows);
        }
      } else {
        // Simple product without template
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
      // Auto-populate SKU if the product name has one
      sku: selectedName?.sku || formData.sku,
    });
  };

  const handleAddProductNameSuccess = async (newProductNameId: string) => {
    // Reload product names
    await loadProductNames();
    
    // Fetch the newly added product name directly
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
          // Auto-populate SKU if the product name has one
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
    
    // Re-validate stock for this ingredient if quantity is already entered
    if (newRows[index].quantity_needed && material) {
      const quantityNeeded = parseFloat(newRows[index].quantity_needed);
      
      if (!isNaN(quantityNeeded) && quantityNeeded > 0) {
        // Check against recipe yield if available
        if (formData.producible_quantity && formData.quantity_to_add) {
          const quantityToAdd = parseFloat(formData.quantity_to_add);
          const producibleQty = parseFloat(formData.producible_quantity);
          if (!isNaN(quantityToAdd) && !isNaN(producibleQty) && producibleQty > 0 && quantityToAdd > 0) {
            const batchRatio = quantityToAdd / producibleQty;
            const totalNeeded = quantityNeeded * batchRatio;
            
            const newWarnings = { ...stockWarnings };
            if (totalNeeded > material.quantity) {
              const shortage = totalNeeded - material.quantity;
              newWarnings[index] = `Need ${totalNeeded.toFixed(2)} ${material.unit}, have only ${material.quantity} ${material.unit} (short by ${shortage.toFixed(2)} ${material.unit})`;
            } else {
              delete newWarnings[index];
            }
            setStockWarnings(newWarnings);
            return;
          }
        }
        
        // ALWAYS check ingredient quantity against available stock
        const newWarnings = { ...stockWarnings };
        if (quantityNeeded > material.quantity) {
          const shortage = quantityNeeded - material.quantity;
          newWarnings[index] = `Need ${quantityNeeded.toFixed(2)} ${material.unit}, have only ${material.quantity} ${material.unit} (short by ${shortage.toFixed(2)} ${material.unit})`;
        } else {
          delete newWarnings[index];
        }
        setStockWarnings(newWarnings);
      }
    } else {
      // Clear warning if no quantity entered yet
      const newWarnings = { ...stockWarnings };
      delete newWarnings[index];
      setStockWarnings(newWarnings);
    }
  };

  const handleQuantityChange = (index: number, value: string) => {
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    const newRows = [...ingredientRows];
    newRows[index] = {
      ...newRows[index],
      quantity_needed: value,
    };
    setIngredientRows(newRows);

    // Clear warning if value is empty or invalid
    if (!value) {
      const newWarnings = { ...stockWarnings };
      delete newWarnings[index];
      setStockWarnings(newWarnings);
      return;
    }

    // Validate stock immediately for this ingredient
    if (newRows[index].raw_material_id) {
      const material = rawMaterials.find(m => m.id === newRows[index].raw_material_id);
      if (material) {
        const quantityNeeded = parseFloat(value);
        
        if (!isNaN(quantityNeeded) && quantityNeeded > 0) {
          // Check against recipe yield if available
          if (formData.producible_quantity && formData.quantity_to_add) {
            const quantityToAdd = parseFloat(formData.quantity_to_add);
            const producibleQty = parseFloat(formData.producible_quantity);
            if (!isNaN(quantityToAdd) && !isNaN(producibleQty) && producibleQty > 0 && quantityToAdd > 0) {
              const batchRatio = quantityToAdd / producibleQty;
              const totalNeeded = quantityNeeded * batchRatio;
              
              const newWarnings = { ...stockWarnings };
              if (totalNeeded > material.quantity) {
                const shortage = totalNeeded - material.quantity;
                newWarnings[index] = `Need ${totalNeeded.toFixed(2)} ${material.unit}, have only ${material.quantity} ${material.unit} (short by ${shortage.toFixed(2)} ${material.unit})`;
              } else {
                delete newWarnings[index];
              }
              setStockWarnings(newWarnings);
              return;
            }
          }
          
          // ALWAYS check ingredient quantity against available stock
          // This is the base validation that should ALWAYS run
          const newWarnings = { ...stockWarnings };
          if (quantityNeeded > material.quantity) {
            const shortage = quantityNeeded - material.quantity;
            newWarnings[index] = `Need ${quantityNeeded.toFixed(2)} ${material.unit}, have only ${material.quantity} ${material.unit} (short by ${shortage.toFixed(2)} ${material.unit})`;
          } else {
            delete newWarnings[index];
          }
          setStockWarnings(newWarnings);
        } else {
          // Clear warning if quantity is invalid
          const newWarnings = { ...stockWarnings };
          delete newWarnings[index];
          setStockWarnings(newWarnings);
        }
      }
    }
  };

  const validateStock = () => {
    if (ingredientRows.length === 0) {
      setStockWarnings({});
      return;
    }

    const newWarnings: { [key: number]: string } = {};

    // Check if we have recipe yield and quantity to produce for batch calculation
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
            
            // If we can calculate batch ratio, use it
            if (canCalculateBatch) {
              const batchRatio = quantityToAdd / producibleQty;
              totalNeeded = quantityNeeded * batchRatio;
            }
            
            // Check if we have enough stock
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

        // Check for duplicates
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

      // Check stock availability
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
      // Handle edit mode
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

      // Handle create mode
      const quantityToAdd = parseFloat(formData.quantity_to_add);
      const isManufactured = formData.product_type === 'manufactured';

      // Step 1: Check if template already exists, or create new one
      let template;
      
      // Try to find existing template by product_name_id and matching characteristics
      if (formData.product_name_id) {
        const { data: existingTemplates } = await supabase
          .from('product_templates')
          .select('*')
          .eq('product_name_id', formData.product_name_id)
          .eq('store_id', currentStore.id)
          .eq('unit', formData.unit)
          .eq('has_ingredients', isManufactured)
          .eq('is_active', true);

        // Find a matching template
        if (existingTemplates && existingTemplates.length > 0) {
          // For manufactured products, check if ingredients match
          if (isManufactured && ingredientRows.length > 0) {
            // Check each template to see if ingredients match
            for (const tmpl of existingTemplates) {
              const { data: existingIngredients } = await supabase
                .from('product_ingredients')
                .select('raw_material_id, quantity_needed, unit')
                .eq('product_template_id', tmpl.id)
                .eq('store_id', currentStore.id);

              // Check if ingredients match
              if (existingIngredients && existingIngredients.length === ingredientRows.length) {
                const ingredientsMatch = ingredientRows.every(row => {
                  return existingIngredients.some(existing => 
                    existing.raw_material_id === row.raw_material_id &&
                    parseFloat(existing.quantity_needed) === parseFloat(row.quantity_needed) &&
                    existing.unit === row.unit
                  );
                });

                if (ingredientsMatch && 
                    parseFloat(tmpl.producible_quantity) === parseFloat(formData.producible_quantity)) {
                  template = tmpl;
                  break;
                }
              }
            }
          } else {
            // For simple products, just use the first matching template
            template = existingTemplates[0];
          }
        }
      }

      // If no matching template found, create a new one
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

      // Step 2: Add ingredients if manufactured (only if template is new)
      if (isManufactured && ingredientRows.length > 0) {
        // Check if ingredients already exist for this template
        const { data: existingIngredients } = await supabase
          .from('product_ingredients')
          .select('id')
          .eq('product_template_id', template.id)
          .limit(1);

        // Only insert ingredients if they don't exist
        if (!existingIngredients || existingIngredients.length === 0) {
          const ingredientsToInsert = ingredientRows.map(row => ({
            product_template_id: template.id,
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

        // Step 3: Deduct raw materials
        const batchRatio = quantityToAdd / parseFloat(formData.producible_quantity);

        for (const row of ingredientRows) {
          const totalNeeded = parseFloat(row.quantity_needed) * batchRatio;
          
          // Get current stock
          const { data: stockData, error: stockError } = await supabase
            .from('raw_material_stock')
            .select('quantity')
            .eq('raw_material_id', row.raw_material_id)
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
            .eq('raw_material_id', row.raw_material_id)
            .eq('store_id', currentStore.id);

          if (updateError) throw updateError;
        }
      }

      // Step 4: Create product
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
        {/* Header */}
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

        {/* Form */}
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

          {/* Product Type Selection - Only show in create mode */}
          {!isEditMode && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-medium text-secondary-900 mb-3">
                Product Type *
              </h3>
              <p className="text-xs text-secondary-600 mb-4">
                How is this product prepared?
              </p>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors hover:bg-white"
                  style={{
                    borderColor: formData.product_type === 'manufactured' ? '#8b1a39' : '#e5e7eb',
                    backgroundColor: formData.product_type === 'manufactured' ? '#fef2f2' : 'transparent'
                  }}
                >
                  <input
                    type="radio"
                    name="product_type"
                    checked={formData.product_type === 'manufactured'}
                    onChange={() => setFormData({ ...formData, product_type: 'manufactured' })}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-secondary-900 text-sm">
                      📦 Manufactured (Made from ingredients)
                    </div>
                    <div className="text-xs text-secondary-600 mt-1">
                      Made from raw materials (e.g., Tea, Coffee, Juice)
                    </div>
                  </div>
                </label>


              </div>
            </div>
          )}

          {/* Ingredients Section - Only for Manufactured and Create Mode */}
          {formData.product_type === 'manufactured' && !isEditMode && (
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
                          // Auto-populate quantity to produce with recipe yield
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
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    💡 Quantity to produce will be auto-filled with this value
                  </p>
                </div>
              )}
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

          {/* Quantity to Add - Only in create mode */}
          {!isEditMode && (
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                {formData.product_type === 'manufactured' ? 'Quantity to Produce *' : 'Quantity to Add *'}
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
              {formData.quantity_to_add && formData.product_type === 'manufactured' && (
                <p className="text-xs text-secondary-500 mt-1">
                  {formData.producible_quantity && parseFloat(formData.quantity_to_add) !== parseFloat(formData.producible_quantity) ? (
                    <>
                      This will produce {formData.quantity_to_add} {formData.unit} 
                      {formData.producible_quantity && ` (${(parseFloat(formData.quantity_to_add) / parseFloat(formData.producible_quantity)).toFixed(2)}× the recipe)`}
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

          {/* Stock Warning Summary - Only in create mode */}
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
              title={!isEditMode && Object.keys(stockWarnings).length > 0 ? 'Insufficient stock for some ingredients' : ''}
            >
              {loading 
                ? (isEditMode ? 'Updating...' : (formData.product_type === 'manufactured' ? 'Producing...' : 'Adding...'))
                : (isEditMode ? 'Update Product' : (formData.product_type === 'manufactured' ? 'Produce Product' : 'Add Product'))
              }
            </button>
          </div>
        </form>
      </div>

      {/* Add Product Name Modal */}
      {showAddProductName && (
        <AddProductNameModal
          onClose={() => setShowAddProductName(false)}
          onSuccess={handleAddProductNameSuccess}
        />
      )}
    </div>
  );
}
