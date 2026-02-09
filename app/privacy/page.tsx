import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'ReplySequence privacy policy - how we collect, use, and protect your meeting data. GDPR and CCPA compliant.',
  openGraph: {
    title: 'Privacy Policy | ReplySequence',
    description: 'ReplySequence privacy policy - how we collect, use, and protect your meeting data.',
    url: 'https://replysequence.com/privacy',
  },
  alternates: {
    canonical: 'https://replysequence.com/privacy',
  },
};

export default function PrivacyPage() {
  const lastUpdated = 'February 8, 2026';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors mb-4 inline-block"
          >
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: {lastUpdated}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-purple max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              ReplySequence (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our meeting follow-up automation service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.1 Account Information</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Email address (from your authentication provider)</li>
              <li>Name (if provided)</li>
              <li>Profile information from connected platforms (Zoom, Teams, Google Meet)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.2 Meeting Data</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Meeting transcripts from connected video conferencing platforms</li>
              <li>Meeting metadata (topic, date, duration, participants)</li>
              <li>Recording information (if applicable)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.3 Generated Content</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>AI-generated email drafts based on your meeting transcripts</li>
              <li>Editing history and preferences</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">2.4 Usage Data</h3>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Log data and analytics</li>
              <li>Feature usage patterns</li>
              <li>Error reports and performance metrics</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To generate AI-powered email drafts from your meeting transcripts</li>
              <li>To improve and personalize your experience</li>
              <li>To communicate with you about your account and service updates</li>
              <li>To detect and prevent fraud or abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Sharing</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We do not sell your personal data. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>AI Providers:</strong> We use Anthropic&apos;s Claude to generate email drafts. Transcript content is sent to their API for processing.</li>
              <li><strong>Payment Processors:</strong> Stripe processes payments securely.</li>
              <li><strong>Infrastructure Providers:</strong> We use Vercel for hosting and Supabase for data storage.</li>
              <li><strong>Authentication:</strong> Clerk handles user authentication.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2 mt-4">
              <li>AES-256-GCM encryption for sensitive data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>OAuth 2.0 for secure platform integrations</li>
              <li>Regular security audits and monitoring</li>
              <li>Webhook signature verification</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights (GDPR/CCPA)</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You have the following rights regarding your personal data:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Restriction:</strong> Request limitation of processing</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              To exercise these rights, use our{' '}
              <Link href="/dashboard/settings" className="text-purple-400 hover:text-purple-300">
                account settings
              </Link>{' '}
              or contact us at jimmy@replysequence.com.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain your data for as long as your account is active. Upon account deletion,
              all personal data is permanently removed within 30 days. Some aggregated,
              anonymized data may be retained for analytics purposes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Cookies</h2>
            <p className="text-gray-300 leading-relaxed">
              We use essential cookies for authentication and session management.
              We do not use tracking cookies for advertising purposes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Children&apos;s Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our service is not intended for users under 18 years of age. We do not
              knowingly collect data from children.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you
              of any changes by posting the new policy on this page and updating the
              &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about this Privacy Policy or our data practices,
              please contact us:
            </p>
            <ul className="list-none mt-4 text-gray-300 space-y-2">
              <li>Email: jimmy@replysequence.com</li>
              <li>Company: Playground Giants</li>
            </ul>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <Link href="/security" className="hover:text-purple-400 transition-colors">
              Security
            </Link>
            <Link href="/terms" className="hover:text-purple-400 transition-colors">
              Terms of Service
            </Link>
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
