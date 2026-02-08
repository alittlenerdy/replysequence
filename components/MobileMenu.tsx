'use client';

import { useState, useEffect } from 'react';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

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
        className="md:hidden relative w-10 h-10 flex flex-col items-center justify-center gap-1.5 z-50"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isOpen}
      >
        <span
          className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
            isOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </button>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-gray-900/95 light:bg-white/95 backdrop-blur-lg z-40 md:hidden transition-all duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
      >
        {/* Menu Content */}
        <nav
          className={`flex flex-col items-center justify-center h-full gap-8 transition-all duration-300 ${
            isOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href="/how-it-works"
            onClick={() => setIsOpen(false)}
            className="text-2xl font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            How It Works
          </a>
          <a
            href="/compare/otter"
            onClick={() => setIsOpen(false)}
            className="text-2xl font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            vs Otter.ai
          </a>
          <a
            href="/pricing"
            onClick={() => setIsOpen(false)}
            className="text-2xl font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            Pricing
          </a>
          <a
            href="/dashboard"
            onClick={() => setIsOpen(false)}
            className="text-2xl font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            Dashboard
          </a>
          <a
            href="https://tally.so/r/D4pv0j"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #9333ea 100%)',
              boxShadow: '0 8px 30px rgba(37, 99, 235, 0.4)',
            }}
          >
            Join Waitlist
          </a>
        </nav>
      </div>
    </>
  );
}
