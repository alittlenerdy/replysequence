'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { ChevronDown, FileText, Layers, Brain, TrendingUp, ArrowRight } from 'lucide-react';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });
const MobileMenu = dynamic(() => import('@/components/MobileMenu'), { ssr: false });

const productItems = [
  {
    label: 'Follow-Ups',
    description: 'AI-generated follow-ups after every meeting',
    href: '/how-it-works#follow-ups',
    icon: FileText,
    color: '#5B6CFF',
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

function ProductDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        return;
      }

      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setOpen(true);
          // Focus first item after open
          requestAnimationFrame(() => itemsRef.current[0]?.focus());
          return;
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const focusedIndex = itemsRef.current.findIndex(
          (el) => el === document.activeElement
        );
        let next: number;
        if (e.key === 'ArrowDown') {
          next = focusedIndex < itemsRef.current.length - 1 ? focusedIndex + 1 : 0;
        } else {
          next = focusedIndex > 0 ? focusedIndex - 1 : itemsRef.current.length - 1;
        }
        itemsRef.current[next]?.focus();
      }
    },
    [open]
  );

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Product
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          strokeWidth={2}
        />
      </button>

      {/* Dropdown Panel */}
      <div
        className={`absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-[160ms] ease-out ${
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
        role="menu"
        aria-label="Product features"
      >
        <div className="w-[380px] rounded-2xl bg-gray-900/90 light:bg-white/95 backdrop-blur-xl border border-gray-700/60 light:border-gray-200 shadow-xl shadow-black/20 light:shadow-gray-300/30 p-3">
          {productItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                ref={(el) => { itemsRef.current[i] = el; }}
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                className="group flex items-start gap-3 p-3 rounded-xl transition-colors duration-150 hover:bg-[#5B6CFF]/10 light:hover:bg-[#5B6CFF]/5 outline-none focus-visible:bg-[#5B6CFF]/10 focus-visible:ring-1 focus-visible:ring-[#5B6CFF]/40"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: item.color }} strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white light:text-gray-900 mb-0.5">
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-400 light:text-gray-500 leading-relaxed">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Footer link */}
          <div className="mt-1 pt-2 border-t border-gray-800/60 light:border-gray-100">
            <Link
              href="/how-it-works"
              ref={(el) => { itemsRef.current[productItems.length] = el; }}
              role="menuitem"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpen(false)}
              className="group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-gray-400 light:text-gray-500 hover:text-[#5B6CFF] light:hover:text-[#4A5BEE] transition-colors outline-none focus-visible:text-[#5B6CFF] focus-visible:ring-1 focus-visible:ring-[#5B6CFF]/40"
            >
              Explore the platform
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const navLinkClass =
  'text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]';

export function Header() {
  const { isSignedIn, isLoaded, user } = useUser();

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-900/80 light:bg-white/80 backdrop-blur-md border-b border-gray-700 light:border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-[#7A8BFF] via-[#5B6CFF] to-[#4A5BEE] light:from-[#4A5BEE] light:via-[#4A5BEE] light:to-[#4A5BEE] bg-clip-text text-transparent rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-md drop-shadow-lg light:drop-shadow-md" />
          ReplySequence
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-5">
          <ProductDropdown />
          <Link href="/compare" className={navLinkClass}>Compare</Link>
          <Link href="/integrations" className={navLinkClass}>Integrations</Link>
          <Link href="/pricing" className={navLinkClass}>Pricing</Link>
          <Link href="/blog" className={navLinkClass}>Blog</Link>

          {isLoaded && isSignedIn && (
            <Link href="/dashboard" className={navLinkClass}>Dashboard</Link>
          )}

          <ThemeToggle />

          {/* Auth Controls */}
          {!isLoaded && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
          )}

          {isLoaded && !isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button className={navLinkClass}>Sign In</button>
              </SignInButton>
              <a
                href="/#waitlist"
                className="btn-cta !px-6 !py-2 !text-base outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
              >
                Join Waitlist
              </a>
            </>
          )}

          {isLoaded && isSignedIn && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-300 light:text-gray-600">
                Hey, {user?.firstName || 'there'}!
              </span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          {/* Mobile Auth */}
          {!isLoaded && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
          )}

          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-gray-300 light:text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-800 light:hover:bg-gray-100 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]">
                Sign In
              </button>
            </SignInButton>
          )}

          {isLoaded && isSignedIn && (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: 'h-8 w-8',
                },
              }}
            />
          )}

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
