import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { FilterType, DateFilter as DateFilterType, getDateRange, getFilterLabel, validateDateRange } from '../utils/dateFilters';

interface Props {
  currentFilter: DateFilterType;
  onFilterChange: (filter: DateFilterType) => void;
}

export function DateFilter({ currentFilter, onFilterChange }: Props) {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState(currentFilter.startDate);
  const [customEnd, setCustomEnd] = useState(currentFilter.endDate);
  const [error, setError] = useState<string>('');

  const quickFilters: { type: FilterType; label: string }[] = [
    { type: 'today', label: 'Today' },
    { type: 'yesterday', label: 'Yesterday' },
    { type: '7days', label: 'Last 7 Days' },
    { type: '30days', label: 'Last 30 Days' },
    { type: 'thisMonth', label: 'This Month' },
    { type: 'lastMonth', label: 'Last Month' },
  ];

  const handleQuickFilter = (type: FilterType) => {
    const range = getDateRange(type);
    const label = getFilterLabel(type);
    onFilterChange({
      type,
      ...range,
      label
    });
  };

  const handleCustomClick = () => {
    setCustomStart(currentFilter.startDate);
    setCustomEnd(currentFilter.endDate);
    setError('');
    setShowCustomModal(true);
  };

  const handleApplyCustom = () => {
    const validation = validateDateRange(customStart, customEnd);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid date range');
      return;
    }

    const label = getFilterLabel('custom', customStart, customEnd);
    onFilterChange({
      type: 'custom',
      startDate: customStart,
      endDate: customEnd,
      label
    });
    setShowCustomModal(false);
  };

  const handleCancel = () => {
    setShowCustomModal(false);
    setError('');
  };

  return (
    <div className="space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.type}
            onClick={() => handleQuickFilter(filter.type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentFilter.type === filter.type
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
        <button
          onClick={handleCustomClick}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            currentFilter.type === 'custom'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Custom
        </button>
      </div>

      {/* Current Filter Label */}
      <div className="text-sm text-gray-600">
        Showing data for: <span className="font-semibold text-gray-900">{currentFilter.label}</span>
      </div>

      {/* Custom Date Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Custom Date Range</h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* From Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button onClick={handleCancel} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleApplyCustom} className="btn-primary">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
