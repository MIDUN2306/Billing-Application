import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, Package, List, RotateCw, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStoreStore } from '../../stores/storeStore';
import { ProductTemplateForm } from './ProductTemplateForm';
import { ManageIngredientsModal } from './ManageIngredientsModal';
import { ManageRecipeBatchesModal } from './ManageRecipeBatchesModal';
import { ProductTemplateWithDetails } from '../../types/database.types';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';

export function ProductTemplatesPage() {
  const { currentStore } = useStoreStore();
  const location = useLocation();
  const [templates, setTemplates] = useState<ProductTemplateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProductTemplateWithDetails | null>(null);
  const [managingIngredientsFor, setManagingIngredientsFor] = useState<ProductTemplateWithDetails | null>(null);
  const [managingBatchesFor, setManagingBatchesFor] = useState<ProductTemplateWithDetails | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadTemplates = useCallback(async (isRefresh = false) => {
    if (!currentStore) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const { data, error } = await supabase
        .from('v_product_templates_with_ingredients')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
      
      if (isRefresh) {
        toast.success('Templates refreshed');
      }
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load product templates');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentStore]);

  // Load templates when component mounts or when navigating back to this page
  useEffect(() => {
    if (currentStore) {
      loadTemplates();
    }
  }, [currentStore, location.pathname, loadTemplates]);

  // Reload data when window/tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentStore) {
        loadTemplates();
      }
    };

    const handleFocus = () => {
      if (currentStore) {
        loadTemplates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentStore, loadTemplates]);

  const handleRefresh = () => {
    loadTemplates(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product template? All associated ingredients will also be deleted.')) return;

    try {
      const { error } = await supabase
        .from('product_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product template deleted successfully');
      loadTemplates();
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete product template');
    }
  };

  const handleEdit = (template: ProductTemplateWithDetails) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleManageIngredients = (template: ProductTemplateWithDetails) => {
    setManagingIngredientsFor(template);
  };

  const handleIngredientsClose = () => {
    setManagingIngredientsFor(null);
    loadTemplates();
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-display font-bold text-secondary-900">Product Templates</h1>
          <p className="text-secondary-600 mt-1">Manage product recipes and ingredients</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
            title="Refresh templates"
          >
            <RotateCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <Plus className="w-5 h-5" />
            Add Template
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
          <input
            type="text"
            placeholder="Search templates by name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Unit
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  MRP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Ingredients
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                    <p className="text-secondary-500">No product templates found</p>
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-secondary-900">
                          {template.product_name || template.name}
                        </span>
                        {template.has_ingredients ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                            📦 Recipe
                          </span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">
                            🛒 Simple
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-600">
                      {template.sku || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-600">
                      {template.unit}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-secondary-900">
                        {template.mrp ? `₹${template.mrp.toFixed(2)}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {template.has_ingredients ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          template.ingredient_count > 0 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {template.ingredient_count} ingredient{template.ingredient_count !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-xs text-secondary-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        template.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {template.has_ingredients && (
                          <>
                            <button
                              onClick={() => setManagingBatchesFor(template)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="Manage Recipe Batches"
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleManageIngredients(template)}
                              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                              title="Manage Ingredients (Legacy)"
                            >
                              <List className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleEdit(template)}
                          className="p-2 text-secondary-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Template Form Modal */}
      {showForm && (
        <ProductTemplateForm
          template={editingTemplate}
          onClose={handleFormClose}
        />
      )}

      {/* Manage Ingredients Modal */}
      {managingIngredientsFor && (
        <ManageIngredientsModal
          template={managingIngredientsFor}
          onClose={handleIngredientsClose}
        />
      )}

      {/* Manage Recipe Batches Modal */}
      {managingBatchesFor && (
        <ManageRecipeBatchesModal
          productTemplateId={managingBatchesFor.id}
          productName={managingBatchesFor.name}
          onClose={() => setManagingBatchesFor(null)}
        />
      )}
    </div>
  );
}
