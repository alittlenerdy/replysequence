# Onboarding Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure the 5-step onboarding into a 6-step flow that emphasizes email connection and AI voice setup as core features, replacing the calendar and test-draft steps.

**Architecture:** The onboarding orchestrator (`app/onboarding/page.tsx`) manages step state and persistence. Each step is an independent component receiving callbacks. OAuth flows redirect back to `/onboarding` with query params. AI preferences save via existing `PUT /api/user/preferences`. DB migration adds two boolean columns to `user_onboarding`.

**Tech Stack:** Next.js 16, React, Framer Motion, Drizzle ORM, PostgreSQL, Clerk auth, Lucide icons

**Design Doc:** `docs/plans/2026-02-19-onboarding-redesign-design.md`

---

## Task 1: Database Migration

**Files:**
- Create: `drizzle/0030_add_onboarding_email_crm.sql` (or next sequential number)
- Modify: `lib/db/schema.ts:801-820`

**Step 1: Check current migration numbering**

Run: `ls drizzle/*.sql | tail -5`
Expected: See the latest migration number to determine next sequence number.

**Step 2: Create the SQL migration file**

```sql
ALTER TABLE "user_onboarding" ADD COLUMN "email_connected" boolean NOT NULL DEFAULT false;
ALTER TABLE "user_onboarding" ADD COLUMN "crm_connected" boolean NOT NULL DEFAULT false;
```

**Step 3: Update the Drizzle schema**

In `lib/db/schema.ts`, inside the `userOnboarding` table definition (around line 809, after the `calendarConnected` column), add:

```typescript
emailConnected: boolean('email_connected').notNull().default(false),
crmConnected: boolean('crm_connected').notNull().default(false),
```

**Step 4: Push schema to database**

Run: `npm run db:push`
Expected: Schema changes applied successfully, no errors.

**Step 5: Commit**

```
git add drizzle/ lib/db/schema.ts
git commit -m "feat: add emailConnected and crmConnected columns to user_onboarding"
```

---

## Task 2: Create StepEmailConnect Component

**Files:**
- Create: `components/onboarding/StepEmailConnect.tsx`

This component follows the exact same pattern as `StepConnectCalendar.tsx` (two-card grid, OAuth redirect, skip warning) but for Gmail/Outlook email connections.

**Step 1: Create the component file**

