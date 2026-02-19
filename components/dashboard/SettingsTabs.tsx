'use client';

import { useState } from 'react';
import { IntegrationSettings } from './IntegrationSettings';
import { EmailPreferencesSettings } from './EmailPreferencesSettings';
import { AICustomization } from './AICustomization';
import { AccountManagement } from './AccountManagement';

const tabs = [
  { id: 'integrations', label: 'Integrations' },
  { id: 'email', label: 'Email' },
  { id: 'ai', label: 'AI' },
  { id: 'account', label: 'Account' },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('integrations');

  return (
    <div>
      {/* Tab bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700/50 light:border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-700 light:bg-white text-white light:text-gray-900 shadow-sm'
                  : 'text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700 hover:bg-gray-700/50 light:hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content - keyed for re-mount animation on tab switch */}
      <div key={activeTab} className="animate-card-fade-in">
        {activeTab === 'integrations' && <IntegrationSettings />}
        {activeTab === 'email' && (
          <div className="max-w-4xl mx-auto">
            <EmailPreferencesSettings />
          </div>
        )}
        {activeTab === 'ai' && <AICustomization />}
        {activeTab === 'account' && <AccountManagement />}
      </div>
    </div>
  );
}
