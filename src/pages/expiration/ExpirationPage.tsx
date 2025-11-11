import { useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { useExpirationStore } from '../../stores/expirationStore';
import ExpireStockForm from './ExpireStockForm';
import ExpirationHistoryTable from './ExpirationHistoryTable';

export default function ExpirationPage() {
  const { fetchAvailableItems, fetchExpirationHistory, loading } = useExpirationStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchAvailableItems(),
      fetchExpirationHistory(),
    ]);
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Stock Expiration</h1>
                <p className="text-gray-600 mt-1">
                  Manage and track expired stock across all inventory types
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Expire Stock Form */}
          <div className="lg:col-span-1">
            <ExpireStockForm />
          </div>

          {/* Right Column - Expiration History */}
          <div className="lg:col-span-2">
            <ExpirationHistoryTable />
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">Raw Materials</h3>
            <p className="text-sm text-blue-700">
              Expire ingredients and raw materials with SKU tracking for ready-to-use items.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-medium text-amber-900 mb-2">Tea Stock</h3>
            <p className="text-sm text-amber-700">
              Manage prepared tea stock expiration separately with automatic unit conversion.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Products</h3>
            <p className="text-sm text-green-700">
              Track finished product expiration with complete stock history.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
