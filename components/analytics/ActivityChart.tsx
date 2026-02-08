'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DataPoint {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  title: string;
  color: string;
  gradientId: string;
}

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: DataPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const date = new Date(label || '');
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="bg-gray-900 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-gray-400 light:text-gray-500">{formattedDate}</p>
      <p className="text-lg font-bold text-white light:text-gray-900">{payload[0]?.value}</p>
    </div>
  );
}

export function ActivityChart({ data, title, color, gradientId }: ActivityChartProps) {
  // Calculate trend
  const trend = useMemo(() => {
    if (data.length < 2) return { direction: 'neutral', percentage: 0 };

    const midpoint = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, midpoint).reduce((sum, d) => sum + d.count, 0);
    const secondHalf = data.slice(midpoint).reduce((sum, d) => sum + d.count, 0);

    if (firstHalf === 0 && secondHalf === 0) return { direction: 'neutral', percentage: 0 };
    if (firstHalf === 0) return { direction: 'up', percentage: 100 };

    const change = ((secondHalf - firstHalf) / firstHalf) * 100;
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change)),
    };
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const hasData = total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-400 light:text-gray-500">{title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-white light:text-gray-900">{total}</span>
            {hasData && (
              <span
                className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                  trend.direction === 'up'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : trend.direction === 'down'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}
              >
                {trend.direction === 'up' && <TrendingUp className="w-3 h-3" />}
                {trend.direction === 'down' && <TrendingDown className="w-3 h-3" />}
                {trend.direction === 'neutral' && <Minus className="w-3 h-3" />}
                {trend.percentage}%
              </span>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500">Last 14 days</span>
      </div>

      {/* Chart */}
      <div className="h-[140px]">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10 }}
                tickFormatter={(value) => {
                  const d = new Date(value);
                  return d.getDate().toString();
                }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 10 }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center"
          >
            {/* Empty chart visualization */}
            <div className="flex items-end gap-1 mb-3 opacity-30">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 16 }}
                transition={{ delay: 0.1 }}
                className="w-4 rounded-t"
                style={{ backgroundColor: color }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 24 }}
                transition={{ delay: 0.2 }}
                className="w-4 rounded-t"
                style={{ backgroundColor: color }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 12 }}
                transition={{ delay: 0.3 }}
                className="w-4 rounded-t"
                style={{ backgroundColor: color }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 32 }}
                transition={{ delay: 0.4 }}
                className="w-4 rounded-t"
                style={{ backgroundColor: color }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 20 }}
                transition={{ delay: 0.5 }}
                className="w-4 rounded-t"
                style={{ backgroundColor: color }}
              />
            </div>
            <p className="text-gray-500 text-sm text-center">
              Data will appear here after your first meeting
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
