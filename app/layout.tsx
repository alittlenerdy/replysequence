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

export const metadata: Metadata = {
  title: "ReplySequence - AI Follow-Up Emails from Meetings",
  description: "Turn Zoom, Teams, and Meet calls into perfect follow-up emails. AI-powered, automatically drafted, CRM-ready.",
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/icon.svg',
  },
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
