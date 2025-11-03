export type FilterType = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface DateFilter extends DateRange {
  type: FilterType;
  label: string;
}

/**
 * Get date range based on filter type
 */
export function getDateRange(filterType: FilterType): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (filterType) {
    case 'today': {
      const dateStr = today.toISOString().split('T')[0];
      return { startDate: dateStr, endDate: dateStr };
    }

    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      return { startDate: dateStr, endDate: dateStr };
    }

    case '7days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return {
        startDate: sevenDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    }

    case '30days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      return {
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    }

    case 'thisMonth': {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };
    }

    case 'lastMonth': {
      const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        startDate: firstDayLastMonth.toISOString().split('T')[0],
        endDate: lastDayLastMonth.toISOString().split('T')[0]
      };
    }

    default:
      const dateStr = today.toISOString().split('T')[0];
      return { startDate: dateStr, endDate: dateStr };
  }
}

/**
 * Get label for filter type
 */
export function getFilterLabel(filterType: FilterType, startDate?: string, endDate?: string): string {
  switch (filterType) {
    case 'today':
      return 'Today';
    case 'yesterday':
      return 'Yesterday';
    case '7days':
      return 'Last 7 Days';
    case '30days':
      return 'Last 30 Days';
    case 'thisMonth':
      return 'This Month';
    case 'lastMonth':
      return 'Last Month';
    case 'custom':
      if (startDate && endDate) {
        return formatDateRangeLabel(startDate, endDate);
      }
      return 'Custom Range';
    default:
      return 'Today';
  }
}

/**
 * Format date range for display
 */
export function formatDateRangeLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  
  if (startDate === endDate) {
    return start.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' });
  }

  if (start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
  }

  return `${start.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })} - ${end.toLocaleDateString('en-US', { ...formatOptions, year: 'numeric' })}`;
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Start date must be before or equal to end date
  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  // Dates cannot be in the future
  if (end > today) {
    return { valid: false, error: 'Future dates are not allowed' };
  }

  // Date range cannot exceed 1 year
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYearInMs) {
    return { valid: false, error: 'Date range cannot exceed 365 days' };
  }

  return { valid: true };
}

/**
 * Get today's date string
 */
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check if date is today
 */
export function isToday(date: string): boolean {
  return date === getTodayDate();
}

/**
 * Format date for input field
 */
export function formatDateForInput(date: string): string {
  return date;
}

/**
 * Get default date filter (Today)
 */
export function getDefaultDateFilter(): DateFilter {
  const range = getDateRange('today');
  return {
    type: 'today',
    ...range,
    label: 'Today'
  };
}
