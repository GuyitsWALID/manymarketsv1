import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://manymarkets.com';

export const metadata: Metadata = {
  title: "ManyMarkets | From Market Insight to Marketplace Success",
  description: "The only platform that guides you from 'I want to build something' to 'I'm making sales'—with AI doing the heavy lifting.",
  keywords: [
    'manymarkets', 'digital products', 'product builder', 'AI product ideas', 'ebook creator', 'startup', 'product research', 'market validation'
  ],
  authors: [{ name: 'ManyMarkets' }],
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: 'ManyMarkets | From Market Insight to Marketplace Success',
    description: "The only platform that guides you from 'I want to build something' to 'I'm making sales'—with AI doing the heavy lifting.",
    url: baseUrl,
    siteName: 'ManyMarkets',
    images: [{ url: `${baseUrl}/og-image.png` }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ManyMarkets | From Market Insight to Marketplace Success',
    description: "The only platform that guides you from 'I want to build something' to 'I'm making sales'—with AI doing the heavy lifting.",
    images: [`${baseUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  }
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

        {/* Canonical link */}
        <link rel="canonical" href={baseUrl} />

        {/* Theme color */}
        <meta name="theme-color" content="#ffffff" />

        {/* JSON-LD structured data for WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "ManyMarkets",
            "url": baseUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          }) }}
        />
      </head>
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-white text-black`}
      >
        {/* FreeBanner is shown only on the homepage to avoid site-wide repetition. */}

        {children}
        <Analytics />
      </body>
    </html>
  );
}
