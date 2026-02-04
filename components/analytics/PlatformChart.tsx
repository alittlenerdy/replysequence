'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Video } from 'lucide-react';

interface PlatformStat {
  platform: string;
  count: number;
  color: string;
}

interface PlatformChartProps {
  data: PlatformStat[];
}

// Platform icons as SVG paths for consistency
const PlatformIcon = ({ platform }: { platform: string }) => {
  const p = platform.toLowerCase();

  if (p === 'zoom') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4.585 6.836C3.71 6.836 3 7.547 3 8.42v7.16c0 .872.71 1.584 1.585 1.584h9.83c.875 0 1.585-.712 1.585-1.585V8.42c0-.872-.71-1.585-1.585-1.585H4.585zm12.415 2.11l3.96-2.376c.666-.4 1.04-.266 1.04.56v9.74c0 .826-.374.96-1.04.56L17 15.054V8.946z"/>
      </svg>
    );
  }

  if (p === 'teams') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.625 8.5h-6.25a.625.625 0 00-.625.625v6.25c0 .345.28.625.625.625h6.25c.345 0 .625-.28.625-.625v-6.25a.625.625 0 00-.625-.625zM17.5 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM12.5 8a3 3 0 100-6 3 3 0 000 6zm0 1c-2.21 0-4 1.567-4 3.5V15h8v-2.5c0-1.933-1.79-3.5-4-3.5z"/>
      </svg>
    );
  }

  if (p === 'meet') {
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
        <path d="M15.29 15.71L18 18.41V5.59l-2.71 2.7A5.977 5.977 0 0112 7c-1.38 0-2.65.47-3.66 1.26L14.59 2H5a2 2 0 00-2 2v16a2 2 0 002 2h14a2 2 0 002-2V9.41l-5.71 6.3zM6 10a6 6 0 1112 0 6 6 0 01-12 0z"/>
      </svg>
    );
  }

  return <Video className="w-4 h-4" />;
};

// Custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: PlatformStat }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-sm text-white font-medium">{data.platform}</span>
      </div>
      <p className="text-lg font-bold text-white mt-1">{data.count} meetings</p>
    </div>
  );
}

export function PlatformChart({ data }: PlatformChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const hasData = total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-gray-900/50 border border-gray-700 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400">Platform Distribution</h3>
        <p className="text-2xl font-bold text-white mt-1">{total} total</p>
      </div>

      {hasData ? (
        <div className="flex items-center gap-6">
          {/* Donut Chart */}
          <div className="w-[120px] h-[120px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="count"
                  animationDuration={1000}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white">{total}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-3">
            {data.map((item) => {
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.platform} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <div style={{ color: item.color }}>
                      <PlatformIcon platform={item.platform} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">{item.platform}</span>
                      <span className="text-sm text-gray-400">{percentage}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="h-[120px] flex items-center justify-center">
          <p className="text-gray-500 text-sm">Connect a platform to see distribution</p>
        </div>
      )}
    </motion.div>
  );
}
