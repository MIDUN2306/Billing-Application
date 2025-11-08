import { useNavigate } from 'react-router-dom';
import { Package, Coffee } from 'lucide-react';

export function InventoryOverviewPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-secondary-900">Inventory Management</h1>
        <p className="text-sm text-secondary-600 mt-1">Manage your raw materials and products inventory</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        
        {/* Raw Materials Card */}
        <button
          onClick={() => navigate('/inventory/raw-materials')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-8 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Coffee className="w-8 h-8 text-primary-700" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
              Raw Materials
            </h3>
            <p className="text-sm text-secondary-600">
              View and manage your raw materials inventory, track quantities, and monitor purchase history
            </p>
          </div>
        </button>

        {/* Products Card */}
        <button
          onClick={() => navigate('/products')}
          className="group relative bg-white rounded-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 text-left p-8 overflow-hidden border-4 border-primary-200 hover:border-primary-700 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-md">
                <Package className="w-8 h-8 text-primary-700" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-secondary-900 mb-3 group-hover:text-primary-700 transition-colors duration-300">
              Products
            </h3>
            <p className="text-sm text-secondary-600">
              View and manage your finished products inventory, track stock levels, and produce more items
            </p>
          </div>
        </button>

      </div>
    </div>
  );
}
