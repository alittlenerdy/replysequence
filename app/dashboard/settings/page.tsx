import { IntegrationSettings } from '@/components/dashboard/IntegrationSettings';
import { EmailPreferencesSettings } from '@/components/dashboard/EmailPreferencesSettings';
import { AccountManagement } from '@/components/dashboard/AccountManagement';
import { AICustomization } from '@/components/dashboard/AICustomization';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Settings | ReplySequence',
  description: 'Manage your integrations, preferences, and account',
};

export default function SettingsPage() {
  return (
    <>
      <div className="max-w-2xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-white light:text-gray-900">Settings</h2>
        <p className="text-gray-400 light:text-gray-500 mt-1">Manage your integrations, preferences, and account</p>
      </div>
      <IntegrationSettings />
      <div className="max-w-2xl mx-auto mt-8">
        <EmailPreferencesSettings />
      </div>
      <AICustomization />
      <AccountManagement />
    </>
  );
}
