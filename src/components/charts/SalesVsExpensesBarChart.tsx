import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface DataPoint {
  date: string;
  sales: number;
  expenses: number; // petty_cash + raw_materials
  profit_loss: number;
}

interface Props {
  data: DataPoint[];
  loading?: boolean;
}

export function SalesVsExpensesBarChart({ data, loading }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
    const netProfitLoss = totalSales - totalExpenses;
    
    const profitDays = data.filter(d => d.profit_loss > 0).length;
    const lossDays = data.filter(d => d.profit_loss < 0).length;
    
    const maxValue = Math.max(totalSales, totalExpenses);

    return {
      totalSales,
      totalExpenses,
      netProfitLoss,
      profitDays,
      lossDays,
      maxValue,
      daysCount: data.length,
    };
  }, [data]);

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0 || !chartData) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          Sales vs Expenses Overview
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for this period
        </div>
      </div>
    );
  }

  const { totalSales, totalExpenses, netProfitLoss, profitDays, lossDays, maxValue, daysCount } = chartData;

  // Chart dimensions - simplified for 2 bars
  const chartWidth = 600;
  const chartHeight = 350;
  const padding = { top: 40, right: 50, bottom: 80, left: 80 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales for 2 bars
  const barWidth = 120; // Fixed width for each bar
  const barGap = 80; // Gap between the two bars
  const startX = (innerWidth - (barWidth * 2 + barGap)) / 2; // Center the bars
  const yScale = innerHeight / (maxValue * 1.1); // *1.1 for padding at top

  // Generate grid lines (5 horizontal lines)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (innerHeight / 4) * i;
    const value = maxValue * 1.1 - (maxValue * 1.1 / 4) * i;
    gridLines.push({ y, value });
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-secondary-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary-600" />
          Sales vs Expenses Overview
        </h3>
        
        {/* Profit/Loss Badge */}
        <div className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 ${
          netProfitLoss >= 0 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {netProfitLoss >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>
            {netProfitLoss >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(netProfitLoss).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700">Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">Sales</span>
        </div>
      </div>

      {/* Bar Chart - Simplified 2-bar comparison */}
      <div className="w-full bg-gray-50 rounded-lg p-6 flex items-center justify-center">
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="max-w-full"
        >
          {/* Background */}
          <rect
            x={padding.left}
            y={padding.top}
            width={innerWidth}
            height={innerHeight}
            fill="white"
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Horizontal grid lines */}
          {gridLines.map((line, i) => (
            <g key={`grid-${i}`}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={chartWidth - padding.right}
                y2={line.y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={line.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
              >
                ₹{Math.round(line.value).toLocaleString()}
              </text>
            </g>
          ))}

          {/* Expenses Bar (Red) */}
          <g>
            <rect
              x={padding.left + startX}
              y={padding.top + innerHeight - (totalExpenses * yScale)}
              width={barWidth}
              height={Math.max(totalExpenses * yScale, 2)}
              fill="#ef4444"
              opacity="0.9"
              rx="4"
              className="hover:opacity-100 transition-opacity cursor-pointer"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
            >
              <title>
                Total Expenses
                {'\n'}₹{totalExpenses.toLocaleString()}
                {'\n'}Petty Cash + Raw Materials
              </title>
            </rect>
            
            {/* Value label on bar */}
            <text
              x={padding.left + startX + barWidth / 2}
              y={padding.top + innerHeight - (totalExpenses * yScale) - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#991b1b"
              fontWeight="bold"
            >
              ₹{totalExpenses.toLocaleString()}
            </text>
            
            {/* X-axis label */}
            <text
              x={padding.left + startX + barWidth / 2}
              y={chartHeight - padding.bottom + 30}
              textAnchor="middle"
              fontSize="13"
              fill="#4b5563"
              fontWeight="600"
            >
              Total Expenses
            </text>
            <text
              x={padding.left + startX + barWidth / 2}
              y={chartHeight - padding.bottom + 48}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              ({daysCount} days)
            </text>
          </g>

          {/* Sales Bar (Green) */}
          <g>
            <rect
              x={padding.left + startX + barWidth + barGap}
              y={padding.top + innerHeight - (totalSales * yScale)}
              width={barWidth}
              height={Math.max(totalSales * yScale, 2)}
              fill="#10b981"
              opacity="0.9"
              rx="4"
              className="hover:opacity-100 transition-opacity cursor-pointer"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
            >
              <title>
                Total Sales
                {'\n'}₹{totalSales.toLocaleString()}
                {'\n'}All completed sales
              </title>
            </rect>
            
            {/* Value label on bar */}
            <text
              x={padding.left + startX + barWidth + barGap + barWidth / 2}
              y={padding.top + innerHeight - (totalSales * yScale) - 10}
              textAnchor="middle"
              fontSize="14"
              fill="#065f46"
              fontWeight="bold"
            >
              ₹{totalSales.toLocaleString()}
            </text>
            
            {/* X-axis label */}
            <text
              x={padding.left + startX + barWidth + barGap + barWidth / 2}
              y={chartHeight - padding.bottom + 30}
              textAnchor="middle"
              fontSize="13"
              fill="#4b5563"
              fontWeight="600"
            >
              Total Sales
            </text>
            <text
              x={padding.left + startX + barWidth + barGap + barWidth / 2}
              y={chartHeight - padding.bottom + 48}
              textAnchor="middle"
              fontSize="11"
              fill="#6b7280"
            >
              ({daysCount} days)
            </text>
          </g>

          {/* Y-axis label */}
          <text
            x={padding.left - 55}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            fontWeight="600"
            transform={`rotate(-90 ${padding.left - 55} ${padding.top + innerHeight / 2})`}
          >
            Amount (₹)
          </text>
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-red-700 mb-2">
            <TrendingDown className="w-5 h-5" />
            <span className="text-sm font-semibold">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-red-900">₹{totalExpenses.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">Petty Cash + Raw Materials</p>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-green-700 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-semibold">Total Sales</span>
          </div>
          <p className="text-2xl font-bold text-green-900">₹{totalSales.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">All Completed Sales</p>
        </div>
        
        <div className={`text-center p-4 rounded-lg ${netProfitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`flex items-center justify-center gap-1 mb-2 ${netProfitLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {netProfitLoss >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            <span className="text-sm font-semibold">Net {netProfitLoss >= 0 ? 'Profit' : 'Loss'}</span>
          </div>
          <p className={`text-2xl font-bold ${netProfitLoss >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            ₹{Math.abs(netProfitLoss).toLocaleString()}
          </p>
          <p className={`text-xs mt-1 ${netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {profitDays} profit days, {lossDays} loss days
          </p>
        </div>
      </div>
    </div>
  );
}
