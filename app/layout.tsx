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
      <head>
        {/* Optional verification meta tag for payment provider verification */}
        {process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_VERIFY ? (
          <meta name="payment-provider-verify" content={process.env.NEXT_PUBLIC_PAYMENT_PROVIDER_VERIFY} />
        ) : null}
      </head>
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-white text-black`}
      >
        {/* Include payment provider overlay JS if used by client (e.g. Paddle) via Next.js Script for reliable loading */}
        <Script src="https://cdn.paddle.com/paddle/paddle.js" strategy="afterInteractive" />
        <PaddleAutoCheckout />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
