'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const competitors = [
  { name: 'Gong', slug: 'gong', tagline: 'Revenue intelligence' },
  { name: 'Otter.ai', slug: 'otter', tagline: 'Meeting transcription' },
  { name: 'Fireflies.ai', slug: 'fireflies', tagline: 'AI meeting assistant' },
  { name: 'Chorus', slug: 'chorus', tagline: 'Conversation intelligence' },
  { name: 'Fathom', slug: 'fathom', tagline: 'Free meeting notes' },
  { name: 'Avoma', slug: 'avoma', tagline: 'Meeting lifecycle' },
  { name: 'Grain', slug: 'grain', tagline: 'Meeting highlights' },
  { name: 'tl;dv', slug: 'tldv', tagline: 'Meeting recorder' },
  { name: 'Manual Follow-Up', slug: 'manual', tagline: 'Spreadsheets & memory' },
];

export default function CompareDropdown({ direction = 'down' }: { direction?: 'down' | 'up' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Compare
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 w-64 rounded-xl overflow-hidden transition-[opacity,transform] duration-200 ${
          direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
        } ${
          isOpen
            ? 'opacity-100 visible translate-y-0'
            : direction === 'up'
              ? 'opacity-0 invisible translate-y-2'
              : 'opacity-0 invisible -translate-y-2'
        }`}
      >
        {/* Gradient border wrapper */}
        <div className="p-[1px] rounded-xl bg-gradient-to-br from-[#5B6CFF]/50 via-[#5B6CFF]/50 to-[#3A4BDD]/50">
          <div className="bg-gray-900 light:bg-white rounded-xl overflow-hidden">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ReplySequence vs
              </div>
              <Link
                href="/compare"
                onClick={() => setIsOpen(false)}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-[#5B6CFF]/10 hover:to-[#3A4BDD]/10 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18] mb-1"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-[#5B6CFF] group-hover:text-[#7A8BFF] transition-colors">
                    All Comparisons
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    See the full overview
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#5B6CFF]/50 group-hover:bg-[#5B6CFF] transition-colors duration-200" />
              </Link>
              <div className="border-t border-gray-800 light:border-gray-200 my-1" />
              {competitors.map((competitor, index) => (
                <Link
                  key={competitor.slug}
                  href={`/compare/${competitor.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gradient-to-r hover:from-[#5B6CFF]/10 hover:to-[#3A4BDD]/10 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white light:text-gray-900 group-hover:text-[#5B6CFF] transition-colors">
                      {competitor.name}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      {competitor.tagline}
                    </div>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-700 group-hover:bg-gradient-to-r group-hover:from-[#5B6CFF] group-hover:to-[#5B6CFF] transition-colors duration-200" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
