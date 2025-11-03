import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  date: string;
  sales: number;
  costs: number;
  profit_loss: number;
}

interface Props {
  data: DataPoint[];
  loading?: boolean;
}

export function ProfitLossLineChart({ data, loading }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const profitDays = data.filter(d => d.profit_loss > 0).length;
    const lossDays = data.filter(d => d.profit_loss < 0).length;
    const breakEvenDays = data.filter(d => d.profit_loss === 0).length;
    
    const totalProfit = data.reduce((sum, d) => sum + (d.profit_loss > 0 ? d.profit_loss : 0), 0);
    const totalLoss = data.reduce((sum, d) => sum + (d.profit_loss < 0 ? Math.abs(d.profit_loss) : 0), 0);
    const netTotal = data.reduce((sum, d) => sum + d.profit_loss, 0);

    const maxProfit = Math.max(...data.map(d => d.profit_loss > 0 ? d.profit_loss : 0), 0);
    const maxLoss = Math.abs(Math.min(...data.map(d => d.profit_loss < 0 ? d.profit_loss : 0), 0));
    const maxValue = Math.max(maxProfit, maxLoss);

    return {
      profitDays,
      lossDays,
      breakEvenDays,
      totalProfit,
      totalLoss,
      netTotal,
      maxValue,
      maxProfit,
      maxLoss,
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
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Daily Profit/Loss Trend
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available for this period
        </div>
      </div>
    );
  }

  const { profitDays, lossDays, breakEvenDays, totalProfit, totalLoss, netTotal, maxValue } = chartData;

  // Chart dimensions - increased for better spacing
  const chartWidth = 900;
  const chartHeight = 350;
  const padding = { top: 40, right: 50, bottom: 80, left: 70 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate scales
  const barWidth = innerWidth / data.length;
  const yScale = innerHeight / (maxValue * 2.2); // *2.2 for some padding at top/bottom
  const zeroY = padding.top + innerHeight / 2; // Middle of chart is zero

  // Generate line path
  const linePath = data.map((point, index) => {
    const x = padding.left + (index * barWidth) + (barWidth / 2);
    const y = zeroY - (point.profit_loss * yScale);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Calculate grid lines (5 horizontal lines)
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (innerHeight / 4) * i;
    const value = maxValue * 1.1 - (maxValue * 2.2 / 4) * i;
    gridLines.push({ y, value });
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary-600" />
        Daily Profit/Loss Trend
      </h3>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">Profit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-700">Loss</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-blue-500"></div>
          <span className="text-gray-700">Trend Line</span>
        </div>
      </div>

      {/* Combo Chart (Bars + Line) */}
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
                stroke={i === 2 ? '#9ca3af' : '#e5e7eb'}
                strokeWidth={i === 2 ? '2' : '1'}
                strokeDasharray={i === 2 ? '5 5' : '0'}
              />
              <text
                x={padding.left - 10}
                y={line.y + 4}
                textAnchor="end"
                fontSize="11"
                fill="#6b7280"
                fontWeight={i === 2 ? 'bold' : 'normal'}
              >
                {i === 2 ? '₹0' : `₹${Math.round(line.value).toLocaleString()}`}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((point, index) => {
            const x = padding.left + (index * barWidth);
            const barHeight = Math.abs(point.profit_loss * yScale);
            const y = point.profit_loss >= 0 ? zeroY - barHeight : zeroY;
            const isProfit = point.profit_loss > 0;
            const isBreakEven = point.profit_loss === 0;
            const date = new Date(point.date);
            const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <g key={index}>
                {/* Bar with better spacing */}
                <rect
                  x={x + barWidth * 0.15}
                  y={y}
                  width={barWidth * 0.7}
                  height={Math.max(barHeight, 2)}
                  fill={isBreakEven ? '#9ca3af' : isProfit ? '#10b981' : '#ef4444'}
                  opacity="0.85"
                  rx="2"
                  className="hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))' }}
                >
                  <title>
                    {dayName}
                    {'\n'}Sales: ₹{point.sales.toLocaleString()}
                    {'\n'}Costs: ₹{point.costs.toLocaleString()}
                    {'\n'}P/L: {isProfit ? '+' : ''}₹{point.profit_loss.toLocaleString()}
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

          {/* Line connecting points - drawn on top of bars */}
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />

          {/* Points on line with better visibility */}
          {data.map((point, index) => {
            const x = padding.left + (index * barWidth) + (barWidth / 2);
            const y = zeroY - (point.profit_loss * yScale);
            const date = new Date(point.date);
            const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <g key={`point-${index}`}>
                {/* Outer circle for better visibility */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="white"
                  stroke="#2563eb"
                  strokeWidth="3"
                  className="cursor-pointer"
                  style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}
                >
                  <title>
                    {dayName}: {point.profit_loss >= 0 ? '+' : ''}₹{point.profit_loss.toLocaleString()}
                  </title>
                </circle>
                {/* Inner dot */}
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill="#2563eb"
                  className="pointer-events-none"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Profit Days</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{profitDays}</p>
          <p className="text-xs text-gray-600">₹{totalProfit.toLocaleString()}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-medium">Loss Days</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{lossDays}</p>
          <p className="text-xs text-gray-600">₹{totalLoss.toLocaleString()}</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
            <Minus className="w-4 h-4" />
            <span className="text-xs font-medium">Break-even</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{breakEvenDays}</p>
        </div>
        
        <div className="text-center">
          <div className="text-xs font-medium text-gray-600 mb-1">Net Total</div>
          <p className={`text-lg font-bold ${netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netTotal >= 0 && '+'}₹{netTotal.toLocaleString()}
          </p>
          <p className="text-xs text-gray-600">{data.length} days</p>
        </div>
      </div>
    </div>
  );
}
