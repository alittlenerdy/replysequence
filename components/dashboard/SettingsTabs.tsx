'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { IntegrationSettings } from './IntegrationSettings';
import { EmailPreferencesSettings } from './EmailPreferencesSettings';
import { AICustomization } from './AICustomization';
import { AccountManagement } from './AccountManagement';

const tabs = [
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'integrations', label: 'Integrations', icon: null },
  { id: 'email', label: 'Email', icon: null },
  { id: 'account', label: 'Account', icon: null },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function SettingsTabs() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as TabId) || 'ai';
  const [activeTab, setActiveTab] = useState<TabId>(
    tabs.some(t => t.id === initialTab) ? initialTab : 'ai'
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700/50 light:border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? tab.id === 'ai'
                    ? 'bg-indigo-600/20 light:bg-indigo-50 text-indigo-300 light:text-indigo-700 shadow-sm border border-indigo-500/30 light:border-indigo-300'
                    : 'bg-gray-700 light:bg-white text-white light:text-gray-900 shadow-sm'
                  : tab.id === 'ai'
                    ? 'text-indigo-400 light:text-indigo-500 hover:text-indigo-300 light:hover:text-indigo-600 hover:bg-indigo-500/10 light:hover:bg-indigo-50'
                    : 'text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700 hover:bg-gray-700/50 light:hover:bg-gray-50'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content - keyed for re-mount animation on tab switch */}
      <div key={activeTab} className="animate-card-fade-in">
        {activeTab === 'ai' && <AICustomization />}
        {activeTab === 'integrations' && <IntegrationSettings />}
        {activeTab === 'email' && (
          <div className="max-w-4xl mx-auto">
            <EmailPreferencesSettings />
          </div>
        )}
        {activeTab === 'account' && <AccountManagement />}
      </div>
    </div>
  );
}
