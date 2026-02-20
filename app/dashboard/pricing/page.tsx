import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Plan & Billing | ReplySequence',
  description: 'Manage your ReplySequence subscription plan.',
};

export default function DashboardPricingPage() {
  redirect('/dashboard/billing');
}
