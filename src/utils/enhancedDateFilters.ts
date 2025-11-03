export type EnhancedFilterType = 'last7days' | 'month' | 'year' | 'custom';

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface EnhancedDateFilter extends DateRange {
  type: EnhancedFilterType;
  label: string;
  month?: number; // 0-11 for month filter
  year?: number;  // year for month/year filters
}

export interface MonthOption {
  value: number;
  label: string;
  shortLabel: string;
  year: number;
}

export interface YearOption {
  value: number;
  label: string;
}

/**
 * Get date range for last 7 days
 */
export function getLast7DaysRange(): DateRange {
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  
  return {
    startDate: sevenDaysAgo.toISOString().split('T')[0],
    endDate: today.toISOString().split('T')[0]
  };
}

/**
 * Get date range for specific month and year
 */
export function getMonthRange(month: number, year: number): DateRange {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
}

/**
 * Get date range for specific year
 */
export function getYearRange(year: number): DateRange {
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0]
  };
}

/**
 * Get available months for current year
 */
export function getAvailableMonths(): MonthOption[] {
  const currentYear = new Date().getFullYear();
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return months.map((month, index) => ({
    value: index,
    label: `${month} ${currentYear}`,
    shortLabel: `${month.substring(0, 3)} ${currentYear}`,
    year: currentYear
  }));
}

/**
 * Get available years (last 3 years + current + next)
 */
export function getAvailableYears(): YearOption[] {
  const currentYear = new Date().getFullYear();
  const years = [];
  
  // Add last 3 years, current year, and next year
  for (let i = currentYear - 3; i <= currentYear + 1; i++) {
    years.push({
      value: i,
      label: i.toString()
    });
  }
  
  return years;
}

/**
 * Get current month and year
 */
export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear()
  };
}

/**
 * Get filter label based on type and parameters
 */
export function getEnhancedFilterLabel(
  type: EnhancedFilterType,
  month?: number,
  year?: number,
  startDate?: string,
  endDate?: string
): string {
  switch (type) {
    case 'last7days':
      return 'Last 7 Days';
      
    case 'month':
      if (month !== undefined && year !== undefined) {
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${monthNames[month]} ${year}`;
      }
      return 'Selected Month';
      
    case 'year':
      if (year !== undefined) {
        return year.toString();
      }
      return 'Selected Year';
      
    case 'custom':
      if (startDate && endDate) {
        return formatDateRangeLabel(startDate, endDate);
      }
      return 'Custom Range';
      
    default:
      return 'Last 7 Days';
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
 * Get default enhanced filter (Last 7 Days)
 */
export function getDefaultEnhancedFilter(): EnhancedDateFilter {
  const range = getLast7DaysRange();
  return {
    type: 'last7days',
    ...range,
    label: 'Last 7 Days'
  };
}

/**
 * Create month filter
 */
export function createMonthFilter(month: number, year: number): EnhancedDateFilter {
  const range = getMonthRange(month, year);
  const label = getEnhancedFilterLabel('month', month, year);
  
  return {
    type: 'month',
    ...range,
    label,
    month,
    year
  };
}

/**
 * Create year filter
 */
export function createYearFilter(year: number): EnhancedDateFilter {
  const range = getYearRange(year);
  const label = getEnhancedFilterLabel('year', undefined, year);
  
  return {
    type: 'year',
    ...range,
    label,
    year
  };
}

/**
 * Create custom filter
 */
export function createCustomFilter(startDate: string, endDate: string): EnhancedDateFilter {
  const label = getEnhancedFilterLabel('custom', undefined, undefined, startDate, endDate);
  
  return {
    type: 'custom',
    startDate,
    endDate,
    label
  };
}
