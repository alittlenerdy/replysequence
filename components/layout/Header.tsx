'use client';

import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });
const MobileMenu = dynamic(() => import('@/components/MobileMenu'), { ssr: false });
const CompareDropdown = dynamic(() => import('@/components/CompareDropdown'), { ssr: false });

export function Header() {
  const { isSignedIn, isLoaded, user } = useUser();

  return (
    <header className="fixed top-0 w-full z-50 bg-gray-900/80 light:bg-white/80 backdrop-blur-md border-b border-gray-700 light:border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-xl sm:text-2xl font-display font-bold bg-gradient-to-r from-indigo-300 via-indigo-400 to-indigo-600 light:from-indigo-600 light:via-indigo-600 light:to-indigo-600 bg-clip-text text-transparent">
          ReplySequence
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            How It Works
          </Link>
          <CompareDropdown />
          <Link
            href="/integrations"
            className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            Integrations
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/blog"
            className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors"
          >
            Blog
          </Link>

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
                href="/sign-up"
                className="btn-cta !px-6 !py-2 !text-base"
              >
                Get Started Free
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
