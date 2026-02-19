import Link from 'next/link';
import { GradientText } from '@/components/ui/GradientText';

const productLinks = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/integrations', label: 'Integrations' },
];

const companyLinks = [
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/blog/rss.xml', label: 'RSS Feed' },
  { href: '/contact', label: 'Contact' },
];

const legalLinks = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/security', label: 'Security' },
];

export function Footer() {
  return (
    <footer className="py-10 md:py-14 px-4 border-t border-gray-800 light:border-gray-200 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <GradientText className="text-2xl font-bold">ReplySequence</GradientText>
            </Link>
            <p className="text-sm text-gray-500 light:text-gray-600 mt-2">
              Turn meetings into follow-ups in seconds.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-3">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 light:text-gray-600 hover:text-indigo-400 light:hover:text-indigo-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-3">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 light:text-gray-600 hover:text-indigo-400 light:hover:text-indigo-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white light:text-gray-900 mb-3">Legal</h3>
            <ul className="space-y-2">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 light:text-gray-600 hover:text-indigo-400 light:hover:text-indigo-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-gray-800/50 light:border-gray-200 text-center text-sm text-gray-500 light:text-gray-600">
          <p>&copy; {new Date().getFullYear()} ReplySequence. Built by Playground Giants.</p>
        </div>
      </div>
    </footer>
  );
}
