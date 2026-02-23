import Link from 'next/link';
import { GradientText } from '@/components/ui/GradientText';
import { Linkedin, Github } from 'lucide-react';

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
            <div className="flex items-center gap-3 mt-4">
              <a
                href="https://linkedin.com/in/jimmyhackett"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-indigo-400 light:hover:text-indigo-500 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/replysequence"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-indigo-400 light:hover:text-indigo-500 transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a
                href="https://github.com/alittlenerdy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-indigo-400 light:hover:text-indigo-500 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
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
