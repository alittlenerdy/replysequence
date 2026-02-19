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
                    ? 'bg-purple-600/20 light:bg-purple-50 text-purple-300 light:text-purple-700 shadow-sm border border-purple-500/30 light:border-purple-300'
                    : 'bg-gray-700 light:bg-white text-white light:text-gray-900 shadow-sm'
                  : tab.id === 'ai'
                    ? 'text-purple-400 light:text-purple-500 hover:text-purple-300 light:hover:text-purple-600 hover:bg-purple-500/10 light:hover:bg-purple-50'
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
