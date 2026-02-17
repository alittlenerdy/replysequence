import { BillingDashboard } from '@/components/billing/BillingDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Billing | ReplySequence',
  description: 'Manage your subscription and billing',
};

export default function BillingPage() {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Billing & Subscription</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Manage your subscription and payment details</p>
      </div>
      <BillingDashboard />
    </>
  );
}
