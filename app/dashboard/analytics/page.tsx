import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Analytics | ReplySequence',
  description: 'Track your meeting follow-up performance',
};

export default function AnalyticsPage() {
  return <AnalyticsDashboard />;
}
