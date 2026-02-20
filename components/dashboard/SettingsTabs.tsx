'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sparkles, Plug, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { IntegrationSettings } from './IntegrationSettings';
import { EmailPreferencesSettings } from './EmailPreferencesSettings';
import { AICustomization } from './AICustomization';
import { AccountManagement } from './AccountManagement';

const tabs = [
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'account', label: 'Account', icon: User },
] as const;

type TabId = (typeof tabs)[number]['id'];

export function SettingsTabs() {
  const searchParams = useSearchParams();
  // Auto-switch to integrations tab when returning from OAuth with ?connected= or ?success=
  const hasConnectionParam = searchParams.get('connected') || searchParams.get('success');
  const initialTab = (searchParams.get('tab') as TabId) || (hasConnectionParam ? 'integrations' : 'ai');
  const [activeTab, setActiveTab] = useState<TabId>(
    tabs.some(t => t.id === initialTab) ? initialTab : 'ai'
  );
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Detect when the tab bar becomes sticky
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-64px 0px 0px 0px' } // 64px = top-16 dashboard header
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      {/* Sentinel element to detect sticky state */}
      <div ref={sentinelRef} className="h-0" />

      {/* Sticky tab bar */}
      <div className={`sticky top-16 z-30 transition-all duration-200 ${
        isStuck
          ? 'bg-[var(--bg-page,#0a0a0a)]/95 backdrop-blur-md border-b border-gray-700/50 light:border-gray-200 py-2'
          : 'py-0'
      }`}>
        <div className={`${activeTab === 'ai' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto mb-6 transition-all duration-300`}>
          <div className="relative flex gap-1 p-1 rounded-xl bg-gray-800/50 light:bg-gray-100 border border-gray-700/50 light:border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex-1 min-w-0 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${
                  activeTab === tab.id
                    ? tab.id === 'ai'
                      ? 'text-indigo-300 light:text-indigo-700'
                      : 'text-white light:text-gray-900'
                    : tab.id === 'ai'
                      ? 'text-indigo-400 light:text-indigo-500 hover:text-indigo-300 light:hover:text-indigo-600 hover:bg-indigo-500/10 light:hover:bg-indigo-50'
                      : 'text-gray-400 light:text-gray-500 hover:text-gray-200 light:hover:text-gray-700 hover:bg-gray-700/50 light:hover:bg-gray-50'
                }`}
              >
                {/* Animated background indicator */}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="settings-tab-indicator"
                    className={`absolute inset-0 rounded-lg shadow-sm ${
                      tab.id === 'ai'
                        ? 'bg-indigo-600/20 light:bg-indigo-50 border border-indigo-500/30 light:border-indigo-300'
                        : 'bg-gray-700 light:bg-white'
                    }`}
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
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
