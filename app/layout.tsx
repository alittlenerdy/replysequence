import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto",
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
      <html lang="en">
        <body className={`${roboto.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
