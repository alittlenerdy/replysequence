import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "./providers/posthog-provider";
import MouseTrail from "@/components/MouseTrail";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

const siteUrl = "https://replysequence.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ReplySequence - AI Follow-Up Emails from Meetings",
    template: "%s | ReplySequence",
  },
  description: "Turn Zoom, Teams, and Meet calls into perfect follow-up emails in 8 seconds. AI-powered drafts, automatically generated, CRM-ready. Save 10+ hours per week.",
  keywords: [
    "AI email drafts",
    "meeting follow-up",
    "Zoom transcripts",
    "Microsoft Teams integration",
    "Google Meet automation",
    "sales follow-up",
    "CRM automation",
    "AI email assistant",
    "meeting notes to email",
    "automatic follow-up emails",
    "sales productivity",
    "email automation",
  ],
  authors: [{ name: "Playground Giants", url: "https://playgroundgiants.com" }],
  creator: "Playground Giants",
  publisher: "ReplySequence",
  icons: {
    icon: [
      { url: '/icon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=2', sizes: 'any' },
    ],
    apple: '/icon.svg?v=2',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "ReplySequence",
    title: "ReplySequence - AI Follow-Up Emails from Meetings",
    description: "Turn Zoom, Teams, and Meet calls into perfect follow-up emails in 8 seconds. AI-powered drafts, automatically generated, CRM-ready.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReplySequence - AI-powered meeting follow-up emails",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReplySequence - AI Follow-Up Emails from Meetings",
    description: "Turn Zoom, Teams, and Meet calls into perfect follow-up emails in 8 seconds. Save 10+ hours per week.",
    images: ["/og-image.png"],
    creator: "@replysequence",
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
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="antialiased">
          <PostHogProvider>
            <MouseTrail />
            {children}
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
