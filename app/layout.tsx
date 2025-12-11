import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import PaddleAutoCheckout from '@/components/billing/PaddleAutoCheckout';
import Script from 'next/script';

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "ManyMarkets | From Market Insight to Marketplace Success",
  description: "The only platform that guides you from 'I want to build something' to 'I'm making sales'—with AI doing the heavy lifting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-white text-black`}
      >
        {/* Include Paddle.js via Next.js Script for reliable loading per Paddle docs */}
        <Script src="https://cdn.paddle.com/paddle/paddle.js" strategy="afterInteractive" />
        <PaddleAutoCheckout />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
