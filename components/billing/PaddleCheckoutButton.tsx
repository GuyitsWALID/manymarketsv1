"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  productId: string;
  children?: React.ReactNode;
  className?: string;
};

export default function PaddleCheckoutButton({ productId, children = 'Upgrade', className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const router = useRouter();

  const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as any).Paddle) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/paddle.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).Paddle && vendorId) {
        try {
          (window as any).Paddle.Setup({ vendor: Number(vendorId) });
        } catch (err) {
          // ignore
        }
      }
      setScriptLoaded(true);
    };
    script.onerror = () => setScriptLoaded(false);
    document.head.appendChild(script);
    return () => {
      // no teardown required
    };
  }, [vendorId]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', productId }),
      });
      if (res.status === 401) {
        // Not logged in, redirect to login preserving return path
        router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const json = await res.json();
      if (!res.ok || json?.error) {
        console.error('Checkout error from server', json);
        alert(json?.error || 'Failed to start checkout');
        setLoading(false);
        return;
      }
      const url = json.url;
      // If paddle script loaded, try to open overlay, otherwise redirect
      if (scriptLoaded && (window as any).Paddle && vendorId) {
        try {
          // If we got a direct link, we can just redirect to it for now.
          // Paddle Checkout overlay also accepts a product ID or custom link.
          if (url) {
            // Use direct redirect to host link to ensure correct passthrough
            window.location.href = url;
          } else {
            (window as any).Paddle.Checkout.open({ product: Number(productId) });
          }
          return;
        } catch (err) {
          // fallback to redirect
          console.error('Paddle overlay open error', err);
        }
      }

      // Fallback redirect
      window.location.href = url;
    } catch (err) {
      console.error('Checkout request failed', err);
      alert('Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      className={`block text-center font-bold px-4 sm:px-6 py-2 sm:py-3 border-2 sm:border-4 border-black shadow-brutal hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] transition-all text-sm sm:text-base ${className}`}
      disabled={loading}
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}