```tsx
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ExternalLink, Loader2, AlertTriangle, Mail } from 'lucide-react';

interface StepEmailConnectProps {
  emailConnected: boolean;
  connectedEmail: string | null;
  onEmailConnected: () => void;
  onSkip: () => void;
}

export function StepEmailConnect({
  emailConnected,
  connectedEmail,
  onEmailConnected,
  onSkip,
}: StepEmailConnectProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showSkipWarning, setShowSkipWarning] = useState(false);

  const handleConnect = (provider: 'gmail' | 'outlook') => {
    setConnecting(provider);
    sessionStorage.setItem('onboarding_email', provider);
    const returnUrl = `/onboarding?step=3&email_connected=true`;

    if (provider === 'gmail') {
      window.location.href = `/api/auth/gmail?redirect=${encodeURIComponent(returnUrl)}`;
    } else {
      window.location.href = `/api/auth/outlook?redirect=${encodeURIComponent(returnUrl)}`;
    }
  };

  const providers = [
    {
      id: 'gmail' as const,
      name: 'Gmail',
      description: 'Send follow-ups from your Gmail address',
      color: '#EA4335',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
    {
      id: 'outlook' as const,
      name: 'Outlook',
      description: 'Send follow-ups from your Outlook address',
      color: '#0078D4',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#0078D4">
          <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20m0-2H4c-1.11 0-2 .89-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <Mail className="w-8 h-8 text-blue-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Send emails from your inbox
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Connect your email so follow-ups come from you, not a generic noreply address.
          Recipients are 3x more likely to open emails from real people.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
        {providers.map((provider, index) => {
          const isConnecting = connecting === provider.id;

          return (
            <motion.div
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`relative rounded-2xl bg-gray-900/50 border transition-all duration-300 overflow-hidden ${
                emailConnected
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${provider.color}15` }}
                  >
                    {provider.icon}
                  </div>
                  {emailConnected && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                      <Check className="w-3.5 h-3.5" />
                      Connected
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{provider.name}</h3>
                <p className="text-sm text-gray-400 mb-4">{provider.description}</p>
                {emailConnected && connectedEmail && (
                  <p className="text-sm text-emerald-400 mb-4 truncate">{connectedEmail}</p>
                )}
                <button
                  onClick={() => handleConnect(provider.id)}
                  disabled={emailConnected || connecting !== null}
                  className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    emailConnected
                      ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                      : isConnecting
                      ? 'bg-gray-800 text-gray-400'
                      : 'text-white hover:opacity-90'
                  }`}
                  style={
                    !emailConnected && !isConnecting
                      ? { backgroundColor: provider.color }
                      : undefined
                  }
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : emailConnected ? (
                    'Connected'
                  ) : (
                    <>
                      Connect {provider.name}
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Continue button when email is connected */}
      {emailConnected && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={onEmailConnected}
            className="px-8 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 flex items-center gap-2"
          >
            Continue to AI Voice
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        {!showSkipWarning ? (
          <button
            onClick={() => setShowSkipWarning(true)}
            className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            I&apos;ll do this later
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex flex-col items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
          >
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Emails will be sent from noreply@replysequence.com
              </span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSkipWarning(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Connect Now
              </button>
              <button
                onClick={onSkip}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Skip Anyway
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
```

**Step 2: Verify the file compiles**

Run: `npx tsc --noEmit components/onboarding/StepEmailConnect.tsx 2>&1 | head -20`
Expected: No type errors (or just the expected "cannot find module" for imports that get resolved at build time).

**Step 3: Commit**

```
git add components/onboarding/StepEmailConnect.tsx
git commit -m "feat: add StepEmailConnect onboarding component"
```

---

## Task 3: Create StepAIVoice Component

**Files:**
- Create: `components/onboarding/StepAIVoice.tsx`

This component adapts the tone selection, custom instructions, and signature sections from `components/dashboard/AICustomization.tsx` into a single onboarding page. It saves directly via `PUT /api/user/preferences`.

**Step 1: Create the component file**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react';

interface StepAIVoiceProps {
  onSaved: () => void;
}

const TONE_OPTIONS = [
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and business-appropriate',
    preview: 'Thank you for taking the time to meet today. I wanted to follow up on the key points we discussed and outline the next steps we agreed upon.',
    recommended: true,
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Relaxed and conversational',
    preview: 'Great chatting with you today! Here\'s a quick recap of what we talked about and what we\'re each tackling next.',
    recommended: false,
  },
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm and personable',
    preview: 'It was really wonderful connecting with you today! I\'m excited about what we discussed and wanted to make sure we\'re aligned on next steps.',
    recommended: false,
  },
  {
    value: 'concise',
    label: 'Concise',
    description: 'Brief and to the point',
    preview: 'Following up on today\'s meeting. Key decisions: [items]. Next steps: [actions]. Let me know if anything needs adjusting.',
    recommended: false,
  },
];

const INSTRUCTION_CHIPS = [
  'Always mention our free trial',
  'Keep under 150 words',
  'Include a next step',
  'Use bullet points',
];

export function StepAIVoice({ onSaved }: StepAIVoiceProps) {
  const [tone, setTone] = useState('professional');
  const [customInstructions, setCustomInstructions] = useState('');
  const [signature, setSignature] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayedPreview, setDisplayedPreview] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load existing preferences
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.aiTone) setTone(data.aiTone);
          if (data.aiCustomInstructions) setCustomInstructions(data.aiCustomInstructions);
          if (data.aiSignature) setSignature(data.aiSignature);
        }
      } catch {
        // Use defaults
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Typewriter preview effect
  useEffect(() => {
    const preview = TONE_OPTIONS.find(o => o.value === tone)?.preview || '';
    setDisplayedPreview('');
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      if (i < preview.length) {
        setDisplayedPreview(preview.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [tone]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiTone: tone,
          aiCustomInstructions: customInstructions,
          aiSignature: signature,
        }),
      });
      if (res.ok) {
        onSaved();
      }
    } catch {
      // Allow retry
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <Sparkles className="w-8 h-8 text-purple-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold text-white mb-3"
        >
          Set up your AI voice
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-400 text-lg max-w-lg mx-auto"
        >
          Customize how your follow-up emails sound. You can always change this in settings.
        </motion.p>
      </div>

      {/* Section A: Email Tone (required) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Email Tone</h3>
        <div className="grid grid-cols-2 gap-3">
          {TONE_OPTIONS.map((option) => {
            const isSelected = tone === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setTone(option.value)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${isSelected ? 'text-purple-400' : 'text-white'}`}>
                    {option.label}
                  </span>
                  {option.recommended && (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </div>

        {/* Typewriter Preview */}
        <div className="mt-4 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="text-xs font-medium text-gray-500 mb-2">Preview</div>
          <p className="text-sm text-gray-300 italic leading-relaxed min-h-[3rem]">
            &ldquo;{displayedPreview}{isTyping && <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse align-middle" />}&rdquo;
          </p>
        </div>
      </motion.div>

      {/* Section B: Custom Instructions (optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="max-w-2xl mx-auto mb-8"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-1">
          Custom Instructions <span className="text-gray-600 font-normal normal-case">(optional)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          Any specific instructions for your AI? These are added to every draft.
        </p>
        <textarea
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="E.g., Always include a specific next step with a date. Use my first name in the sign-off."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {INSTRUCTION_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => {
                setCustomInstructions(prev =>
                  prev ? `${prev}\n${chip}` : chip
                );
              }}
              className="px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full hover:bg-purple-500/20 transition-colors"
            >
              + {chip}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Section C: Email Signature (optional) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl mx-auto mb-10"
      >
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-1">
          Email Signature <span className="text-gray-600 font-normal normal-case">(optional)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          This will be appended to every AI-generated email.
        </p>
        <textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder={"Best regards,\nJohn Smith\nAccount Executive, Acme Corp\n(555) 123-4567"}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
        />
      </motion.div>

      {/* Save & Continue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-purple-500/25 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
```

**Step 2: Commit**

```
git add components/onboarding/StepAIVoice.tsx
git commit -m "feat: add StepAIVoice onboarding component"
```

---

## Task 4: Create StepCRM Component

**Files:**
- Create: `components/onboarding/StepCRM.tsx`

This component shows HubSpot (OAuth) and Airtable (API key form) as optional CRM connections. HubSpot uses the existing `/api/auth/hubspot` OAuth flow. Airtable uses a simplified inline form that POSTs to `/api/integrations/airtable/connect`.

**Step 1: Create the component file**

```tsx
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
```

**Step 2: Commit**

```
git add components/onboarding/StepCRM.tsx
git commit -m "feat: add StepCRM onboarding component"
```

---

## Task 5: Update ProgressBar Component

**Files:**
- Modify: `components/onboarding/ProgressBar.tsx`

Update the step labels and total from 5 to 6.

**Step 1: Replace the hardcoded steps array**

In `components/onboarding/ProgressBar.tsx`, replace the `steps` array (lines 11-17) with:

```typescript
const steps = [
  { number: 1, label: 'Welcome' },
  { number: 2, label: 'Platform' },
  { number: 3, label: 'Email' },
  { number: 4, label: 'AI Voice' },
  { number: 5, label: 'CRM' },
  { number: 6, label: 'Finish' },
];
```

No other changes needed. The component already uses `totalSteps` and `currentStep` props dynamically.

**Step 2: Commit**

```
git add components/onboarding/ProgressBar.tsx
git commit -m "feat: update ProgressBar for 6-step onboarding"
```

---

## Task 6: Update Onboarding API Routes

**Files:**
- Modify: `app/api/onboarding/progress/route.ts`
- Modify: `app/api/onboarding/complete/route.ts`

**Step 1: Update progress route - GET handler**

In the GET handler (around line 48), after the calendar connection checks, add email connection checking:

```typescript
// Check email connections
const { emailConnections } = await import('@/lib/db/schema');
const [emailConn] = await db.select({ id: emailConnections.id, email: emailConnections.email })
  .from(emailConnections)
  .where(eq(emailConnections.userId, user.id))
  .limit(1);

const emailConnected = !!emailConn;
const connectedEmail = emailConn?.email || null;
```

Also check CRM connections (HubSpot and Airtable):

```typescript
// Check CRM connections
const { hubspotConnections, airtableConnections } = await import('@/lib/db/schema');
const [hubspotConn] = await db.select({ id: hubspotConnections.id })
  .from(hubspotConnections)
  .where(eq(hubspotConnections.userId, user.id))
  .limit(1);
const [airtableConn] = await db.select({ id: airtableConnections.id })
  .from(airtableConnections)
  .where(eq(airtableConnections.userId, user.id))
  .limit(1);

const crmConnected = !!hubspotConn || !!airtableConn;
```

Add these to the response object:

```typescript
return NextResponse.json({
  ...onboarding,
  connectedPlatforms,
  googleCalendarConnected,
  outlookCalendarConnected,
  emailConnected,
  connectedEmail,
  crmConnected,
});
```

**Step 2: Update progress route - POST handler**

In the POST handler (line 87), add the new fields to the destructuring:

```typescript
const { currentStep, platformConnected, calendarConnected, draftGenerated, emailPreference, emailConnected, crmConnected } = body;
```

Add the new fields to the updates object (around line 95):

```typescript
if (emailConnected !== undefined) updates.emailConnected = emailConnected;
if (crmConnected !== undefined) updates.crmConnected = crmConnected;
```

Also add them to the insert fallback (around line 116):

```typescript
emailConnected: emailConnected || false,
crmConnected: crmConnected || false,
```

**Step 3: Update complete route**

In `app/api/onboarding/complete/route.ts`, change `stepNumber: 5` (line 32) to `stepNumber: 6`.

**Step 4: Verify schema imports compile**

Need to check that `emailConnections`, `hubspotConnections`, and `airtableConnections` are exported from `lib/db/schema.ts`. Run:

```
grep -n "export const emailConnections\|export const hubspotConnections\|export const airtableConnections" lib/db/schema.ts
```

Expected: All three tables exist in schema.

**Step 5: Commit**

```
git add app/api/onboarding/progress/route.ts app/api/onboarding/complete/route.ts
git commit -m "feat: update onboarding APIs for 6-step flow with email and CRM"
```

---

## Task 7: Update Onboarding Orchestrator Page

**Files:**
- Modify: `app/onboarding/page.tsx`

This is the largest change. The orchestrator needs:
- New type: `OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 'complete'`
- New state fields: `emailConnected`, `connectedEmail`, `crmConnected`
- Remove: calendar/draft state, `StepConnectCalendar`, `StepTestDraft` imports
- Add: `StepEmailConnect`, `StepAIVoice`, `StepCRM` imports
- New handlers: `handleEmailConnected`, `handleEmailSkipped`, `handleAIVoiceSaved`, `handleCRMConnected`, `handleCRMSkipped`
- Update `handlePlatformConnected` to go to step 3 (email) instead of step 3 (calendar)
- Update `handlePreferenceSaved` to show summary
- Update step rendering (6 steps + complete)
- Update `ProgressBar` `totalSteps` from 5 to 6
- Handle new OAuth callback params: `email_connected`, `crm_connected`

**Step 1: Replace imports**

Remove:
```typescript
import { StepConnectCalendar } from '@/components/onboarding/StepConnectCalendar';
import { StepTestDraft } from '@/components/onboarding/StepTestDraft';
```

Add:
```typescript
import { StepEmailConnect } from '@/components/onboarding/StepEmailConnect';
import { StepAIVoice } from '@/components/onboarding/StepAIVoice';
import { StepCRM } from '@/components/onboarding/StepCRM';
```

**Step 2: Update types**

Change:
```typescript
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 'complete';
```
To:
```typescript
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 'complete';
```

**Step 3: Update OnboardingState interface**

Replace:
```typescript
export interface OnboardingState {
  currentStep: OnboardingStep;
  platformConnected: ConnectedPlatform;
  connectedPlatforms: string[];
  calendarConnected: boolean;
  googleCalendarConnected: boolean;
  outlookCalendarConnected: boolean;
  draftGenerated: boolean;
  emailPreference: EmailPreference;
  isLoading: boolean;
  isReturningUser: boolean;
  showCelebration: boolean;
  celebrationType: 'platform' | 'calendar' | 'draft' | null;
}
```
With:
```typescript
export interface OnboardingState {
  currentStep: OnboardingStep;
  platformConnected: ConnectedPlatform;
  connectedPlatforms: string[];
  emailConnected: boolean;
  connectedEmail: string | null;
  crmConnected: boolean;
  emailPreference: EmailPreference;
  isLoading: boolean;
  isReturningUser: boolean;
  showCelebration: boolean;
  celebrationType: 'platform' | 'email' | 'crm' | null;
}
```

**Step 4: Update initial state**

Replace the initial state (lines 39-52) with:
```typescript
const [state, setState] = useState<OnboardingState>({
  currentStep: 1,
  platformConnected: null,
  connectedPlatforms: [],
  emailConnected: false,
  connectedEmail: null,
  crmConnected: false,
  emailPreference: 'review',
  isLoading: true,
  isReturningUser: false,
  showCelebration: false,
  celebrationType: null,
});
```

**Step 5: Update loadProgress**

Replace the setState in loadProgress (lines 67-79) with:
```typescript
setState(prev => ({
  ...prev,
  currentStep: data.currentStep || 1,
  platformConnected: data.platformConnected || null,
  connectedPlatforms: data.connectedPlatforms || [],
  emailConnected: data.emailConnected || false,
  connectedEmail: data.connectedEmail || null,
  crmConnected: data.crmConnected || false,
  emailPreference: data.emailPreference || 'review',
  isLoading: false,
  isReturningUser: data.currentStep > 1,
}));
```

**Step 6: Update OAuth callback handling**

Replace the calendar callback handling (lines 112-122) with email callback:
```typescript
// Handle email OAuth callback
const emailConnected = searchParams.get('email_connected');
if (emailConnected === 'true') {
  setState(prev => ({
    ...prev,
    emailConnected: true,
    currentStep: 3,
  }));
  saveProgress({ emailConnected: true, currentStep: 3 });
  window.history.replaceState({}, '', '/onboarding');
}

// Handle CRM OAuth callback
const crmConnected = searchParams.get('crm_connected');
if (crmConnected === 'true') {
  setState(prev => ({
    ...prev,
    crmConnected: true,
    currentStep: 5,
  }));
  saveProgress({ crmConnected: true, currentStep: 5 });
  window.history.replaceState({}, '', '/onboarding');
}
```

Update the step range check (line 126) from `stepNum <= 5` to `stepNum <= 6`:
```typescript
if (stepNum >= 1 && stepNum <= 6) {
  setState(prev => ({ ...prev, currentStep: stepNum as 1 | 2 | 3 | 4 | 5 | 6 }));
}
```

**Step 7: Update saveProgress type**

Update `saveProgress` parameter type to include new fields:
```typescript
const saveProgress = async (updates: {
  currentStep?: number;
  platformConnected?: ConnectedPlatform;
  calendarConnected?: boolean;
  draftGenerated?: boolean;
  emailPreference?: EmailPreference;
  emailConnected?: boolean;
  crmConnected?: boolean;
}) => {
```

**Step 8: Update nextStep**

Change `current < 5` to `current < 6`:
```typescript
const nextStep = () => {
  const current = state.currentStep as number;
  if (current < 6) {
    goToStep((current + 1) as OnboardingStep);
  } else {
    goToStep('complete');
  }
};
```

**Step 9: Update handlePlatformConnected**

All platform connections now go to step 3 (email), not step 3 (calendar). Replace the handler:
```typescript
const handlePlatformConnected = (platform: ConnectedPlatform) => {
  setState(prev => ({
    ...prev,
    platformConnected: platform,
    connectedPlatforms: platform && !prev.connectedPlatforms.includes(platform)
      ? [...prev.connectedPlatforms, platform]
      : prev.connectedPlatforms,
  }));
  trackEvent('platform_connected', 2, { platform });

  setState(prev => ({ ...prev, showCelebration: true, celebrationType: 'platform' }));

  saveProgress({ platformConnected: platform, currentStep: 3 });
  setTimeout(() => goToStep(3), 1200);
};
```

**Step 10: Replace old handlers with new ones**

Remove `handleCalendarConnected`, `handleCalendarSkipped`, `handleDraftGenerated`.

Add:
```typescript
const handleEmailConnected = () => {
  setState(prev => ({ ...prev, emailConnected: true }));
  saveProgress({ emailConnected: true, currentStep: 4 });
  trackEvent('email_connected', 3);

  setState(prev => ({ ...prev, showCelebration: true, celebrationType: 'email' }));
  setTimeout(() => goToStep(4), 1200);
};

const handleEmailSkipped = () => {
  trackEvent('email_skipped', 3);
  goToStep(4);
};

const handleAIVoiceSaved = () => {
  trackEvent('ai_voice_saved', 4);
  goToStep(5);
};

const handleCRMConnected = () => {
  setState(prev => ({ ...prev, crmConnected: true }));
  saveProgress({ crmConnected: true, currentStep: 6 });
  trackEvent('crm_connected', 5);

  setState(prev => ({ ...prev, showCelebration: true, celebrationType: 'crm' }));
  setTimeout(() => goToStep(6), 1200);
};

const handleCRMSkipped = () => {
  trackEvent('crm_skipped', 5);
  goToStep(6);
};
```

**Step 11: Update handlePreferenceSaved**

Update the step number references:
```typescript
const handlePreferenceSaved = async (preference: EmailPreference) => {
  setState(prev => ({ ...prev, emailPreference: preference }));
  await saveProgress({ emailPreference: preference });
  trackEvent('preferences_saved', 6, { preference });

  await fetch('/api/onboarding/complete', { method: 'POST' });
  trackEvent('onboarding_completed', 6);
  goToStep('complete');
};
```

**Step 12: Update handleExit threshold**

Change exit threshold from 4 to 5 (after CRM step users should be able to exit freely):
```typescript
const handleExit = () => {
  if (state.currentStep === 'complete' || state.currentStep >= 5) {
    router.push('/dashboard');
  } else {
    setShowExitModal(true);
  }
};
```

**Step 13: Update ProgressBar totalSteps**

Change `totalSteps={5}` to `totalSteps={6}`:
```typescript
<ProgressBar
  currentStep={state.currentStep as number}
  totalSteps={6}
/>
```

**Step 14: Replace step rendering**

Replace steps 3, 4, 5 in the AnimatePresence block with the new components:

Step 3 - Email Connect (replaces Calendar):
```tsx
{state.currentStep === 3 && (
  <motion.div
    key="step3"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <StepEmailConnect
      emailConnected={state.emailConnected}
      connectedEmail={state.connectedEmail}
      onEmailConnected={handleEmailConnected}
      onSkip={handleEmailSkipped}
    />
  </motion.div>
)}
```

Step 4 - AI Voice (replaces Test Draft):
```tsx
{state.currentStep === 4 && (
  <motion.div
    key="step4"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <StepAIVoice onSaved={handleAIVoiceSaved} />
  </motion.div>
)}
```

Step 5 - CRM (new):
```tsx
{state.currentStep === 5 && (
  <motion.div
    key="step5"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <StepCRM
      crmConnected={state.crmConnected}
      onCRMConnected={handleCRMConnected}
      onSkip={handleCRMSkipped}
    />
  </motion.div>
)}
```

Step 6 - Delivery Mode + Finish (was step 5):
```tsx
{state.currentStep === 6 && (
  <motion.div
    key="step6"
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
  >
    <StepEmailPreferences
      preference={state.emailPreference}
      onSave={handlePreferenceSaved}
    />
  </motion.div>
)}
```

**Step 15: Update OnboardingComplete props**

The complete screen needs to show the new setup summary. Replace the complete step rendering:
```tsx
{state.currentStep === 'complete' && (
  <motion.div
    key="complete"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <OnboardingComplete
      platformConnected={state.platformConnected}
      calendarConnected={false}
      onGoToDashboard={() => router.push('/dashboard')}
    />
  </motion.div>
)}
```

Note: We pass `calendarConnected={false}` since calendar is no longer in onboarding. The `OnboardingComplete` component already handles this gracefully. In a follow-up task, the complete component can be updated to show email/CRM status instead.

**Step 16: Commit**

```
git add app/onboarding/page.tsx
git commit -m "feat: restructure onboarding orchestrator for 6-step email-first flow"
```

---

## Task 8: Build Verification

**Step 1: Run production build**

Run: `npx next build` (with `run_in_background: true`)

Check with: `tail -20 <output_file>`

Expected: Build succeeds with no TypeScript errors.

**Step 2: If build fails, fix type errors**

Common issues:
- Missing imports for new components
- Type mismatches on OnboardingStep (1-6 vs 1-5)
- Missing schema exports for emailConnections/hubspotConnections/airtableConnections

**Step 3: Final commit if any fixes needed**

```
git add -A
git commit -m "fix: resolve build errors in onboarding redesign"
```

---

## Task 9: Push to Remote

**Step 1: Push all commits**

Run: `git push origin main`

Expected: All commits pushed, Vercel deployment triggered.

---

## Summary of All Files Changed

| Action | File |
|--------|------|
| Create | `drizzle/XXXX_add_onboarding_email_crm.sql` |
| Create | `components/onboarding/StepEmailConnect.tsx` |
| Create | `components/onboarding/StepAIVoice.tsx` |
| Create | `components/onboarding/StepCRM.tsx` |
| Modify | `lib/db/schema.ts` (add 2 columns) |
| Modify | `components/onboarding/ProgressBar.tsx` (6 steps) |
| Modify | `app/api/onboarding/progress/route.ts` (email + CRM) |
| Modify | `app/api/onboarding/complete/route.ts` (step 5→6) |
| Modify | `app/onboarding/page.tsx` (full orchestrator rewrite) |
| Untouched | `components/onboarding/StepWelcome.tsx` |
| Untouched | `components/onboarding/StepConnectPlatform.tsx` |
| Untouched | `components/onboarding/StepEmailPreferences.tsx` |
| Removed from imports | `StepConnectCalendar`, `StepTestDraft` (files stay, just unused) |
