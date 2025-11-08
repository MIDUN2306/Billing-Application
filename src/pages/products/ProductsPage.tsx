import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Trash2, Package, RefreshCw, Edit, RotateCw, Coffee, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductFormWithInlineDrafts } from './ProductFormWithInlineDrafts';
import { EditTemplateModal } from './EditTemplateModal';
import { RefillProductModal } from './RefillProductModal';
import { TeaPreparationModal } from './TeaPreparationModal';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  category_name: string | null;
  category_id: string | null;
  unit: string;
  mrp: number | null;
  quantity: number;
  stock_status: string;
  product_template_id: string | null;
  is_template?: boolean;
  has_ingredients?: boolean;
  producible_quantity?: number;
  linked_raw_material_id?: string | null;
  is_linked_to_raw_material?: boolean;
}

export function ProductsPage() {
  const { currentStore } = useStoreStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Product | null>(null);
  const [refillProduct, setRefillProduct] = useState<Product | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showTeaPreparation, setShowTeaPreparation] = useState(false);
  const loadingRef = useRef(false);
  const isMountedRef = useRef(true);

  const loadProducts = useCallback(async (isRefresh = false) => {


    if (!currentStore?.id) {
      setLoading(false);
      return;
    }

    // Prevent multiple simultaneous loads
    if (loadingRef.current && !isRefresh) {
      return;
    }

    loadingRef.current = true;

    // Safety timeout: Reset loadingRef after 10 seconds no matter what
    const timeoutId = setTimeout(() => {
      console.warn('[ProductsPage] Load timeout - resetting loading state');
      loadingRef.current = false;
      setLoading(false);
      setRefreshing(false);
      toast.error('Loading timeout - please refresh the page');
    }, 10000);

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const storeId = currentStore.id;

      // Load actual products

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku, category, unit, mrp, quantity, product_template_id, category_id, linked_raw_material_id')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');



      if (productsError) {
        console.error('[ProductsPage] Products query error:', productsError);
        throw productsError;
      }

      // Load categories separately to avoid nested select issues
      const categoryIds = [...new Set(productsData?.map((p: any) => p.category_id).filter(Boolean))];
      let categoriesMap: { [key: string]: string } = {};


      if (categoryIds.length > 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', categoryIds);



        if (!categoriesError && categoriesData) {
          categoriesMap = categoriesData.reduce((acc, cat) => {
            acc[cat.id] = cat.name;
            return acc;
          }, {} as { [key: string]: string });
        }
      } else {
      }

      // Load product templates (recipes)
      const { data: templatesData, error: templatesError } = await supabase
        .from('product_templates')
        .select('id, name, sku, unit, mrp, has_ingredients, producible_quantity, category_id')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .order('name');


      if (templatesError) {
        console.error('[ProductsPage] Templates query error:', templatesError);
        throw templatesError;
      }

      // Load template categories if needed
      const templateCategoryIds = [...new Set(templatesData?.map((t: any) => t.category_id).filter(Boolean))];
      if (templateCategoryIds.length > 0) {
        const { data: templateCategoriesData, error: templateCategoriesError } = await supabase
          .from('categories')
          .select('id, name')
          .in('id', templateCategoryIds);

        if (!templateCategoriesError && templateCategoriesData) {
          templateCategoriesData.forEach(cat => {
            categoriesMap[cat.id] = cat.name;
          });
        }
      }

      // Transform products
      const transformedProducts = (productsData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category || null,
        category_name: item.category_id ? categoriesMap[item.category_id] || null : null,
        category_id: item.category_id,
        unit: item.unit,
        mrp: item.mrp,
        quantity: item.quantity,
        product_template_id: item.product_template_id,
        linked_raw_material_id: item.linked_raw_material_id,
        is_linked_to_raw_material: !!item.linked_raw_material_id,
        stock_status: item.quantity === 0 ? 'out_of_stock' : item.quantity < 10 ? 'low_stock' : 'in_stock',
        is_template: false,
      }));

      // Find templates that don't have any products yet (need to be produced)
      const usedTemplateIds = new Set(
        transformedProducts
          .filter((p: any) => p.product_template_id)
          .map((p: any) => p.product_template_id)
      );

      // Show templates without products as "Out of Stock" items that need production
      const transformedTemplates = (templatesData || [])
        .filter((item: any) => !usedTemplateIds.has(item.id))
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category || null,
          category_name: item.category_id ? categoriesMap[item.category_id] || null : null,
          category_id: item.category_id,
          unit: item.unit,
          mrp: item.mrp,
          quantity: 0,
          product_template_id: item.id,
          stock_status: 'out_of_stock',
          is_template: true,
          has_ingredients: item.has_ingredients,
          producible_quantity: item.producible_quantity,
        }));

      // Combine products and templates, sort by name
      const allProducts = [...transformedProducts, ...transformedTemplates].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setProducts(allProducts);

      if (isRefresh) {
        toast.success('Products refreshed');
      }
    } catch (error: any) {
      console.error('[ProductsPage] Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      clearTimeout(timeoutId); // Clear the safety timeout
      setLoading(false);
      setRefreshing(false);
      loadingRef.current = false;
    }
  }, [currentStore?.id]);

  // Load products when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    loadingRef.current = false;

    if (currentStore?.id) {
      loadProducts();
    } else {
      // If store is not available yet, set loading to false to prevent infinite loading screen
      setLoading(false);
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStore?.id]);

  // Note: Auto-reload on tab switch disabled due to Supabase connection issues
  // Users can manually click the Refresh button if needed

  const handleRefresh = () => {
    loadProducts(true);
  };

  const handleDelete = async (id: string, isTemplate: boolean = false) => {
    // Show confirmation dialog
    const itemType = isTemplate ? 'recipe template' : 'product';
    const confirmMessage = `Are you sure you want to delete this ${itemType}?\n\nThis action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const table = isTemplate ? 'product_templates' : 'products';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(`${isTemplate ? 'Recipe template' : 'Product'} deleted successfully`);
      loadProducts();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(`Failed to delete ${itemType}`);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleEditTemplate = (product: Product) => {
    setEditingTemplate(product);
  };

  const handleProduce = async (product: Product) => {
    if (!product.is_template) {
      toast.error('This product is not a template. Use "Refill" to add more stock.');
      return;
    }

    // Check if a product already exists for this template
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        sku,
        category,
        unit,
        mrp,
        quantity,
        product_template_id,
        category_id,
        categories (
          name
        )
      `)
      .eq('product_template_id', product.id)
      .eq('store_id', currentStore!.id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking for existing product:', checkError);
      toast.error('Failed to check product status');
      return;
    }

    if (existingProduct) {
      // Product exists, open refill modal with the actual product
      const productData: Product = {
        id: existingProduct.id,
        name: existingProduct.name,
        sku: existingProduct.sku,
        category: existingProduct.category || null,
        category_name: (existingProduct.categories as any)?.name || null,
        category_id: existingProduct.category_id,
        unit: existingProduct.unit,
        mrp: existingProduct.mrp,
        quantity: existingProduct.quantity,
        product_template_id: existingProduct.product_template_id,
        stock_status: existingProduct.quantity === 0 ? 'out_of_stock' : existingProduct.quantity < 10 ? 'low_stock' : 'in_stock',
        is_template: false,
      };
      setRefillProduct(productData);
    } else {
      // No product exists yet, create one first
      try {
        const { data: newProduct, error: createError } = await supabase
          .from('products')
          .insert({
            store_id: currentStore!.id,
            name: product.name,
            sku: product.sku,
            unit: product.unit,
            mrp: product.mrp,
            quantity: 0,
            product_template_id: product.id,
            category_id: product.category_id,
          })
          .select(`
            id,
            name,
            sku,
            category,
            unit,
            mrp,
            quantity,
            product_template_id,
            category_id,
            categories (
              name
            )
          `)
          .single();

        if (createError) throw createError;

        toast.success(`Product "${product.name}" created. Now you can produce it.`);

        // Open refill modal with the newly created product
        const productData: Product = {
          id: newProduct.id,
          name: newProduct.name,
          sku: newProduct.sku,
          category: newProduct.category || null,
          category_name: (newProduct.categories as any)?.name || null,
          category_id: newProduct.category_id,
          unit: newProduct.unit,
          mrp: newProduct.mrp,
          quantity: newProduct.quantity,
          product_template_id: newProduct.product_template_id,
          stock_status: 'out_of_stock',
          is_template: false,
        };
        setRefillProduct(productData);
      } catch (error: any) {
        console.error('Error creating product:', error);
        toast.error('Failed to create product from template');
      }
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handleTemplateEditClose = () => {
    setEditingTemplate(null);
    loadProducts();
  };

  const handleRefillClick = async (product: Product) => {
    // If it's a template, we need to produce it first
    if (product.is_template) {
      toast.error('This is a recipe template. Use "Produce" to create products from this recipe.');
      return;
    }

    // Check if product has a template and ingredients
    if (!product.product_template_id) {
      // Simple product, no stock check needed
      setRefillProduct(product);
      return;
    }

    try {
      // Check if product has ingredients
      const { data: template, error: templateError } = await supabase
        .from('product_templates')
        .select('has_ingredients')
        .eq('id', product.product_template_id)
        .single();

      if (templateError) throw templateError;

      if (!template.has_ingredients) {
        // Simple product, no stock check needed
        setRefillProduct(product);
        return;
      }

      // Check ingredient stock levels
      const { data: ingredients, error: ingredientsError } = await supabase
        .from('v_product_ingredient_details')
        .select('raw_material_name, available_stock, unit')
        .eq('product_template_id', product.product_template_id)
        .eq('store_id', currentStore!.id);

      if (ingredientsError) throw ingredientsError;

      // Check for zero stock ingredients
      const zeroStockIngredients = (ingredients || []).filter(
        (ing: any) => ing.available_stock === 0
      );

      if (zeroStockIngredients.length > 0) {
        const ingredientNames = zeroStockIngredients
          .map((ing: any) => ing.raw_material_name)
          .join(', ');

        toast.error(
          `Cannot refill: Out of stock for ${ingredientNames}. Please add raw materials first.`,
          { duration: 5000 }
        );
        return;
      }

      // Check for critically low stock (less than recipe needs)
      const lowStockIngredients = (ingredients || []).filter(
        (ing: any) => ing.available_stock > 0 && ing.available_stock < ing.quantity_needed
      );

      if (lowStockIngredients.length > 0) {
        const ingredientNames = lowStockIngredients
          .map((ing: any) => `${ing.raw_material_name} (${ing.available_stock} ${ing.unit})`)
          .join(', ');

        toast(
          `⚠️ Low stock: ${ingredientNames}. You may not be able to produce the full recipe.`,
          {
            duration: 5000,
            icon: '⚠️',
            style: {
              background: '#FEF3C7',
              color: '#92400E',
            }
          }
        );
      }

      // Open the refill modal
      setRefillProduct(product);
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Failed to check ingredient stock');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'in_stock': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStockStatusLabel = (status: string, isTemplate: boolean = false) => {
    if (isTemplate) return 'Recipe';
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-secondary-900">Products</h1>
          <p className="text-secondary-600 mt-1">Manage your product inventory</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Refresh products"
          >
            <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>
      </div>

      {/* Tea Preparation Card */}
      <div 
        onClick={() => setShowTeaPreparation(true)}
        className="card bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 hover:border-amber-400 hover:shadow-xl transition-all duration-200 cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-amber-100 rounded-xl group-hover:bg-amber-200 transition-colors">
              <Coffee className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-secondary-900 mb-1">Tea Preparation Batches</h3>
              <p className="text-sm text-secondary-600">
                Manage recipe batches for all your tea products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-amber-600" />
            <span className="text-sm font-medium text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
              Click to manage
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Products Grid - Card Layout like POS */}
      {filteredProducts.length === 0 ? (
        <div className="card py-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Package className="w-10 h-10 text-secondary-400" />
            </div>
            <h3 className="text-lg font-semibold text-secondary-900 mb-2">No products found</h3>
            <p className="text-secondary-500 text-sm">Add your first product to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:shadow-lg transition-all duration-200 p-4 relative"
            >
              {/* Product Name */}
              <h3 className="font-semibold text-base mb-2 line-clamp-2">
                {product.name}
              </h3>

              {/* SKU */}
              {product.sku && (
                <p className="text-sm font-medium text-gray-600 mb-2">SKU: {product.sku}</p>
              )}

              {/* Category and Link Status */}
              <div className="flex flex-wrap gap-2 mb-3">
                {product.category && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs">
                    {product.category}
                  </span>
                )}
                {product.is_linked_to_raw_material && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 font-medium text-xs">
                    🔗 Linked to Stock
                  </span>
                )}
              </div>

              {/* Price and Stock */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <span className="text-xl font-bold text-primary-600">
                    {product.mrp ? `₹${product.mrp.toFixed(2)}` : '-'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Stock</p>
                  <span className={`text-lg font-bold ${product.quantity === 0
                    ? 'text-red-600'
                    : product.quantity < 10
                      ? 'text-yellow-600'
                      : 'text-green-600'
                    }`}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
              </div>

              {/* Unit */}
              <div className="mb-3">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                  {product.unit}
                </span>
              </div>

              {/* Status Badge - Always show */}
              <div className="mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stock_status)}`}>
                  {getStockStatusLabel(product.stock_status)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => product.is_template ? handleEditTemplate(product) : handleEdit(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  title="Edit Product"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => product.is_template ? handleProduce(product) : handleRefillClick(product)}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
                  title="Produce More"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Produce
                </button>
                <button
                  onClick={() => handleDelete(product.id, product.is_template)}
                  className="flex items-center justify-center px-2 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {showForm && (
        <ProductFormWithInlineDrafts
          product={editingProduct}
          onClose={handleFormClose}
        />
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <EditTemplateModal
          template={{
            id: editingTemplate.id,
            name: editingTemplate.name,
            sku: editingTemplate.sku,
            unit: editingTemplate.unit,
            mrp: editingTemplate.mrp,
            producible_quantity: editingTemplate.producible_quantity || 0,
          }}
          onClose={handleTemplateEditClose}
          onSuccess={handleTemplateEditClose}
        />
      )}

      {/* Refill Product Modal */}
      {refillProduct && (
        <RefillProductModal
          product={refillProduct}
          onClose={() => setRefillProduct(null)}
          onSuccess={() => {
            setRefillProduct(null);
            loadProducts();
          }}
        />
      )}

      {/* Tea Preparation Modal */}
      {showTeaPreparation && (
        <TeaPreparationModal
          onClose={() => setShowTeaPreparation(false)}
        />
      )}
    </div>
  );
}
