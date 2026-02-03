'use client';

import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });
const MobileMenu = dynamic(() => import('@/components/MobileMenu'), { ssr: false });

export function Header() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-900/80 light:bg-white/80 backdrop-blur-md border-b border-gray-700 light:border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-display font-bold text-blue-400 light:text-blue-600">
          ReplySequence
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {isLoaded && isSignedIn && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          )}

          <ThemeToggle />

          {/* Auth Controls */}
          {!isLoaded && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
          )}

          {isLoaded && !isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <a
                href="https://tally.so/r/D4pv0j"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta !px-6 !py-2 !text-base"
              >
                Join Waitlist
              </a>
            </>
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

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />

          {/* Mobile Auth */}
          {!isLoaded && (
            <div className="h-8 w-8 animate-pulse rounded-full bg-gray-700" />
          )}

          {isLoaded && !isSignedIn && (
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-gray-300 light:text-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-800 light:hover:bg-gray-100 transition-colors">
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
