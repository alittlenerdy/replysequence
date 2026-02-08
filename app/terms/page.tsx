import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | ReplySequence',
  description: 'ReplySequence terms of service - the agreement governing your use of our service.',
};

export default function TermsPage() {
  const effectiveDate = 'February 8, 2026';

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
          <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400">Effective date: {effectiveDate}</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-purple max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using ReplySequence (&quot;Service&quot;), operated by Playground Giants
              (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you agree to be bound by these
              Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not
              access or use the Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              ReplySequence is a meeting follow-up automation platform that:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Connects to video conferencing platforms (Zoom, Microsoft Teams, Google Meet)</li>
              <li>Processes meeting transcripts using artificial intelligence</li>
              <li>Generates draft follow-up emails based on meeting content</li>
              <li>Integrates with CRM systems for automated logging</li>
              <li>Sends emails on your behalf when you approve drafts</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorized access to your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">4. User Responsibilities</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Obtaining all necessary consents from meeting participants for transcript processing</li>
              <li>Ensuring your use of the Service complies with applicable laws and regulations</li>
              <li>Reviewing and approving AI-generated drafts before sending</li>
              <li>Maintaining accurate recipient information for email communications</li>
              <li>Complying with anti-spam laws and email regulations in your jurisdiction</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Acceptable Use</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of these Terms</li>
              <li>Process transcripts containing illegal content</li>
              <li>Send unsolicited commercial emails (spam) through the Service</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Reverse engineer, decompile, or disassemble any aspect of the Service</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Impersonate any person or entity</li>
              <li>Share your account credentials with others</li>
              <li>Use the Service in a manner that exceeds reasonable request volume</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.1 Our Intellectual Property</h3>
            <p className="text-gray-300 leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by
              Playground Giants and is protected by international copyright, trademark, patent,
              trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.2 Your Content</h3>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of your meeting transcripts and generated content. By using the
              Service, you grant us a limited license to process your content solely for the purpose
              of providing the Service.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.3 Feedback</h3>
            <p className="text-gray-300 leading-relaxed">
              Any feedback, suggestions, or ideas you provide about the Service may be used by us
              without any obligation to you.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Third-Party Services</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              The Service integrates with third-party platforms and services including:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Zoom, Microsoft Teams, Google Meet:</strong> For meeting transcript access</li>
              <li><strong>Anthropic (Claude):</strong> For AI-powered draft generation</li>
              <li><strong>Clerk:</strong> For authentication services</li>
              <li><strong>Resend:</strong> For email delivery</li>
              <li><strong>Stripe:</strong> For payment processing</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              Your use of these third-party services is subject to their respective terms and
              privacy policies.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Subscription and Payment</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">8.1 Billing</h3>
            <p className="text-gray-300 leading-relaxed">
              Paid features require a subscription. You agree to pay all fees associated with your
              subscription plan. Fees are non-refundable except as required by law or as expressly
              stated in these Terms.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">8.2 Automatic Renewal</h3>
            <p className="text-gray-300 leading-relaxed">
              Subscriptions automatically renew unless cancelled before the renewal date. You may
              cancel your subscription at any time through your account settings.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">8.3 Price Changes</h3>
            <p className="text-gray-300 leading-relaxed">
              We may change subscription prices with 30 days&apos; notice. Continued use after a price
              change constitutes acceptance of the new price.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                either express or implied.
              </li>
              <li>
                We do not warrant that the Service will be uninterrupted, secure, or error-free.
              </li>
              <li>
                We are not responsible for the accuracy of AI-generated content. You must review
                all drafts before sending.
              </li>
              <li>
                In no event shall our total liability exceed the amount you paid for the Service
                in the 12 months preceding the claim.
              </li>
              <li>
                We shall not be liable for any indirect, incidental, special, consequential, or
                punitive damages.
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Indemnification</h2>
            <p className="text-gray-300 leading-relaxed">
              You agree to indemnify and hold harmless Playground Giants and its officers, directors,
              employees, and agents from any claims, damages, losses, or expenses (including
              reasonable attorneys&apos; fees) arising from your use of the Service, your violation of
              these Terms, or your violation of any rights of a third party.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">11.1 Termination by You</h3>
            <p className="text-gray-300 leading-relaxed">
              You may terminate your account at any time through your account settings or by
              contacting us.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">11.2 Termination by Us</h3>
            <p className="text-gray-300 leading-relaxed">
              We may suspend or terminate your access to the Service immediately, without prior
              notice, if you violate these Terms or for any other reason at our sole discretion.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">11.3 Effect of Termination</h3>
            <p className="text-gray-300 leading-relaxed">
              Upon termination, your right to use the Service ceases immediately. We may delete
              your data in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law and Disputes</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              These Terms are governed by the laws of the State of Delaware, United States,
              without regard to conflict of law principles.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Any disputes arising from these Terms or the Service shall be resolved through
              binding arbitration in accordance with the rules of the American Arbitration
              Association. You agree to waive your right to a jury trial and to participate
              in a class action lawsuit.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify you of
              material changes by posting the updated Terms on this page and updating the
              &quot;Effective date&quot; at the top. Your continued use of the Service after changes
              become effective constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Miscellaneous</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li>
                <strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy,
                constitute the entire agreement between you and us regarding the Service.
              </li>
              <li>
                <strong>Severability:</strong> If any provision of these Terms is found invalid,
                the remaining provisions remain in effect.
              </li>
              <li>
                <strong>Waiver:</strong> Our failure to enforce any right or provision of these
                Terms shall not constitute a waiver.
              </li>
              <li>
                <strong>Assignment:</strong> You may not assign your rights under these Terms
                without our consent. We may assign our rights without restriction.
              </li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have questions about these Terms, please contact us:
            </p>
            <ul className="list-none mt-4 text-gray-300 space-y-2">
              <li>Email: legal@replysequence.com</li>
              <li>Company: Playground Giants</li>
              <li>Contact: jimmy@playgroundgiants.com</li>
            </ul>
          </section>
        </div>

        {/* Footer Links */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/security" className="hover:text-purple-400 transition-colors">
              Security
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
