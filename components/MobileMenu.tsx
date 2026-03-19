'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, FileText, Layers, Brain, TrendingUp, ArrowRight, Play } from 'lucide-react';

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

const productItems = [
  {
    label: 'Follow-Ups',
    description: 'AI-generated follow-ups after every meeting',
    href: '/how-it-works#follow-ups',
    icon: FileText,
    color: '#6366F1',
  },
  {
    label: 'Sequences',
    description: 'Automated multi-step follow-up campaigns',
    href: '/how-it-works#sequences',
    icon: Layers,
    color: '#7A5CFF',
  },
  {
    label: 'Meeting Intelligence',
    description: 'Analyze transcripts and extract next steps',
    href: '/how-it-works#intelligence',
    icon: Brain,
    color: '#38E8FF',
  },
  {
    label: 'Pipeline Automation',
    description: 'Track deal momentum and risks',
    href: '/how-it-works#pipeline',
    icon: TrendingUp,
    color: '#4DFFA3',
  },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Set portal target after mount (client-side only)
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const menuRef = useRef<HTMLElement>(null);

  // Close menu on escape key + focus trap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        return;
      }
      // Focus trap when menu is open
      if (e.key === 'Tab' && isOpen && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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

  const linkClass =
    'text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]';

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
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
          className={`fixed inset-0 backdrop-blur-lg md:hidden transition-[opacity,visibility] duration-300 overscroll-contain ${
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
            ref={menuRef}
            className={`flex flex-col items-center justify-center h-full gap-6 px-4 overflow-y-auto transition-[transform,opacity] duration-300 ${
              isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
            }`}
            style={{ paddingTop: '80px', paddingBottom: '40px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Product Accordion */}
            <div className="flex flex-col items-center w-full max-w-sm">
              <button
                onClick={() => setProductOpen(!productOpen)}
                className="flex items-center gap-2 text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                aria-expanded={productOpen}
              >
                Product
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${productOpen ? 'rotate-180' : ''}`} />
              </button>
              <div
                className={`w-full flex flex-col items-center gap-1 mt-3 overflow-hidden transition-[max-height,opacity] duration-300 ${
                  productOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                {productItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="group flex items-start gap-3 w-full p-3 rounded-xl transition-colors hover:bg-white/[0.05] outline-none focus-visible:ring-1 focus-visible:ring-[#6366F1]/40"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="w-4 h-4" style={{ color: item.color }} strokeWidth={1.5} />
                      </div>
                      <div>
                        <div className="text-base font-medium text-white">{item.label}</div>
                        <div className="text-xs text-gray-400 leading-relaxed">{item.description}</div>
                      </div>
                    </a>
                  );
                })}
                <a
                  href="/how-it-works"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-1.5 mt-1 text-xs font-medium text-gray-400 hover:text-[#6366F1] transition-colors"
                >
                  Explore the platform
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Demo Link */}
            <a
              href="/demo"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
            >
              <Play className="w-5 h-5 text-[#6366F1]" fill="#6366F1" strokeWidth={0} />
              Demo
            </a>

            <a href="/how-it-works" onClick={() => setIsOpen(false)} className={linkClass}>
              How It Works
            </a>

            {/* Compare Accordion */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => setCompareOpen(!compareOpen)}
                className="flex items-center gap-2 text-2xl font-medium text-gray-300 hover:text-white transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                aria-expanded={compareOpen}
              >
                Compare
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${compareOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`flex flex-col items-center gap-3 mt-4 overflow-y-auto transition-[max-height,opacity] duration-300 ${compareOpen ? 'max-h-[70vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                {competitors.map((competitor) => (
                  <a
                    key={competitor.slug}
                    href={`/compare/${competitor.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-gray-400 hover:text-[#6366F1] transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                  >
                    {competitor.name}
                  </a>
                ))}
              </div>
            </div>

            <a href="/integrations" onClick={() => setIsOpen(false)} className={linkClass}>
              Integrations
            </a>
            <a href="/pricing" onClick={() => setIsOpen(false)} className={linkClass}>
              Pricing
            </a>
            <a href="/blog" onClick={() => setIsOpen(false)} className={linkClass}>
              Blog
            </a>
            <a href="/dashboard" onClick={() => setIsOpen(false)} className={linkClass}>
              Dashboard
            </a>
            <a
              href="/#waitlist"
              onClick={() => setIsOpen(false)}
              className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-[color,box-shadow] duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
                boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)',
              }}
            >
              Join the Waitlist
            </a>
          </nav>
        </div>,
        portalTarget
      )}
    </>
  );
}
