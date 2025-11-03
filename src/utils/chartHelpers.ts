// Chart color schemes and helper functions

export const CHART_COLORS = {
  profit: '#10b981', // green-500
  loss: '#ef4444', // red-500
  breakEven: '#6b7280', // gray-500
  grid: '#e5e7eb', // gray-200
  text: '#374151', // gray-700
  
  // Payment methods
  cash: '#3b82f6', // blue-500
  upi: '#8b5cf6', // purple-500
  card: '#f59e0b', // amber-500
  credit: '#ec4899', // pink-500
};

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export function getResponsiveChartDimensions(containerWidth: number): ChartDimensions {
  const isMobile = containerWidth < 768;
  const isTablet = containerWidth >= 768 && containerWidth < 1200;
  
  return {
    width: containerWidth,
    height: isMobile ? 250 : isTablet ? 300 : 350,
    margin: {
      top: 20,
      right: isMobile ? 10 : 20,
      bottom: isMobile ? 40 : 50,
      left: isMobile ? 40 : 60,
    },
  };
}

export function formatCurrency(value: number): string {
  return `₹${Math.abs(value).toLocaleString()}`;
}

export function formatShortCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  } else if (abs >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value}`;
}

export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateString);
  
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function getPaymentMethodColor(method: string): string {
  const methodLower = method.toLowerCase();
  if (methodLower.includes('cash')) return CHART_COLORS.cash;
  if (methodLower.includes('upi')) return CHART_COLORS.upi;
  if (methodLower.includes('card')) return CHART_COLORS.card;
  if (methodLower.includes('credit')) return CHART_COLORS.credit;
  return CHART_COLORS.cash;
}

export function getPaymentMethodLabel(method: string): string {
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase().replace('_', ' ');
}
