import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  EnhancedDateFilter as EnhancedDateFilterType,
  EnhancedFilterType,
  getLast7DaysRange,
  getAvailableMonths,
  getAvailableYears,
  getCurrentMonth,
  createMonthFilter,
  createYearFilter,
  createCustomFilter,
  validateDateRange,
} from '../utils/enhancedDateFilters';

interface Props {
  currentFilter: EnhancedDateFilterType;
  onFilterChange: (filter: EnhancedDateFilterType) => void;
}

export function EnhancedDateFilter({ currentFilter, onFilterChange }: Props) {
  const [showCustom, setShowCustom] = useState(currentFilter.type === 'custom');
  const [customStart, setCustomStart] = useState(currentFilter.startDate);
  const [customEnd, setCustomEnd] = useState(currentFilter.endDate);
  const [error, setError] = useState<string>('');

  const availableMonths = getAvailableMonths();
  const availableYears = getAvailableYears();
  const currentMonth = getCurrentMonth();

  const handleLast7Days = () => {
    const range = getLast7DaysRange();
    const filter: EnhancedDateFilterType = {
      type: 'last7days',
      ...range,
      label: 'Last 7 Days'
    };
    setShowCustom(false);
    setError('');
    onFilterChange(filter);
  };

  const handleMonthChange = (monthValue: string) => {
    const month = parseInt(monthValue);
    const year = currentMonth.year; // Use current year
    const filter = createMonthFilter(month, year);
    setShowCustom(false);
    setError('');
    onFilterChange(filter);
  };

  const handleYearChange = (yearValue: string) => {
    const year = parseInt(yearValue);
    const filter = createYearFilter(year);
    setShowCustom(false);
    setError('');
    onFilterChange(filter);
  };

  const handleCustomToggle = () => {
    if (!showCustom) {
      setCustomStart(currentFilter.startDate);
      setCustomEnd(currentFilter.endDate);
      setError('');
    }
    setShowCustom(!showCustom);
  };

  const handleApplyCustom = () => {
    const validation = validateDateRange(customStart, customEnd);
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid date range');
      return;
    }

    const filter = createCustomFilter(customStart, customEnd);
    setError('');
    onFilterChange(filter);
  };

  const isActive = (type: EnhancedFilterType, value?: number) => {
    if (currentFilter.type !== type) return false;
    
    switch (type) {
      case 'month':
        return currentFilter.month === value;
      case 'year':
        return currentFilter.year === value;
      default:
        return true;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Last 7 Days Button */}
        <button
          onClick={handleLast7Days}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive('last7days')
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Last 7 Days
        </button>

        {/* Month Selector */}
        <div className="relative">
          <select
            value={currentFilter.type === 'month' ? currentFilter.month : ''}
            onChange={(e) => handleMonthChange(e.target.value)}
            className={`appearance-none px-4 py-2 pr-10 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              isActive('month')
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <option value="" disabled>
              Select Month
            </option>
            {availableMonths.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
            isActive('month') ? 'text-white' : 'text-gray-500'
          }`} />
        </div>

        {/* Year Selector */}
        <div className="relative">
          <select
            value={currentFilter.type === 'year' ? currentFilter.year : ''}
            onChange={(e) => handleYearChange(e.target.value)}
            className={`appearance-none px-4 py-2 pr-10 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
              isActive('year')
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <option value="" disabled>
              Select Year
            </option>
            {availableYears.map((year) => (
              <option key={year.value} value={year.value}>
                {year.label}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
            isActive('year') ? 'text-white' : 'text-gray-500'
          }`} />
        </div>

        {/* Custom Range Toggle */}
        <button
          onClick={handleCustomToggle}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showCustom || isActive('custom')
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Custom Range
        </button>
      </div>

      {/* Custom Date Range (Inline) */}
      {showCustom && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            
            <button
              onClick={handleApplyCustom}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Apply
            </button>
            
            <button
              onClick={() => setShowCustom(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          
          {/* Error Message */}
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* Current Filter Label */}
      <div className="text-sm text-gray-600">
        Showing data for: <span className="font-semibold text-gray-900">{currentFilter.label}</span>
      </div>
    </div>
  );
}
