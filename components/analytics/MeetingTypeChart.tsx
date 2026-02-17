'use client';

import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface MeetingTypeStat {
  type: string;
  count: number;
  color: string;
}

interface MeetingTypeChartProps {
  data: MeetingTypeStat[];
}

// Meeting type icons
const TypeIcon = ({ type }: { type: string }) => {
  const t = type.toLowerCase();

  if (t === 'sales') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (t === 'internal') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  if (t === 'client') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    );
  }
  if (t === 'technical') {
    return (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: MeetingTypeStat }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-gray-900 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-sm text-white light:text-gray-900 font-medium">{data.type}</span>
      </div>
      <p className="text-lg font-bold text-white light:text-gray-900 mt-1">{data.count} drafts</p>
    </div>
  );
}

export function MeetingTypeChart({ data }: MeetingTypeChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const hasData = total > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-6 light:shadow-sm"
    >
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 light:text-gray-500">Meeting Types</h3>
        <p className="text-2xl font-bold text-white light:text-gray-900 mt-1">{total} drafts</p>
      </div>

      {hasData ? (
        <div className="flex items-center gap-6">
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
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold text-white light:text-gray-900">{total}</span>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {data.map((item) => {
              const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <div style={{ color: item.color }}>
                      <TypeIcon type={item.type} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white light:text-gray-900 font-medium">{item.type}</span>
                      <span className="text-sm text-gray-400 light:text-gray-500">{percentage}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-800 light:bg-gray-200 rounded-full overflow-hidden">
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
          <p className="text-gray-500 text-sm">Generate drafts to see meeting type breakdown</p>
        </div>
      )}
    </motion.div>
  );
}
