import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
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
  title: "ReplySequence - Turn Zoom Calls Into Perfect Follow-Ups",
  description: "AI-powered follow-up emails from your Zoom transcripts. Automatically drafted, CRM-logged, and ready to send.",
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
          <MouseTrail />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
