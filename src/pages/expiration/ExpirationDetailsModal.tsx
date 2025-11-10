import React, { useEffect } from 'react';
import { X, Calendar, User, Package, TrendingDown } from 'lucide-react';
import { useExpirationStore } from '../../stores/expirationStore';

interface ExpirationDetailsModalProps {
  itemName: string;
  onClose: () => void;
}

export default function ExpirationDetailsModal({ itemName, onClose }: ExpirationDetailsModalProps) {
  const { selectedItemDetails, fetchExpirationDetails, loading } = useExpirationStore();

  useEffect(() => {
    fetchExpirationDetails(itemName);
  }, [itemName]);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Expiration Details</h2>
            <p className="text-sm text-gray-600 mt-1">{itemName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading details...</span>
            </div>
          ) : selectedItemDetails.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No expiration records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedItemDetails.map((detail) => (
                <div
                  key={detail.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                      <span className="text-xs text-gray-500">
                        {getItemTypeLabel(detail.item_type)}
                      </span>
                      {detail.sku && (
                        <span className="text-xs text-gray-500">
                          SKU: {detail.sku}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(detail.expired_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quantity Expired</p>
                      <p className="text-lg font-semibold text-red-600">
                        {detail.quantity_expired} {detail.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stock Before</p>
                      <p className="text-sm font-medium text-gray-900">
                        {detail.stock_before_expiration} {detail.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Stock After</p>
                      <p className="text-sm font-medium text-gray-900">
                        {detail.stock_after_expiration} {detail.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Reduction</p>
                      <div className="flex items-center text-sm font-medium text-red-600">
                        <TrendingDown className="w-4 h-4 mr-1" />
                        {((detail.quantity_expired / detail.stock_before_expiration) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {detail.expired_by_name && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <User className="w-4 h-4 mr-1" />
                      <span>Expired by: {detail.expired_by_name}</span>
                    </div>
                  )}

                  {detail.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Notes:</p>
                      <p className="text-sm text-gray-700">{detail.notes}</p>
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-400">
                    Recorded: {new Date(detail.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
