"use client";

import React, { useEffect, useState } from 'react';

export default function PaddleAutoCheckout() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    
    if (!clientToken) {
      console.warn('NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set. Auto checkout will not be initialized. Add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN to .env.local if you use Paddle overlay.');
      return;
    }
    const env = (process.env.NEXT_PUBLIC_PADDLE_ENV || 'sandbox') as 'sandbox' | 'production';
    
    // Check if Paddle v2 is already loaded
    if ((window as any).Paddle && clientToken) {
      try { 
        (window as any).Paddle.Environment.set(env);
        (window as any).Paddle.Initialize({ token: clientToken }); 
      } catch (e) { /* ignore */ }
      setScriptLoaded(true);
      openFromQuery();
      return;
    }
    
    // Load Paddle.js v2
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.async = true;
      s.onload = () => {
      try { 
        if ((window as any).Paddle && clientToken) {
          (window as any).Paddle.Environment.set(env);
          (window as any).Paddle.Initialize({ token: clientToken }); 
        }
      } catch (e) { /* ignore */ }
      setScriptLoaded(true);
      openFromQuery();
    };
    document.head.appendChild(s);

    function openFromQuery() {
      try {
        const params = new URLSearchParams(window.location.search || '');
        const tx = params.get('_ptxn');
        if (!tx) return;
        
        if ((window as any).Paddle && (window as any).Paddle.Checkout) {
          try {
            (window as any).Paddle.Checkout.open({ transactionId: tx });
            // Remove `_ptxn` param from URL
            try { window.history.replaceState(null, '', window.location.pathname); } catch (e) {}
          }
          catch (e) { console.warn('Failed to open Paddle checkout', e); }
        }
      } catch (err) {
        console.warn('Error detecting _ptxn param', err);
      }
    }
  }, []);

  return null;
}