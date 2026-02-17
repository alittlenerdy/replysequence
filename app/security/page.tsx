import { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import {
  Shield,
  Lock,
  Key,
  Server,
  Eye,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Globe,
  Database,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security',
  description: 'Enterprise-grade security for your meeting data. AES-256 encryption, SOC 2 infrastructure, GDPR compliant, OAuth 2.0 authentication.',
  openGraph: {
    title: 'Security | ReplySequence',
    description: 'Enterprise-grade security for your meeting data. AES-256 encryption, SOC 2 infrastructure, GDPR compliant.',
    url: 'https://www.replysequence.com/security',
  },
  alternates: {
    canonical: 'https://www.replysequence.com/security',
  },
};

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encryption at Rest',
    description: 'All sensitive data is encrypted using AES-256-GCM, the same encryption standard used by banks and government agencies.',
    status: 'active',
  },
  {
    icon: Globe,
    title: 'Encryption in Transit',
    description: 'All data transmitted to and from our servers uses TLS 1.3, ensuring your data cannot be intercepted.',
    status: 'active',
  },
  {
    icon: Key,
    title: 'OAuth 2.0 Authentication',
    description: 'We never store your Zoom, Teams, or Google passwords. Integration uses secure OAuth 2.0 tokens with minimal required scopes.',
    status: 'active',
  },
  {
    icon: FileCheck,
    title: 'Webhook Verification',
    description: 'All incoming webhooks are cryptographically verified using HMAC-SHA256 signatures to prevent spoofing attacks.',
    status: 'active',
  },
  {
    icon: Server,
    title: 'Infrastructure Security',
    description: 'Hosted on Vercel with automatic DDoS protection, WAF, and SOC 2 Type II certified infrastructure.',
    status: 'active',
  },
  {
    icon: Database,
    title: 'Database Security',
    description: 'Data stored in Supabase (PostgreSQL) with row-level security, automated backups, and point-in-time recovery.',
    status: 'active',
  },
  {
    icon: Eye,
    title: 'Access Controls',
    description: 'Role-based access control ensures users can only access their own data. Admin access requires MFA.',
    status: 'active',
  },
  {
    icon: AlertTriangle,
    title: 'Rate Limiting',
    description: 'API endpoints are protected against abuse with intelligent rate limiting that adapts to usage patterns.',
    status: 'active',
  },
];

const certifications = [
  { name: 'SOC 2 Type II', status: 'Infrastructure Provider', description: 'Via Vercel & Supabase' },
  { name: 'GDPR', status: 'Compliant', description: 'EU data protection' },
  { name: 'CCPA', status: 'Compliant', description: 'California privacy law' },
  { name: 'HIPAA', status: 'Not Applicable', description: 'No PHI processed' },
];

const securityHeaders = [
  { header: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { header: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { header: 'X-Content-Type-Options', value: 'nosniff' },
  { header: 'X-XSS-Protection', value: '1; mode=block' },
  { header: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { header: 'Content-Security-Policy', value: 'default-src \'self\'; ...' },
  { header: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Link
            href="/"
            className="text-purple-400 hover:text-purple-300 transition-colors mb-4 inline-block"
          >
            &larr; Back to Home
          </Link>
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-purple-500/10 rounded-2xl">
              <Shield className="w-12 h-12 text-purple-400" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Enterprise-Grade Security
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your meeting data is protected with the same security standards
            used by Fortune 500 companies.
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">256-bit Encryption</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <CheckCircle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400">SOC 2 Infrastructure</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <CheckCircle className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-400">GDPR Compliant</span>
          </div>
        </div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {securityFeatures.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-purple-500/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <feature.icon className="w-5 h-5 text-purple-400" />
                </div>
                <span className="px-2 py-0.5 text-xs font-medium text-green-400 bg-green-500/10 rounded-full">
                  Active
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Compliance Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Compliance & Certifications</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl text-center"
              >
                <div className="text-lg font-semibold text-white mb-1">{cert.name}</div>
                <div className={`text-sm mb-2 ${
                  cert.status === 'Compliant' || cert.status === 'Infrastructure Provider'
                    ? 'text-green-400'
                    : 'text-gray-400'
                }`}>
                  {cert.status}
                </div>
                <div className="text-xs text-gray-500">{cert.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Headers */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">HTTP Security Headers</h2>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Header</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-400">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {securityHeaders.map((header) => (
                    <tr key={header.header} className="border-b border-gray-800/50 last:border-0">
                      <td className="p-4 text-sm font-mono text-purple-400">{header.header}</td>
                      <td className="p-4 text-sm font-mono text-gray-400">{header.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Data Handling */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">How We Handle Your Data</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">Collection</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Only data necessary for the service</li>
                <li>• OAuth tokens encrypted immediately</li>
                <li>• No selling of personal data</li>
              </ul>
            </div>
            <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">Processing</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• AI processing via Anthropic Claude</li>
                <li>• Transcripts not used for AI training</li>
                <li>• Real-time processing, no retention</li>
              </ul>
            </div>
            <div className="p-6 bg-gray-900/50 border border-gray-800 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">Deletion</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>• Full data export on request</li>
                <li>• Account deletion within 30 days</li>
                <li>• Backup purge after retention period</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Vulnerability Reporting */}
        <div className="mb-16">
          <div className="p-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Security Vulnerability Reporting</h2>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Found a security issue? We appreciate responsible disclosure.
              Please report vulnerabilities to our security team.
            </p>
            <a
              href="mailto:security@replysequence.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              <Shield className="w-5 h-5" />
              Report a Vulnerability
            </a>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
