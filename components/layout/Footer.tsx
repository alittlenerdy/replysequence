import Link from 'next/link';
import { GradientText } from '@/components/ui/GradientText';
import { Linkedin, Github } from 'lucide-react';

const productLinks = [
  { href: '/how-it-works', label: 'Follow-Ups' },
  { href: '/how-it-works#sequences', label: 'Sequences' },
  { href: '/how-it-works#meeting-intelligence', label: 'Meeting Intelligence' },
  { href: '/how-it-works#pipeline', label: 'Pipeline Automation' },
  { href: '/demo', label: 'Demo' },
];

const companyLinks = [
  { href: '/compare', label: 'Compare' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/newsletter', label: 'Newsletter' },
];

const legalLinks = [
  { href: '/privacy', label: 'Privacy' },
  { href: '/security', label: 'Security' },
  { href: '/terms', label: 'Terms' },
];

const linkClasses =
  'text-sm text-[#64748B] hover:text-white light:text-gray-500 light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] light:focus-visible:ring-offset-white';

const socialClasses =
  'text-[#64748B] hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] light:focus-visible:ring-offset-white';

export function Footer() {
  return (
    <footer className="border-t border-[#1E2A4A] light:border-gray-200 bg-[#030712] light:bg-[#F1F5F9] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-5">
            <Link
              href="/"
              className="inline-block rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] light:focus-visible:ring-offset-white"
            >
              <GradientText className="text-2xl font-bold tracking-tight">
                ReplySequence
              </GradientText>
            </Link>
            <p className="text-sm text-[#64748B] mt-2 max-w-xs leading-relaxed">
              The follow-up layer for sales.
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a
                href="https://linkedin.com/in/jimmyhackett"
                target="_blank"
                rel="noopener noreferrer"
                className={socialClasses}
                aria-label="LinkedIn"
              >
                <Linkedin className="w-[18px] h-[18px]" aria-hidden="true" />
              </a>
              <a
                href="https://x.com/replysequence"
                target="_blank"
                rel="noopener noreferrer"
                className={socialClasses}
                aria-label="X (Twitter)"
              >
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/alittlenerdy"
                target="_blank"
                rel="noopener noreferrer"
                className={socialClasses}
                aria-label="GitHub"
              >
                <Github className="w-[18px] h-[18px]" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 light:text-gray-400 mb-4">
              Product
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="col-span-1 md:col-span-3 lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 light:text-gray-400 mb-4">
              Company
            </h3>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/60 light:text-gray-400 mb-4">
              Legal
            </h3>
            <ul className="space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClasses}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-[#1E2A4A]/50 light:border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#64748B]">
          <p>&copy; {new Date().getFullYear()} ReplySequence</p>
          <p>Built with taste by Playground Giants</p>
        </div>
      </div>
    </footer>
  );
}
