'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

const competitors = [
  { name: 'vs Gong', slug: 'gong' },
  { name: 'vs Otter.ai', slug: 'otter' },
  { name: 'vs Fireflies.ai', slug: 'fireflies' },
  { name: 'vs Chorus', slug: 'chorus' },
  { name: 'vs Fathom', slug: 'fathom' },
  { name: 'vs Avoma', slug: 'avoma' },
  { name: 'vs Grain', slug: 'grain' },
  { name: 'vs tl;dv', slug: 'tldv' },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Set portal target after mount (client-side only)
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <span
          className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-current transition-opacity duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-current transition-transform duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </button>

      {/* Mobile Menu Overlay - rendered via portal to escape header stacking context */}
      {portalTarget && createPortal(
        <div
          className={`fixed inset-0 backdrop-blur-lg md:hidden transition-[opacity,visibility] duration-300 ${
            isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
          }`}
          style={{
            backgroundColor: 'rgba(17, 24, 39, 0.98)',
            zIndex: 9999,
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Menu Content - padded to avoid header */}
          <nav
            className={`flex flex-col items-center justify-center h-full gap-6 px-4 transition-[transform,opacity] duration-300 ${
              isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}
            style={{ paddingTop: '80px', paddingBottom: '40px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <a
              href="/how-it-works"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              How It Works
            </a>

            {/* Compare Accordion */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setCompareOpen(!compareOpen)}
                className="flex items-center gap-2 text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              >
                Compare
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${compareOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`flex flex-col items-center gap-3 mt-4 overflow-hidden transition-[max-height,opacity] duration-300 ${compareOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
                {competitors.map((competitor) => (
                  <a
                    key={competitor.slug}
                    href={`/compare/${competitor.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-gray-400 hover:text-blue-400 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                  >
                    {competitor.name}
                  </a>
                ))}
              </div>
            </div>

            <a
              href="/integrations"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Integrations
            </a>
            <a
              href="/pricing"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Pricing
            </a>
            <a
              href="/blog"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Blog
            </a>
            <a
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            >
              Dashboard
            </a>
            <a
              href="/sign-up"
              onClick={() => setIsOpen(false)}
              className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-[color,box-shadow] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
                boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)',
              }}
            >
              Get Started Free
            </a>
          </nav>
        </div>,
        portalTarget
      )}
    </>
  );
}
