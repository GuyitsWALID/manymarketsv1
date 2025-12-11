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
      const status = json.status;
      const transactionId = json.transactionId || json.id || null;
      // Validate that url is a Paddle-hosted checkout; otherwise show helpful message
      try {
        const parsed = new URL(url);
        if (!parsed.hostname.includes('paddle.com')) {
          alert('Checkout URL returned is not hosted by Paddle. Please verify your Paddle Checkout settings in the Dashboard.');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error('Invalid checkout URL returned from server', url, e);
        alert('Invalid checkout URL returned from server.');
        setLoading(false);
        return;
      }
      if (status && !['draft', 'ready', 'created'].includes(String(status).toLowerCase())) {
        // the transaction is not ready for checkout yet
        alert(`Transaction status: ${status}. Please verify the transaction in Paddle Dashboard.`);
        setLoading(false);
        return;
      }
      // If paddle script loaded, prefer to open overlay using transactionId when available
      if (scriptLoaded && (window as any).Paddle && vendorId) {
        try {
          // If transactionId is provided and the URL points to our site, open overlay using transactionId.
          if (transactionId) {
            (window as any).Paddle.Checkout.open({ transactionId });
            return;
          }
          // If we got a direct Paddle link, redirect to it.
          if (url && url.includes('paddle.com')) {
            window.location.href = url;
            return;
          }
          // Otherwise, fallback to opening overlay using product ID
          if (typeof productId === 'string' && !Number.isNaN(Number(productId))) {
            (window as any).Paddle.Checkout.open({ product: Number(productId) });
            return;
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
