import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PostHogProvider } from "./providers/posthog-provider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import MouseTrail from "@/components/MouseTrail";
import { MotionProvider } from "./providers/motion-provider";
import { ThemeSync } from "@/components/ThemeSync";
import "./globals.css";

const inter = Inter({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
});

const siteUrl = "https://www.replysequence.com";

export const viewport: Viewport = {
  themeColor: '#6366F1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ReplySequence — The Follow-Up Layer for Sales",
    template: "%s | ReplySequence",
  },
  description: "Every tool records the meeting. None of them send the follow-up. ReplySequence turns your sales calls into personalized follow-ups, sequences, and CRM updates — automatically.",
  keywords: [
    "sales follow-up automation",
    "post-meeting follow-up",
    "AI follow-up emails",
    "email sequences from meetings",
    "meeting follow-up tool",
    "Zoom follow-up automation",
    "sales email automation",
    "CRM automation",
    "deal momentum",
    "follow-up sequences",
    "sales productivity",
    "pipeline automation",
  ],
  authors: [{ name: "Playground Giants", url: "https://playgroundgiants.com" }],
  creator: "Playground Giants",
  publisher: "ReplySequence",
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ReplySequence',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ReplySequence",
    title: "ReplySequence — The Follow-Up Layer for Sales",
    description: "Every tool records the meeting. None of them send the follow-up. ReplySequence turns sales calls into personalized follow-ups, sequences, and CRM updates.",
    // images are auto-generated from app/opengraph-image.tsx file convention
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplySequence — The Follow-Up Layer for Sales",
    description: "Every tool records the meeting. None of them send the follow-up. ReplySequence keeps every deal moving after the call ends.",
    // images are auto-generated from app/opengraph-image.tsx file convention
    creator: "@replysequence",
  },
  verification: {
    google: [
      'guQOo2SFbRvxWJvXawgIX0IQ2_s-qXLn2M3Qp3tzAtE',
      '6hfkQ9CcgsUsjvhw3aiaVc6v1URK9YGSlsbvxFfEKZc',
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
    types: {
      'application/rss+xml': `${siteUrl}/blog/rss.xml`,
    },
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            if (localStorage.getItem('rs-theme') === 'light') {
              document.documentElement.classList.add('light');
            }
          } catch(e) {}
        ` }} />
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/@react-grab/claude-code/dist/client.global.js"
            strategy="lazyOnload"
          />
        )}
      </head>
        <body className="antialiased bg-[#060B18] light:bg-gray-50" suppressHydrationWarning>
          <ThemeSync />
          <a href="#main-content" className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[9999] focus-visible:px-4 focus-visible:py-2 focus-visible:bg-[#4F46E5] focus-visible:text-white focus-visible:rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1]">
            Skip to main content
          </a>
          {/* PostHog temporarily disabled to debug hydration issues */}
          {/* <PostHogProvider> */}
            {/* ServiceWorker disabled - unregister any existing SW */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.getRegistrations().then(function(registrations) {
                      for (let registration of registrations) {
                        registration.unregister();
                        console.log('SW unregistered');
                      }
                    });
                  }
                `,
              }}
            />
            {/* MouseTrail disabled - hydration issue */}
            {/* <MouseTrail /> */}
            <MotionProvider>
              <main id="main-content">
                {children}
              </main>
            </MotionProvider>
            {/* PWAInstallPrompt disabled - hydration issue */}
            {/* <PWAInstallPrompt /> */}
          {/* </PostHogProvider> */}
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
// Force rebuild Fri Feb 13 14:52:37 CST 2026
