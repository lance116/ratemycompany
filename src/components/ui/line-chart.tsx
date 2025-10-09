import React from 'react';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  className?: string;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  width = 400, 
  height = 200, 
  className = "" 
}) => {
  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  // Find min/max values for scaling
  const minX = Math.min(...data.map(d => d.x));
  const maxX = Math.max(...data.map(d => d.x));
  const minY = Math.min(...data.map(d => d.y));
  const maxY = Math.max(...data.map(d => d.y));

  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Scale data points to chart coordinates
  const scaleX = (x: number) => padding + ((x - minX) / (maxX - minX)) * chartWidth;
  const scaleY = (y: number) => padding + ((maxY - y) / (maxY - minY)) * chartHeight;

  // Generate path for the line
  const pathData = data
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(' ');

  // Generate circles for data points
  const circles = data.map((point, index) => {
    const x = scaleX(point.x);
    const y = scaleY(point.y);
    return (
      <circle
        key={index}
        cx={x}
        cy={y}
        r="4"
        fill="hsl(var(--primary))"
        className="hover:r-6 transition-all duration-200"
      />
    );
  });

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative ${className}`}>
      <svg width={width} height={height} className="overflow-visible">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Y-axis labels */}
        {[minY, (minY + maxY) / 2, maxY].map((value, index) => {
          const y = scaleY(value);
          return (
            <g key={index}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="text-xs fill-muted-foreground">
                {Math.round(value)}
              </text>
            </g>
          );
        })}
        
        {/* X-axis labels */}
        {data.length > 1 && (
          <>
            <text x={padding} y={height - 5} textAnchor="start" className="text-xs fill-muted-foreground">
              {formatTime(minX)}
            </text>
            <text x={width - padding} y={height - 5} textAnchor="end" className="text-xs fill-muted-foreground">
              {formatTime(maxX)}
            </text>
          </>
        )}
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {circles}
      </svg>
    </div>
  );
};
