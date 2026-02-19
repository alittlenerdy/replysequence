'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { DailyDataPoint } from '@/lib/types/analytics';

interface DualSeriesChartProps {
  meetings: DailyDataPoint[];
  followUps: DailyDataPoint[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 light:bg-white border border-gray-700 light:border-gray-200 rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-gray-400 light:text-gray-500 mb-1">{formatDate(label)}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <p key={p.name} className="text-white light:text-gray-900">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export function DualSeriesChart({ meetings, followUps }: DualSeriesChartProps) {
  // Merge into single array keyed by date
  const merged = meetings.map((m, i) => ({
    date: m.date,
    Meetings: m.count,
    'Follow-ups': followUps[i]?.count ?? 0,
  }));

  return (
    <div className="bg-gray-900/50 light:bg-white border border-gray-700 light:border-gray-200 rounded-2xl p-5 light:shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white light:text-gray-900">Meetings vs Follow-ups</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={merged} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
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
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="Meetings" fill="#6366F1" radius={[3, 3, 0, 0]} barSize={10} />
            <Bar dataKey="Follow-ups" fill="#F59E0B" radius={[3, 3, 0, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
