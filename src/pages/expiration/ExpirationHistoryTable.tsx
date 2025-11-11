import { useState } from 'react';
import { Eye, Package, Calendar, Hash } from 'lucide-react';
import { useExpirationStore } from '../../stores/expirationStore';
import ExpirationDetailsModal from './ExpirationDetailsModal';

export default function ExpirationHistoryTable() {
  const { expirationHistory, loading } = useExpirationStore();
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  const handleViewDetails = (itemName: string) => {
    setSelectedItemName(itemName);
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'raw_material':
        return 'Raw Material';
      case 'tea_stock':
        return 'Tea Stock';
      case 'product':
        return 'Product';
      default:
        return type;
    }
  };

  const getItemTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'raw_material':
        return 'bg-blue-100 text-blue-800';
      case 'tea_stock':
        return 'bg-amber-100 text-amber-800';
      case 'product':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading expiration history...</span>
        </div>
      </div>
    );
  }

  if (!expirationHistory || expirationHistory.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Expiration Records</h3>
          <p className="text-gray-600">No stock has been expired yet.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Expiration History</h2>
          <p className="text-sm text-gray-600 mt-1">Consolidated view of all expired stock</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Expired
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Expiration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expirationHistory.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">{item.item_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getItemTypeBadgeColor(item.item_type)}`}>
                      {getItemTypeLabel(item.item_type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-medium text-red-600">
                      {item.total_quantity_expired} {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <Hash className="w-4 h-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{item.expiration_count}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(item.last_expiration_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => handleViewDetails(item.item_name)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedItemName && (
        <ExpirationDetailsModal
          itemName={selectedItemName}
          onClose={() => setSelectedItemName(null)}
        />
      )}
    </>
  );
}
