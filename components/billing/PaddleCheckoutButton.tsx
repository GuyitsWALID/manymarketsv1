"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initializePaddle, Paddle } from '@paddle/paddle-js';
import { ENABLE_PRICING } from '@/lib/config';

type Props = {
  productId: string;
  children?: React.ReactNode;
  className?: string;
};

export default function PaddleCheckoutButton({ 
  productId, 
  children = 'Upgrade', 
  className = '' 
}: Props) {
  const [loading, setLoading] = useState(false);
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initPaddle = async () => {
      try {
        const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        const env = (process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox') as 'sandbox' | 'production';

        if (!token) {
          console.warn('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set. Paddle initialization skipped. Add it to .env.local if you plan to use Paddle overlay.');
          return;
        }

        const paddleInstance = await initializePaddle({
          token,
          environment: env,
        });

        setPaddle(paddleInstance ?? null);
      } catch (error) {
        console.error('Failed to initialize Paddle:', error);
      }
    };

    initPaddle();
  }, []);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!ENABLE_PRICING) {
      alert('Billing and pricing are currently disabled. ManyMarkets is free to use for now.');
      return;
    }
    setLoading(true);
    
    try {
      // Create transaction via your API
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', productId }),
      });

      if (res.status === 401) {
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

      const transactionId = json.transactionId || json.id;
      
      if (!transactionId) {
        console.error('No transaction ID returned from server');
        alert('Failed to create checkout transaction');
        setLoading(false);
        return;
      }

      // Open checkout with transaction ID
      if (paddle) {
        paddle.Checkout.open({
          transactionId: transactionId
        });
      } else {
        // Fallback to redirecting to the returned checkout URL if overlay failed to initialize
        console.warn('Paddle not initialized; falling back to redirect if checkout URL provided by server');
        if (json?.url) {
          window.location.assign(json.url);
          return;
        }
        console.error('Paddle not initialized');
        alert('Checkout system not ready. Please refresh and try again.');
      }
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
      disabled={!ENABLE_PRICING || loading || !paddle}
      title={!ENABLE_PRICING ? 'Billing is temporarily disabled' : undefined}
    >
      {(!ENABLE_PRICING) ? 'Billing Disabled' : (loading ? 'Processing...' : children)}
    </button>
  );
}