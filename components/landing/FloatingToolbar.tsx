'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Sparkles, Scale, CreditCard, Mail, LayoutDashboard, PlayCircle, Plug, BookOpen } from 'lucide-react';
import { ActiveIndicator } from './ActiveIndicator';
import { ToolbarThemeToggle } from './ToolbarThemeToggle';

const OBSERVED_SECTIONS = [
  { id: 'hero', navIndex: 0 },
  { id: 'features', navIndex: 1 },
  { id: 'waitlist', navIndex: 7 },
] as const;

const NAV_ITEMS = [
  { label: 'Home', icon: Home, target: '#hero' },
  { label: 'Features', icon: Sparkles, target: '#features' },
  { label: 'How It Works', icon: PlayCircle, target: '/how-it-works' },
  { label: 'Compare', icon: Scale, target: '/compare' },
  { label: 'Integrations', icon: Plug, target: '/integrations' },
  { label: 'Pricing', icon: CreditCard, target: '/pricing' },
  { label: 'Blog', icon: BookOpen, target: '/blog' },
  { label: 'Waitlist', icon: Mail, target: '#waitlist' },
] as const;

export function FloatingToolbar() {
  const { isSignedIn, isLoaded } = useUser();
  const [activeIndex, setActiveIndex] = useState(0);
  const [indicatorPos, setIndicatorPos] = useState({ left: 0, width: 0 });
  const buttonRefs = useRef<(HTMLElement | null)[]>([]);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Measure button positions for indicator
  const updateIndicatorPos = useCallback(() => {
    const btn = buttonRefs.current[activeIndex];
    if (btn && toolbarRef.current) {
      const toolbarRect = toolbarRef.current.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicatorPos({
        left: btnRect.left - toolbarRect.left,
        width: btnRect.width,
      });
    }
  }, [activeIndex]);

  useEffect(() => {
    updateIndicatorPos();
  }, [updateIndicatorPos]);

  // ResizeObserver for recalculating on window resize
  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const observer = new ResizeObserver(() => {
      updateIndicatorPos();
    });
    observer.observe(toolbar);
    return () => observer.disconnect();
  }, [updateIndicatorPos]);

  // Intersection Observer for active section detection
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    // Small delay to let dynamic imports render their sections
    const timeout = setTimeout(() => {
      OBSERVED_SECTIONS.forEach(({ id, navIndex }) => {
        const el = document.getElementById(id);
        if (!el) return;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
                setActiveIndex(navIndex);
              }
            });
          },
          {
            rootMargin: '-40% 0px -40% 0px',
            threshold: [0, 0.25, 0.5],
          }
        );
        observer.observe(el);
        observers.push(observer);
      });
    }, 500);

    return () => {
      clearTimeout(timeout);
      observers.forEach((o) => o.disconnect());
    };
  }, []);

  const handleNavClick = (target: string, index: number) => {
    if (target.startsWith('/')) return; // Link handles navigation
    setActiveIndex(index);

    if (target === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(target.replace('#', ''));
    if (el) {
      // Use window.scrollTo instead of scrollIntoView to avoid
      // issues with overflow-hidden on the root container
      const top = el.getBoundingClientRect().top + window.scrollY - 20;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Ambient glow behind toolbar */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[120px] pointer-events-none z-40"
        style={{
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          filter: 'blur(20px)',
        }}
      />

      {/* Toolbar */}
      <nav
        ref={toolbarRef}
        aria-label="Main navigation"
        className="toolbar-noise fixed z-50 flex items-center gap-1 px-2 py-2 rounded-2xl bg-gray-900/60 light:bg-white/70 backdrop-blur-xl border border-white/[0.08] light:border-gray-200/50 shadow-2xl bottom-4 left-4 right-4 md:bottom-6 md:left-1/2 md:right-auto md:-translate-x-1/2"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Active indicator ring */}
        <ActiveIndicator left={indicatorPos.left} width={indicatorPos.width} />

        {/* Logo — desktop only */}
        <Link
          href="/"
          className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors relative z-10"
        >
          <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
          <span className="text-sm font-bold bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 light:from-indigo-600 light:to-indigo-600 bg-clip-text text-transparent">
            RS
          </span>
        </Link>

        {/* Divider */}
        <div className="hidden md:block h-5 w-px bg-white/10 light:bg-gray-300/50 mx-1" />

        {/* Nav buttons — scrollable on mobile */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map((item, index) => {
            const isLink = item.target.startsWith('/');
            const Icon = item.icon;
            const isActive = activeIndex === index;

            const buttonContent = (
              <>
                <Icon
                  className={`w-[18px] h-[18px] transition-colors ${
                    isActive
                      ? 'text-indigo-400 light:text-indigo-600'
                      : 'text-gray-400 light:text-gray-500'
                  }`}
                  strokeWidth={1.5}
                />
                <span
                  className={`hidden md:inline text-xs font-medium transition-colors ${
                    isActive
                      ? 'text-white light:text-gray-900'
                      : 'text-gray-400 light:text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </>
            );

            if (isLink) {
              return (
                <Link
                  key={item.label}
                  ref={(el: HTMLAnchorElement | null) => { buttonRefs.current[index] = el; }}
                  href={item.target}
                  className="relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors flex-shrink-0"
                >
                  {buttonContent}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                ref={(el) => { buttonRefs.current[index] = el; }}
                onClick={() => handleNavClick(item.target, index)}
                className="relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors flex-shrink-0"
              >
                {buttonContent}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-white/10 light:bg-gray-300/50 mx-1 flex-shrink-0" />

        {/* Utility section */}
        <div className="flex items-center gap-1 relative z-10 flex-shrink-0">
          {/* Dashboard — signed in only */}
          {isLoaded && isSignedIn && (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors"
            >
              <LayoutDashboard
                className="w-[18px] h-[18px] text-gray-400 light:text-gray-500"
                strokeWidth={1.5}
              />
              <span className="hidden md:inline text-xs font-medium text-gray-400 light:text-gray-500">
                Dashboard
              </span>
            </Link>
          )}

          {/* Theme toggle */}
          <ToolbarThemeToggle />

          {/* Auth controls */}
          {!isLoaded && (
            <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
          )}

          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="text-xs font-medium text-gray-400 light:text-gray-500 hover:text-white light:hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-white/10 light:hover:bg-gray-900/5 transition-colors">
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
        </div>
      </nav>
    </>
  );
}
