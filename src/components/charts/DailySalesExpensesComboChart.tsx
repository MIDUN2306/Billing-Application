import { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

interface DataPoint {
  date: string;
  sales: number;
  expenses: number;
  profit_loss: number;
}

interface Props {
  data: DataPoint[];
  loading?: boolean;
}

export function DailySalesExpensesComboChart({ data, loading }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxExpenses = Math.max(...data.map(d => d.expenses), 0);
    const maxSales = Math.max(...data.map(d => d.sales), 0);
    const maxValue = Math.max(maxExpenses, maxSales);
    
    const profitDays = data.filter(d => d.profit_loss > 0).length;
    const lossDays = data.filter(d => d.profit_loss < 0).length;
    
    const avgExpenses = data.reduce((sum, d) => sum + d.expenses, 0) / data.length;
    const avgSales = data.reduce((sum, d) => sum + d.sales, 0) / data.length;

    return {
      maxValue,
      profitDays,
      lossDays,
      avgExpenses,
      avgSales,
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
          <BarChart3 className="w-5 h-5 text-primary-600" />
          Daily Sales & Expenses Trend
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for this period
        </div>
      </div>
    );
  }

  const { maxValue, profitDays, lossDays, avgExpenses, avgSales } = chartData;

  // Chart dimensions
  const chartWidth = 900;
  const chartHeight = 350;
  const padding = { top: 40, right: 50, bottom: 80, left: 70 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const barWidth = innerWidth / data.length;
  const yScale = innerHeight / (maxValue * 1.15); // *1.15 for padding at top

  // Generate grid lines (5 horizontal lines)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (innerHeight / 4) * i;
    const value = maxValue * 1.15 - (maxValue * 1.15 / 4) * i;
    gridLines.push({ y, value });
  }

  // Generate line path for sales
  const salesLinePath = data.map((point, index) => {
    const x = padding.left + (index * barWidth) + (barWidth / 2);
    const y = padding.top + innerHeight - (point.sales * yScale);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary-600" />
        Daily Sales & Expenses Trend
      </h3>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700">Daily Expenses (Bars)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-green-500"></div>
          <span className="text-gray-700">Daily Sales (Line)</span>
        </div>
      </div>

      {/* Combo Chart */}
      <div className="w-full overflow-x-auto bg-gray-50 rounded-lg p-4">
        <svg 
          width="100%" 
          height={chartHeight} 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-w-full"
          preserveAspectRatio="xMidYMid meet"
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

          {/* Expense Bars (Red) */}
          {data.map((point, index) => {
            const x = padding.left + (index * barWidth);
            const barHeight = point.expenses * yScale;
            const y = padding.top + innerHeight - barHeight;
            
            const date = new Date(point.date);
            const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <g key={`bar-${index}`}>
                {/* Expense Bar */}
                <rect
                  x={x + barWidth * 0.15}
                  y={y}
                  width={barWidth * 0.7}
                  height={Math.max(barHeight, 2)}
                  fill="#ef4444"
                  opacity="0.7"
                  rx="2"
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                >
                  <title>
                    {dayName} - Expenses
                    {'\n'}₹{point.expenses.toLocaleString()}
                    {'\n'}Petty Cash + Raw Materials
                  </title>
                </rect>

                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 25}
                  textAnchor="end"
                  fontSize="11"
                  fill="#4b5563"
                  fontWeight="500"
                  transform={`rotate(-45 ${x + barWidth / 2} ${chartHeight - padding.bottom + 25})`}
                >
                  {dayName}
                </text>
              </g>
            );
          })}

          {/* Sales Line (Green) - drawn on top */}
          <path
            d={salesLinePath}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />

          {/* Sales Line Points */}
          {data.map((point, index) => {
            const x = padding.left + (index * barWidth) + (barWidth / 2);
            const y = padding.top + innerHeight - (point.sales * yScale);
            const date = new Date(point.date);
            const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isProfit = point.profit_loss > 0;

            return (
              <g key={`point-${index}`}>
                {/* Outer circle */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="white"
                  stroke="#10b981"
                  strokeWidth="3"
                  className="cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                >
                  <title>
                    {dayName} - Sales
                    {'\n'}₹{point.sales.toLocaleString()}
                    {'\n'}P/L: {isProfit ? '+' : ''}₹{point.profit_loss.toLocaleString()}
                  </title>
                </circle>
                {/* Inner dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#10b981"
                  className="pointer-events-none"
                />
              </g>
            );
          })}

          {/* Y-axis label */}
          <text
            x={padding.left - 50}
            y={padding.top + innerHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#6b7280"
            fontWeight="600"
            transform={`rotate(-90 ${padding.left - 50} ${padding.top + innerHeight / 2})`}
          >
            Amount (₹)
          </text>
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">Avg Daily Expenses</span>
          </div>
          <p className="text-lg font-bold text-gray-900">₹{Math.round(avgExpenses).toLocaleString()}</p>
          <p className="text-xs text-gray-600">Per day</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Avg Daily Sales</span>
          </div>
          <p className="text-lg font-bold text-gray-900">₹{Math.round(avgSales).toLocaleString()}</p>
          <p className="text-xs text-gray-600">Per day</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Profit Days</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{profitDays}</p>
          <p className="text-xs text-gray-600">Sales &gt; Expenses</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">Loss Days</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{lossDays}</p>
          <p className="text-xs text-gray-600">Expenses &gt; Sales</p>
        </div>
      </div>
    </div>
  );
}
