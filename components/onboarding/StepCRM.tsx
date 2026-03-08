'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2, ArrowRight, Database } from 'lucide-react';

interface StepCRMProps {
  crmConnected: boolean;
  hubspotConnected: boolean;
  salesforceConnected: boolean;
  sheetsConnected: boolean;
  onCRMConnected: (crmType?: 'hubspot' | 'salesforce' | 'sheets' | null) => void;
  onSkip: () => void;
}

export function StepCRM({
  crmConnected,
  hubspotConnected,
  salesforceConnected,
  sheetsConnected,
  onCRMConnected,
  onSkip,
}: StepCRMProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleHubSpotConnect = () => {
    setConnecting('hubspot');
    sessionStorage.setItem('onboarding_crm', 'hubspot');
    const returnUrl = `/onboarding?step=5&crm_connected=true`;
    window.location.href = `/api/auth/hubspot?redirect=${encodeURIComponent(returnUrl)}`;
  };

  const handleSalesforceConnect = () => {
    setConnecting('salesforce');
    sessionStorage.setItem('onboarding_crm', 'salesforce');
    const returnUrl = `/onboarding?step=5&crm_connected=true`;
    window.location.href = `/api/auth/salesforce?redirect=${encodeURIComponent(returnUrl)}`;
  };

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 flex items-center justify-center mx-auto mb-6"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-6">
        {/* HubSpot Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`relative rounded-2xl bg-gray-900/50 border transition-[border-color,background-color] duration-300 overflow-hidden ${
            hubspotConnected
              ? 'border-indigo-500/50 bg-indigo-500/5'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#FF7A59]/10">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#FF7A59" aria-hidden="true">
                  <path d="M18.164 7.93V5.084a2.198 2.198 0 001.267-1.984 2.21 2.21 0 00-2.212-2.212 2.21 2.21 0 00-2.212 2.212c0 .874.517 1.627 1.267 1.984v2.847a5.395 5.395 0 00-2.627 1.2L7.258 4.744a2.036 2.036 0 00.069-.493 2.035 2.035 0 00-2.035-2.035A2.035 2.035 0 003.257 4.25a2.035 2.035 0 002.035 2.035c.27 0 .527-.054.763-.15l6.324 4.324a5.418 5.418 0 00-.843 2.903c0 1.074.313 2.076.852 2.92l-2.038 2.04a1.95 1.95 0 00-.595-.094 1.97 1.97 0 00-1.968 1.968 1.97 1.97 0 001.968 1.968 1.97 1.97 0 001.968-1.968c0-.211-.034-.414-.095-.603l2.018-2.018a5.42 5.42 0 003.571 1.334 5.432 5.432 0 005.432-5.432 5.42 5.42 0 00-4.485-5.347zm-1.047 8.537a3.16 3.16 0 01-3.163-3.163 3.16 3.16 0 013.163-3.163 3.16 3.16 0 013.163 3.163 3.16 3.16 0 01-3.163 3.163z"/>
                </svg>
              </div>
              {hubspotConnected && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">HubSpot</h3>
            <p className="text-sm text-gray-400 mb-4">Sync meetings and emails to HubSpot CRM</p>
            <button
              onClick={handleHubSpotConnect}
              disabled={hubspotConnected || connecting !== null}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-[color,background-color,opacity] duration-200 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                hubspotConnected
                  ? 'bg-indigo-500/10 text-indigo-400 cursor-default'
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
              ) : hubspotConnected ? (
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

        {/* Salesforce Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`relative rounded-2xl bg-gray-900/50 border transition-[border-color,background-color] duration-300 overflow-hidden ${
            salesforceConnected
              ? 'border-indigo-500/50 bg-indigo-500/5'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#00A1E0]/10">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#00A1E0" aria-hidden="true">
                  <path d="M10.005 3.073a4.17 4.17 0 013.58.21 4.892 4.892 0 014.652-.562 4.858 4.858 0 012.882 3.375 3.91 3.91 0 012.312 1.899A3.87 3.87 0 0124 9.682a3.886 3.886 0 01-1.542 3.112 4.32 4.32 0 01-1.17 5.51 4.36 4.36 0 01-5.152.26 4.62 4.62 0 01-5.796 1.233 4.58 4.58 0 01-2.094-2.15 5.218 5.218 0 01-5.652-1.6A5.17 5.17 0 011.5 12.54a5.2 5.2 0 012.058-4.125A4.94 4.94 0 013.08 5.4a4.92 4.92 0 016.925-2.327z"/>
                </svg>
              </div>
              {salesforceConnected && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Salesforce</h3>
            <p className="text-sm text-gray-400 mb-4">Sync meetings and email activity to Salesforce CRM</p>
            <button
              onClick={handleSalesforceConnect}
              disabled={salesforceConnected || connecting !== null}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-[color,background-color,opacity] duration-200 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                salesforceConnected
                  ? 'bg-indigo-500/10 text-indigo-400 cursor-default'
                  : connecting === 'salesforce'
                  ? 'bg-gray-800 text-gray-400'
                  : 'text-white hover:opacity-90 bg-[#00A1E0]'
              }`}
            >
              {connecting === 'salesforce' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : salesforceConnected ? (
                'Connected'
              ) : (
                <>
                  Connect Salesforce
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Google Sheets Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`relative rounded-2xl bg-gray-900/50 border transition-[border-color,background-color] duration-300 overflow-hidden ${
            sheetsConnected
              ? 'border-indigo-500/50 bg-indigo-500/5'
              : 'border-gray-700 hover:border-gray-600'
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#34A853]/10">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#34A853" aria-hidden="true">
                  <path d="M19 11H5v8a2 2 0 002 2h10a2 2 0 002-2v-8zm-3 6H8v-2h8v2zm0-4H8v-2h8v2zM19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5a2 2 0 00-2 2v4h18V5a2 2 0 00-2-2zm-7 2a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </div>
              {sheetsConnected && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Google Sheets</h3>
            <p className="text-sm text-gray-400 mb-4">Sync meeting data to a spreadsheet</p>
            <button
              onClick={() => {
                setConnecting('sheets');
                sessionStorage.setItem('onboarding_crm', 'sheets');
                const returnUrl = `/onboarding?step=5&crm_connected=true`;
                window.location.href = `/api/auth/sheets?redirect=${encodeURIComponent(returnUrl)}`;
              }}
              disabled={sheetsConnected || connecting !== null}
              className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-[color,background-color,opacity] duration-200 flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                sheetsConnected
                  ? 'bg-indigo-500/10 text-indigo-400 cursor-default'
                  : connecting === 'sheets'
                  ? 'bg-gray-800 text-gray-400'
                  : 'text-white hover:opacity-90 bg-[#34A853]'
              }`}
            >
              {connecting === 'sheets' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to Google...
                </>
              ) : sheetsConnected ? (
                'Connected'
              ) : (
                <>
                  Connect Google Sheets
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
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
            onClick={() => onCRMConnected()}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-[color,background-color,box-shadow] duration-300 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
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
          className="text-sm text-gray-500 hover:text-gray-400 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
