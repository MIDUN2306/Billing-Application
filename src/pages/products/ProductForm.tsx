import { useState, useEffect } from 'react';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductTemplateWithDetails, ProductIngredientWithDetails } from '../../types/database.types';
import { ProductTemplateForm } from '../product-templates/ProductTemplateForm';
import toast from 'react-hot-toast';

interface ProductFormProps {
  product?: any;
  onClose: () => void;
}

interface StockValidation {
  isValid: boolean;
  errors: string[];
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const { currentStore } = useStoreStore();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ProductTemplateWithDetails[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplateWithDetails | null>(null);
  const [ingredients, setIngredients] = useState<ProductIngredientWithDetails[]>([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [stockValidation, setStockValidation] = useState<StockValidation>({ isValid: true, errors: [] });
  
  const [formData, setFormData] = useState({
    product_template_id: product?.product_template_id || '',
    quantity: product?.quantity?.toString() || '1',
    mrp: product?.mrp?.toString() || '',
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (formData.product_template_id) {
      loadTemplateDetails(formData.product_template_id);
    }
  }, [formData.product_template_id]);

  useEffect(() => {
    if (formData.quantity && selectedTemplate?.has_ingredients && ingredients.length > 0) {
      validateStock();
    }
  }, [formData.quantity, ingredients, selectedTemplate]);

  const loadTemplates = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('v_product_templates_with_ingredients')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadTemplateDetails = async (templateId: string) => {
    if (!currentStore) return;

    try {
      // Load template details
      const { data: templateData, error: templateError } = await supabase
        .from('v_product_templates_with_ingredients')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) throw templateError;
      setSelectedTemplate(templateData);

      // Load ingredients only if template has ingredients
      if (templateData.has_ingredients) {
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('v_product_ingredient_details')
          .select('*')
          .eq('product_template_id', templateId)
          .eq('store_id', currentStore.id);

        if (ingredientsError) throw ingredientsError;
        setIngredients(ingredientsData || []);
      } else {
        setIngredients([]);
      }

      // Auto-fill MRP if not already set
      if (!formData.mrp && templateData.mrp) {
        setFormData(prev => ({ ...prev, mrp: templateData.mrp.toString() }));
      }
    } catch (error) {
      console.error('Error loading template details:', error);
    }
  };

  const validateStock = async () => {
    if (!currentStore || !formData.quantity || !selectedTemplate?.has_ingredients || ingredients.length === 0) {
      setStockValidation({ isValid: true, errors: [] });
      return;
    }

    const quantityToProduce = parseInt(formData.quantity);
    if (isNaN(quantityToProduce) || quantityToProduce <= 0) {
      setStockValidation({ isValid: true, errors: [] });
      return;
    }

    const errors: string[] = [];
    const batchRatio = quantityToProduce / (selectedTemplate.producible_quantity || 1);

    for (const ingredient of ingredients) {
      const totalNeeded = ingredient.quantity_needed * batchRatio;
      if (totalNeeded > ingredient.available_stock) {
        errors.push(
          `${ingredient.raw_material_name}: need ${totalNeeded.toFixed(2)} ${ingredient.unit}, have ${ingredient.available_stock} ${ingredient.unit}`
        );
      }
    }

    setStockValidation({
      isValid: errors.length === 0,
      errors,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStore || !selectedTemplate) return;

    // For recipe-based products, validate stock
    if (selectedTemplate.has_ingredients) {
      if (!stockValidation.isValid) {
        toast.error('Insufficient stock to create this product');
        return;
      }

      if (ingredients.length === 0) {
        toast.error('This template has no ingredients. Please add ingredients first.');
        return;
      }
    }

    setLoading(true);
    try {
      const quantityToProduce = parseInt(formData.quantity);

      // For recipe-based products: Deduct raw material stock
      if (selectedTemplate.has_ingredients && selectedTemplate.producible_quantity) {
        const batchRatio = quantityToProduce / selectedTemplate.producible_quantity;

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

      // Create product
      const productData = {
        product_template_id: selectedTemplate.id,
        name: selectedTemplate.name,
        category_id: selectedTemplate.category_id,
        unit: selectedTemplate.unit,
        sku: selectedTemplate.sku,
        mrp: formData.mrp ? parseFloat(formData.mrp) : selectedTemplate.mrp,
        quantity: quantityToProduce,
        store_id: currentStore.id,
      };

      const { error: productError } = await supabase
        .from('products')
        .insert([productData]);

      if (productError) throw productError;

      const actionText = selectedTemplate.has_ingredients ? 'produced' : 'added';
      toast.success(`Successfully ${actionText} ${quantityToProduce} ${selectedTemplate.unit} of ${selectedTemplate.name}`);
      onClose();
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateFormClose = () => {
    setShowTemplateForm(false);
    loadTemplates();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-display font-bold text-secondary-900">
            {product ? 'Edit Product' : 'Add New Product'}
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
          {/* Product Template Selection */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Product Template *
            </label>
            <div className="flex gap-2">
              <select
                required
                value={formData.product_template_id}
                onChange={(e) => setFormData({ ...formData, product_template_id: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={!!product}
              >
                <option value="">Select Product Template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.sku && `(${template.sku})`}
                    {template.has_ingredients ? ` - ${template.ingredient_count} ingredients` : ' - Simple Product'}
                  </option>
                ))}
              </select>
              {!product && (
                <button
                  type="button"
                  onClick={() => setShowTemplateForm(true)}
                  className="px-4 py-2 bg-gray-100 text-secondary-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New
                </button>
              )}
            </div>
          </div>

          {/* Template Details */}
          {selectedTemplate && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-secondary-700">Template Details</h3>
                {selectedTemplate.has_ingredients ? (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                    📦 Recipe-based
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    🛒 Simple Product
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-secondary-500">SKU</p>
                  <p className="text-sm font-medium text-secondary-900">{selectedTemplate.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Category</p>
                  <p className="text-sm font-medium text-secondary-900">{selectedTemplate.category_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Unit</p>
                  <p className="text-sm font-medium text-secondary-900">{selectedTemplate.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Template MRP</p>
                  <p className="text-sm font-medium text-secondary-900">
                    {selectedTemplate.mrp ? `₹${selectedTemplate.mrp.toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>

              {/* Recipe Details (Only for recipe-based products) */}
              {selectedTemplate.has_ingredients && selectedTemplate.producible_quantity && (
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-secondary-600 mb-2">
                    Recipe makes: <span className="font-medium text-secondary-900">{selectedTemplate.producible_quantity} {selectedTemplate.unit}</span>
                  </p>
                  
                  {ingredients.length > 0 && (
                    <div>
                      <p className="text-xs text-secondary-500 mb-2">Ingredients per batch:</p>
                      <div className="space-y-1">
                        {ingredients.map((ing) => (
                          <div key={ing.id} className="flex justify-between text-xs">
                            <span className="text-secondary-700">{ing.raw_material_name}</span>
                            <span className="text-secondary-600">
                              {ing.quantity_needed} {ing.unit} 
                              <span className="text-secondary-400 ml-2">
                                (Stock: {ing.available_stock} {ing.unit})
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quantity Field */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              {selectedTemplate?.has_ingredients ? 'Quantity to Produce *' : 'Quantity to Add to Stock *'}
            </label>
            <input
              type="number"
              required
              min="1"
              step="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter quantity"
              disabled={!selectedTemplate}
            />
            {selectedTemplate && formData.quantity && (
              <p className="text-xs text-secondary-500 mt-1">
                {selectedTemplate.has_ingredients 
                  ? `This will produce ${formData.quantity} ${selectedTemplate.unit} of ${selectedTemplate.name}`
                  : `This will add ${formData.quantity} ${selectedTemplate.unit} of ${selectedTemplate.name} to inventory`
                }
              </p>
            )}
            
            {/* Show calculation for recipe-based products */}
            {selectedTemplate?.has_ingredients && selectedTemplate.producible_quantity && formData.quantity && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                Batch ratio: {formData.quantity} ÷ {selectedTemplate.producible_quantity} = {(parseInt(formData.quantity) / selectedTemplate.producible_quantity).toFixed(2)}x
              </div>
            )}
          </div>

          {/* MRP Override */}
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              MRP (Optional - Override template MRP)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.mrp}
              onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Leave empty to use template MRP"
            />
          </div>

          {/* Stock Validation Errors (Only for recipe-based products) */}
          {selectedTemplate?.has_ingredients && !stockValidation.isValid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 mb-2">Insufficient Stock</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    {stockValidation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Warning if no ingredients for recipe-based product */}
          {selectedTemplate?.has_ingredients && ingredients.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">No Ingredients</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    This template has no ingredients. Please add ingredients before creating products.
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
              disabled={
                loading || 
                !selectedTemplate || 
                (selectedTemplate.has_ingredients && (!stockValidation.isValid || ingredients.length === 0))
              }
            >
              {loading 
                ? (selectedTemplate?.has_ingredients ? 'Producing...' : 'Adding...') 
                : (selectedTemplate?.has_ingredients ? 'Produce Product' : 'Add to Stock')
              }
            </button>
          </div>
        </form>
      </div>

      {/* Template Form Modal */}
      {showTemplateForm && (
        <ProductTemplateForm
          onClose={handleTemplateFormClose}
        />
      )}
    </div>
  );
}
