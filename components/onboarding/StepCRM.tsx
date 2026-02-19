'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2, ArrowRight, Database } from 'lucide-react';

interface StepCRMProps {
  crmConnected: boolean;
  onCRMConnected: () => void;
  onSkip: () => void;
}

export function StepCRM({
  crmConnected,
  onCRMConnected,
  onSkip,
}: StepCRMProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showAirtableForm, setShowAirtableForm] = useState(false);
  const [airtableApiKey, setAirtableApiKey] = useState('');
  const [airtableBaseId, setAirtableBaseId] = useState('');
  const [airtableError, setAirtableError] = useState<string | null>(null);

  const handleHubSpotConnect = () => {
    setConnecting('hubspot');
    sessionStorage.setItem('onboarding_crm', 'hubspot');
    const returnUrl = `/onboarding?step=5&crm_connected=true`;
    window.location.href = `/api/auth/hubspot?redirect=${encodeURIComponent(returnUrl)}`;
  };

  const handleAirtableConnect = async () => {
    if (!airtableApiKey || !airtableBaseId) {
      setAirtableError('API key and Base ID are required');
      return;
    }
    setAirtableError(null);
    setConnecting('airtable');
    try {
      const res = await fetch('/api/integrations/airtable/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: airtableApiKey,
          baseId: airtableBaseId,
          contactsTable: 'Contacts',
          meetingsTable: 'Meetings',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onCRMConnected();
      } else {
        setAirtableError(data.error || 'Failed to connect');
      }
    } catch {
      setAirtableError('Connection failed. Please check your credentials.');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <Database className="w-8 h-8 text-orange-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Sync meetings to your CRM
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Automatically log meetings, contacts, and sent emails.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        {/* HubSpot Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`relative rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
            crmConnected
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FF7A59]/10">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#FF7A59">
                  <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-2.212-2.212 2.21 2.21 0 00-2.212 2.212c0 .874.517 1.627 1.267 1.984v2.847a5.395 5.395 0 00-2.627 1.2L7.258 4.744a2.036 2.036 0 00.069-.493 2.035 2.035 0 00-2.035-2.035A2.035 2.035 0 003.257 4.25a2.035 2.035 0 002.035 2.035c.27 0 .527-.054.763-.15l6.324 4.324a5.418 5.418 0 00-.843 2.903c0 1.074.313 2.076.852 2.92l-2.038 2.04a1.95 1.95 0 00-.595-.094 1.97 1.97 0 00-1.968 1.968 1.97 1.97 0 001.968 1.968 1.97 1.97 0 001.968-1.968c0-.211-.034-.414-.095-.603l2.018-2.018a5.42 5.42 0 003.571 1.334 5.432 5.432 0 005.432-5.432 5.42 5.42 0 00-4.485-5.347zm-1.047 8.537a3.16 3.16 0 01-3.163-3.163 3.16 3.16 0 013.163-3.163 3.16 3.16 0 013.163 3.163 3.16 3.16 0 01-3.163 3.163z"/>
                </svg>
              </div>
              {crmConnected && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">HubSpot</h3>
            <p className="text-sm text-gray-400 mb-4">Sync meetings and emails to HubSpot CRM</p>
            <button
              onClick={handleHubSpotConnect}
              disabled={crmConnected || connecting !== null}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                crmConnected
                  ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                  : connecting === 'hubspot'
                  ? 'bg-gray-800 text-gray-400'
                  : 'text-white hover:opacity-90 bg-[#FF7A59]'
              }`}
            >
              {connecting === 'hubspot' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : crmConnected ? (
                'Connected'
              ) : (
                <>
                  Connect HubSpot
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Airtable Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`relative rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
            crmConnected
              ? 'border-emerald-500/50 bg-emerald-500/5'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#18BFFF]/10">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#18BFFF">
                  <path d="M11.52 2.386l-7.297 2.67a1.074 1.074 0 000 2.013l7.297 2.67a1.607 1.607 0 001.106 0l7.297-2.67a1.074 1.074 0 000-2.013l-7.297-2.67a1.607 1.607 0 00-1.106 0z"/>
                  <path d="M3.413 10.22l7.89 3.09a1.361 1.361 0 001.002 0l7.89-3.09.608 1.55-8.497 3.33a1.361 1.361 0 01-1.003 0l-8.497-3.33.608-1.55z"/>
                  <path d="M3.413 14.72l7.89 3.09a1.361 1.361 0 001.002 0l7.89-3.09.608 1.55-8.497 3.33a1.361 1.361 0 01-1.003 0l-8.497-3.33.608-1.55z"/>
                </svg>
              </div>
              {crmConnected && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Airtable</h3>
            <p className="text-sm text-gray-400 mb-4">Sync meeting data to your Airtable base</p>

            {showAirtableForm && !crmConnected ? (
              <div className="space-y-3">
                <input
                  type="password"
                  value={airtableApiKey}
                  onChange={(e) => setAirtableApiKey(e.target.value)}
                  placeholder="Personal Access Token (pat...)"
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={airtableBaseId}
                  onChange={(e) => setAirtableBaseId(e.target.value)}
                  placeholder="Base ID (appXXXXXXXXXX)"
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {airtableError && (
                  <p className="text-xs text-red-400">{airtableError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowAirtableForm(false); setAirtableError(null); }}
                    className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAirtableConnect}
                    disabled={connecting === 'airtable' || !airtableApiKey || !airtableBaseId}
                    className="flex-1 py-2 text-sm text-white bg-[#18BFFF] rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {connecting === 'airtable' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {connecting === 'airtable' ? 'Testing...' : 'Connect'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAirtableForm(true)}
                disabled={crmConnected || connecting !== null}
                className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  crmConnected
                    ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                    : 'text-white hover:opacity-90 bg-[#18BFFF]'
                }`}
              >
                {crmConnected ? 'Connected' : 'Configure Airtable'}
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Continue button when CRM is connected */}
      {crmConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={onCRMConnected}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
