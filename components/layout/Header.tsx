'use client';

import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const ThemeToggle = dynamic(() => import('@/components/ThemeToggle'), { ssr: false });
const MobileMenu = dynamic(() => import('@/components/MobileMenu'), { ssr: false });

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
          <Link
            href="/how-it-works"
            className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
          >
            Pricing
          </Link>

          {isLoaded && isSignedIn && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]"
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
                <button className="text-sm font-medium text-gray-300 light:text-gray-600 hover:text-white light:hover:text-gray-900 transition-colors rounded outline-none focus-visible:ring-2 focus-visible:ring-[#5B6CFF]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060B18]">
                  Sign In
                </button>
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
