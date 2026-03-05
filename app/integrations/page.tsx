import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Check, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { JSX } from 'react';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'ReplySequence integrates with Zoom, Microsoft Teams, Google Meet, Gmail, Outlook, HubSpot, Airtable, Salesforce, and Google Sheets. Connect your tools and automate meeting follow-ups.',
  openGraph: {
    title: 'Integrations | ReplySequence',
    description: 'Connect Zoom, Teams, Meet, Gmail, Outlook, HubSpot, Airtable, Salesforce, and Google Sheets for automated meeting follow-ups.',
    url: 'https://www.replysequence.com/integrations',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/integrations',
  },
};

interface Integration {
  name: string;
  category: 'meeting' | 'email' | 'crm';
  description: string;
  features: string[];
  status: 'available' | 'coming_soon';
  logo: JSX.Element;
  color: string;
}

// Brand SVG icons
const ZoomLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M4.585 16.978a3.07 3.07 0 0 1-3.07-3.07V8.143a3.07 3.07 0 0 1 3.07-3.07h9.66a3.07 3.07 0 0 1 3.072 3.07l-.002 2.163 3.636-2.668a.895.895 0 0 1 1.42.725v7.286a.895.895 0 0 1-1.42.725l-3.636-2.669v2.163a3.07 3.07 0 0 1-3.07 3.07l-9.66.04z" />
  </svg>
);

const TeamsLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M20.625 7.875h-3.75V5.25a1.125 1.125 0 0 0-1.125-1.125H8.25A1.125 1.125 0 0 0 7.125 5.25v2.625h-3.75A1.125 1.125 0 0 0 2.25 9v6.75a1.125 1.125 0 0 0 1.125 1.125h3.75v2.625A1.125 1.125 0 0 0 8.25 20.625h7.5a1.125 1.125 0 0 0 1.125-1.125v-2.625h3.75a1.125 1.125 0 0 0 1.125-1.125V9a1.125 1.125 0 0 0-1.125-1.125zM9.375 18.375V5.625h5.25v12.75h-5.25z" />
  </svg>
);

const MeetLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
  </svg>
);

const GmailLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M20 18h-2V9.25L12 13 6 9.25V18H4V6h1.2l6.8 4.25L18.8 6H20v12zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" />
  </svg>
);

const OutlookLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 3c1.657 0 3 1.567 3 3.5S13.657 12 12 12s-3-1.567-3-3.5S10.343 5 12 5zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
  </svg>
);

const HubSpotLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M17.01 11.4V8.03a1.71 1.71 0 0 0 1-1.55V6.4a1.71 1.71 0 0 0-1.71-1.71h-.08A1.71 1.71 0 0 0 14.5 6.4v.08a1.71 1.71 0 0 0 1 1.55v3.37a4.76 4.76 0 0 0-2.12 1.23l-5.6-4.36a1.83 1.83 0 0 0 .05-.4 1.87 1.87 0 1 0-1.87 1.87c.24 0 .46-.05.67-.13l5.5 4.28a4.78 4.78 0 0 0 .33 5.01l-1.66 1.66a1.4 1.4 0 0 0-.4-.07 1.48 1.48 0 1 0 1.48 1.48 1.4 1.4 0 0 0-.07-.41l1.63-1.63a4.8 4.8 0 1 0 3.56-7.13z" />
  </svg>
);

const AirtableLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M11.52 2.309l-8.22 3.1c-.5.19-.5.89 0 1.08l8.22 3.1c.31.12.65.12.96 0l8.22-3.1c.5-.19.5-.89 0-1.08l-8.22-3.1a1.28 1.28 0 0 0-.96 0zm-9.27 6.52v7.14c0 .38.23.72.58.86l8.19 3.41c.29.12.62-.09.62-.41V12.67c0-.38-.23-.72-.58-.86L2.87 8.4a.45.45 0 0 0-.62.41zm18.5 0c0-.5-.62-.77-1-.44l-7.38 5.16c-.35.25-.57.65-.57 1.08v6.78c0 .5.61.78 1 .45l7.38-5.16c.35-.24.57-.65.57-1.08V8.83z" />
  </svg>
);

const SalesforceLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M10.05 5.83a4.01 4.01 0 0 1 3.02-1.38 4.04 4.04 0 0 1 3.78 2.65 3.48 3.48 0 0 1 1.49-.34c1.95 0 3.53 1.61 3.53 3.6 0 1.98-1.58 3.59-3.53 3.59-.2 0-.4-.02-.6-.05a3.01 3.01 0 0 1-2.68 1.65c-.34 0-.67-.06-.98-.17a3.6 3.6 0 0 1-3.36 2.33 3.59 3.59 0 0 1-3.12-1.83 3.21 3.21 0 0 1-.65.07c-1.73 0-3.14-1.41-3.14-3.15 0-.95.43-1.8 1.1-2.37a3.47 3.47 0 0 1-.44-1.7c0-1.93 1.56-3.5 3.49-3.5 1.02 0 1.94.44 2.59 1.14z" />
  </svg>
);

const SheetsLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white" aria-hidden="true">
    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 14H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);

const integrations: Integration[] = [
  {
    name: 'Zoom',
    category: 'meeting',
    description: 'Automatically capture transcripts from Zoom meetings and generate follow-up emails.',
    features: [
      'Auto-capture transcripts from every call',
      'Detect decisions, next steps, and commitments',
      'Draft follow-ups in seconds after the call ends',
      'Speaker identification for accurate attribution',
    ],
    status: 'available',
    logo: <ZoomLogo />,
    color: 'from-[#2D8CFF] to-[#2681F2]',
  },
  {
    name: 'Microsoft Teams',
    category: 'meeting',
    description: 'Process Teams meetings via Microsoft Graph API subscriptions for automatic follow-ups.',
    features: [
      'Process Teams calls automatically via subscriptions',
      'Capture transcripts and recordings',
      'Calendar sync for scheduled meeting awareness',
      'Auto-renewing — set it and forget it',
    ],
    status: 'available',
    logo: <TeamsLogo />,
    color: 'from-[#5B5FC7] to-[#4B4FB5]',
  },
  {
    name: 'Google Meet',
    category: 'meeting',
    description: 'Connect Google Meet via Calendar API to process meeting recordings and generate drafts.',
    features: [
      'Sync with Google Calendar for meeting awareness',
      'Process recordings for transcript extraction',
      'Works across Google Workspace accounts',
      'Multi-account support for agencies',
    ],
    status: 'available',
    logo: <MeetLogo />,
    color: 'from-[#00897B] to-[#00796B]',
  },
  {
    name: 'Gmail',
    category: 'email',
    description: 'Send follow-up emails directly from your Gmail account for better deliverability.',
    features: [
      'Send from your real Gmail address',
      'Keep your existing signature and sending domain',
      'No third-party branding on emails',
      'Secure OAuth — we never see your password',
    ],
    status: 'available',
    logo: <GmailLogo />,
    color: 'from-[#EA4335] to-[#D93025]',
  },
  {
    name: 'Outlook / Microsoft 365',
    category: 'email',
    description: 'Connect your Outlook or Microsoft 365 account to send follow-ups from your business email.',
    features: [
      'Send from your Microsoft 365 business email',
      'Enterprise-ready OAuth connection',
      'Works with all M365 Business accounts',
      'Your recipients see your name, not ours',
    ],
    status: 'available',
    logo: <OutlookLogo />,
    color: 'from-[#0078D4] to-[#106EBE]',
  },
  {
    name: 'HubSpot',
    category: 'crm',
    description: 'Automatically log sent emails to HubSpot contacts and create engagement records.',
    features: [
      'Push recaps and next steps to the right contact',
      'Auto-log sent emails as engagement records',
      'Keep pipeline reviews based on real conversations',
      'Activity timeline stays up to date',
    ],
    status: 'available',
    logo: <HubSpotLogo />,
    color: 'from-[#FF7A59] to-[#FF5C35]',
  },
  {
    name: 'Airtable',
    category: 'crm',
    description: 'Sync meeting data and sent emails to Airtable for custom CRM workflows.',
    features: [
      'Sync meeting data to custom bases',
      'Track follow-up history per contact',
      'Log email sends automatically',
      'Flexible enough for any CRM workflow',
    ],
    status: 'available',
    logo: <AirtableLogo />,
    color: 'from-[#FCBF49] to-[#18BFFF]',
  },
  {
    name: 'Salesforce',
    category: 'crm',
    description: 'Log meeting follow-ups directly into Salesforce contacts and opportunities.',
    features: [
      'Log follow-ups to contacts and opportunities',
      'Match activities to the right records',
      'Automatic contact lookup via SOQL',
      'Token refresh with session expiry handling',
    ],
    status: 'available',
    logo: <SalesforceLogo />,
    color: 'from-[#00A1E0] to-[#0070D2]',
  },
  {
    name: 'Google Sheets',
    category: 'crm',
    description: 'Sync meeting data and follow-ups to Google Sheets for lightweight, flexible CRM workflows.',
    features: [
      'Auto-create headers and column structure',
      'Contact deduplication by email',
      'Pick any spreadsheet from your Drive',
      'Configure which columns to sync',
    ],
    status: 'available',
    logo: <SheetsLogo />,
    color: 'from-[#0F9D58] to-[#188038]',
  },
];

