import { useMemo } from 'react';
import { CreditCard } from 'lucide-react';
import { getPaymentMethodColor, getPaymentMethodLabel, formatCurrency, calculatePercentage } from '../../utils/chartHelpers';

interface PaymentData {
  payment_method: string;
  total_amount: number;
  transaction_count: number;
}

interface Props {
  data: PaymentData[];
  loading?: boolean;
  onSegmentClick?: (paymentMethod: string) => void;
}

export function PaymentMethodsPieChart({ data, loading, onSegmentClick }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const total = data.reduce((sum, item) => sum + Number(item.total_amount), 0);
    
    let currentAngle = -90; // Start from top
    const segments = data.map(item => {
      const value = Number(item.total_amount);
      const percentage = calculatePercentage(value, total);
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      return {
        method: item.payment_method,
        amount: value,
        count: item.transaction_count,
        percentage,
        startAngle,
        endAngle,
        color: getPaymentMethodColor(item.payment_method),
        label: getPaymentMethodLabel(item.payment_method),
      };
    });

    return { segments, total };
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
          <CreditCard className="w-5 h-5 text-primary-600" />
          Payment Methods Distribution
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No payment data available for this period
        </div>
      </div>
    );
  }

  const { segments, total } = chartData;

  // SVG circle parameters - increased size for better visibility
  const size = 280;
  const center = size / 2;
  const radius = 110;
  const innerRadius = 65; // For donut hole

  // Function to calculate arc path for donut chart
  const getArcPath = (startAngle: number, endAngle: number) => {
    const outerStart = polarToCartesian(center, center, radius, endAngle);
    const outerEnd = polarToCartesian(center, center, radius, startAngle);
    const innerStart = polarToCartesian(center, center, innerRadius, endAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M', outerStart.x, outerStart.y,
      'A', radius, radius, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
      'L', innerEnd.x, innerEnd.y,
      'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      'Z'
    ].join(' ');
  };

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-secondary-900 mb-4 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-primary-600" />
        Payment Methods Distribution
      </h3>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 bg-gray-50 rounded-lg p-6">
        {/* Pie Chart */}
        <div className="relative flex-shrink-0">
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`}
            className="drop-shadow-md"
          >
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius + 5}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            
            {/* Pie segments */}
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={getArcPath(segment.startAngle, segment.endAngle)}
                  fill={segment.color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-90 hover:scale-105 transition-all cursor-pointer"
                  style={{ 
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.1))',
                    transformOrigin: `${center}px ${center}px`
                  }}
                  onClick={() => onSegmentClick?.(segment.method)}
                >
                  <title>
                    {segment.label}
                    {'\n'}{formatCurrency(segment.amount)} ({segment.percentage.toFixed(1)}%)
                    {'\n'}{segment.count} transactions
                    {'\n'}Click to view details
                  </title>
                </path>
                
                {/* Percentage labels on segments (only if segment is large enough) */}
                {segment.percentage > 10 && (() => {
                  const midAngle = (segment.startAngle + segment.endAngle) / 2;
                  const labelRadius = (radius + innerRadius) / 2;
                  const labelPos = polarToCartesian(center, center, labelRadius, midAngle);
                  return (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="14"
                      fill="white"
                      fontWeight="bold"
                      className="pointer-events-none"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
                    >
                      {segment.percentage.toFixed(0)}%
                    </text>
                  );
                })()}
              </g>
            ))}
            
            {/* Center circle (donut hole) */}
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="white"
              stroke="#e5e7eb"
              strokeWidth="2"
            />
            
            {/* Center text */}
            <text
              x={center}
              y={center - 12}
              textAnchor="middle"
              fontSize="14"
              fill="#6b7280"
              fontWeight="600"
            >
              Total
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              fontSize="20"
              fill="#111827"
              fontWeight="bold"
            >
              {formatCurrency(total)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="space-y-4 min-w-[200px]">
          {segments.map((segment, index) => (
            <div 
              key={index} 
              className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer hover:scale-105"
              onClick={() => onSegmentClick?.(segment.method)}
              title="Click to view transactions"
            >
              <div
                className="w-5 h-5 rounded flex-shrink-0 mt-0.5"
                style={{ 
                  backgroundColor: segment.color,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{segment.label}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(segment.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-600">
                    {segment.count} transaction{segment.count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {segment.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
