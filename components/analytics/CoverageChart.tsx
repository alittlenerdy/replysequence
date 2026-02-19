'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';
import type { DailyCoverage } from '@/lib/types/analytics';

interface CoverageChartProps {
  data: DailyCoverage[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as DailyCoverage;
  return (
    <div className="bg-gray-900 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 light:text-gray-500 mb-1">{formatDate(label)}</p>
      <p className="text-white light:text-gray-900 font-medium">
        {d.coveragePercent}% coverage
      </p>
      <p className="text-gray-500">
        {d.followedUpCount} of {d.meetingsCount} meetings
      </p>
    </div>
  );
}

export function CoverageChart({ data }: CoverageChartProps) {
  // Only show data points where there were meetings (avoids misleading 100% on zero-meeting days)
  const chartData = data.map(d => ({
    ...d,
    displayCoverage: d.meetingsCount > 0 ? d.coveragePercent : null,
  }));

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 light:shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white light:text-gray-900">Follow-up Coverage</h3>
        <span className="text-xs text-gray-500">Daily %</span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="coverageGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={90}
              stroke="#F59E0B"
              strokeDasharray="6 4"
              strokeOpacity={0.6}
              label={{
                value: '90% target',
                position: 'insideTopRight',
                fill: '#F59E0B',
                fontSize: 10,
                opacity: 0.7,
              }}
            />
            <Area
              type="monotone"
              dataKey="displayCoverage"
              stroke="#6366F1"
              strokeWidth={2}
              fill="url(#coverageGradient)"
              connectNulls
              dot={false}
              activeDot={{ r: 4, fill: '#6366F1' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