const categoryLabels = {
  meeting: 'Meeting Platforms',
  email: 'Email Providers',
  crm: 'CRM Integrations',
};

const categoryDescriptions = {
  meeting: 'Automatically capture every call so you never lose what was said, promised, or decided.',
  email: 'Send follow-ups from the inbox your prospects already trust — no new tool for them to recognize.',
  crm: 'Log every recap and next step to your CRM without touching a keyboard. Keep pipeline reviews honest.',
};

// Stagger class lookup for card animations
const staggerClasses = [
  'animate-fade-in-up-stagger',
  'animate-fade-in-up-stagger-1',
  'animate-fade-in-up-stagger-2',
  'animate-fade-in-up-stagger-3',
  'animate-fade-in-up-stagger-4',
];

export default function IntegrationsPage() {
  const categories = ['meeting', 'email', 'crm'] as const;

  return (
    <div className="min-h-screen bg-gray-950 light:bg-gray-50">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white light:text-gray-900 mb-6 text-pretty">
            Connect Your{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 bg-clip-text text-transparent">
              Entire Stack
            </span>{' '}
            so You Never Copy-Paste Call Notes Again
          </h1>
          <p className="text-xl text-gray-400 light:text-gray-600 max-w-2xl mx-auto mb-8">
            Plug into Zoom, Meet, Teams, Gmail, Outlook, and 4 CRMs so every call becomes a ready-to-send follow-up and a clean CRM update — in seconds.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-500 light:text-gray-400 mb-6">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              9 integrations
            </span>
            <span className="text-gray-700 light:text-gray-300">|</span>
            <span>No engineering required</span>
          </div>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 light:text-indigo-600 hover:text-indigo-300 light:hover:text-indigo-500 transition-colors"
          >
            See how it works
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Integration Categories */}
      {categories.map((category, categoryIndex) => {
        const categoryIntegrations = integrations.filter((i) => i.category === category);
        const cardCount = categoryIntegrations.length;
        const gridCols = cardCount <= 2
          ? 'md:grid-cols-2 max-w-4xl mx-auto'
          : cardCount === 4
          ? 'md:grid-cols-2 max-w-4xl mx-auto'
          : 'md:grid-cols-2 lg:grid-cols-3';

        return (
          <section key={category} className="py-12 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8 animate-fade-in-up">
                <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 mb-2">
                  {categoryLabels[category]}
                </h2>
                <p className="text-gray-400 light:text-gray-600">
                  {categoryDescriptions[category]}
                </p>
              </div>

              <div className={`grid grid-cols-1 gap-6 ${gridCols}`}>
                {categoryIntegrations.map((integration, i) => (
                  <div
                    key={integration.name}
                    className={`relative rounded-2xl p-6 bg-gray-900 light:bg-white border border-gray-800 light:border-gray-200 hover:border-gray-700 light:hover:border-gray-300 transition-[border-color,transform,box-shadow] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/20 ${
                      staggerClasses[i] || staggerClasses[staggerClasses.length - 1]
                    } ${
                      integration.status === 'coming_soon' ? 'opacity-70' : ''
                    }`}
                    style={{ animationDelay: `${categoryIndex * 0.15 + i * 0.1}s` }}
                  >
                    {integration.status === 'coming_soon' && (
                      <div className="absolute top-4 right-4">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-800 light:bg-gray-100 text-gray-400 light:text-gray-500 font-medium">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    {/* Logo */}
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${integration.color} mb-4`}>
                      {integration.logo}
                    </div>

                    {/* Name + Description */}
                    <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-400 light:text-gray-600 mb-4">
                      {integration.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2">
                      {integration.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300 light:text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {integration.status === 'coming_soon' && (
                      <div className="mt-4 pt-4 border-t border-gray-800 light:border-gray-200">
                        <Link
                          href="/contact"
                          className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 light:text-amber-600 hover:text-amber-300 transition-colors"
                        >
                          Join the early access list
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* How It Works */}
      <section className="py-16 px-4 border-t border-gray-800 light:border-gray-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white light:text-gray-900 text-center mb-12 animate-fade-in-up">
            How Integration Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Connect in Minutes',
                description: 'Link Zoom, Teams, or Meet plus your email and CRM. OAuth-based, no passwords stored, no engineering required.',
              },
              {
                step: '2',
                title: 'Run Your Calls as Usual',
                description: 'ReplySequence captures what was said, who said it, and what was decided — so you don\'t have to.',
              },
              {
                step: '3',
                title: 'Review, Send, Done',
                description: 'AI-drafted follow-ups land in your dashboard. Edit if needed, hit send from your real inbox. CRM updates itself.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className={`text-center ${staggerClasses[i] || staggerClasses[staggerClasses.length - 1]}`}
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white light:text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 light:text-gray-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Stack Cards */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent mb-3">
                Zoom + Gmail + HubSpot
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-600">
                Run the call in Zoom. ReplySequence drafts your follow-up in Gmail. Recap + next steps are logged to the HubSpot deal — in under 10 seconds.
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent mb-3">
                Teams + Outlook + Salesforce
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-600">
                Finish a Teams call. Get a ready-to-send Outlook email. Activity logged to the right Salesforce contact automatically.
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent mb-3">
                Meet + Gmail + Google Sheets
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-600">
                Google Meet call wraps up. AI drafts the follow-up in Gmail. Meeting data synced to your Sheets CRM — zero copy-paste.
              </p>
            </div>
            <div className="rounded-xl border border-gray-800 light:border-gray-200 bg-gray-900/50 light:bg-white p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent mb-3">
                Zoom + Outlook + Airtable
              </h3>
              <p className="text-sm text-gray-400 light:text-gray-600">
                Finish a Zoom call. Get a ready-to-send Outlook email. Action items tracked on the right Airtable record automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Setup & Trust */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-sm text-gray-400 light:text-gray-500 mb-6">Typical setup time: under 5 minutes</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <span className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-500">
              <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
              OAuth connections — we never store passwords
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-500">
              <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
              Choose exactly which CRM fields we can update
            </span>
            <span className="flex items-center gap-2 text-sm text-gray-400 light:text-gray-500">
              <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />
              Your data encrypted in transit and at rest
            </span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950 light:from-white light:to-gray-50">
        <div className="max-w-2xl mx-auto text-center animate-fade-in-up">
          <h2 className="text-2xl font-bold text-white light:text-gray-900 mb-4">
            Connect your tools and send your first AI follow-up in 5 minutes
          </h2>
          <p className="text-gray-400 light:text-gray-600 mb-8">
            Get started free with 5 AI drafts per month. No credit card required.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg font-semibold bg-gradient-to-r from-indigo-500 to-indigo-700 text-white hover:from-indigo-600 hover:to-indigo-800 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-[background,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            Connect Your Tools Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "ReplySequence Integrations",
            "description": "Connect Zoom, Microsoft Teams, Google Meet, Gmail, Outlook, HubSpot, Airtable, Salesforce, and Google Sheets for automated meeting follow-up emails.",
            "url": "https://www.replysequence.com/integrations",
            "isPartOf": {
              "@type": "WebSite",
              "name": "ReplySequence",
              "url": "https://www.replysequence.com",
            },
          }),
        }}
      />
    </div>
  );
}
