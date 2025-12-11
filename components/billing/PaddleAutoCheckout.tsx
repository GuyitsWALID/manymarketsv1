"use client";

import React, { useEffect, useState } from 'react';

export default function PaddleAutoCheckout() {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!(window as any).location) return;
    const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;
    // If Paddle script was already loaded (via next/script in layout), we can just call Setup and open
    if ((window as any).Paddle && vendorId) {
      try { (window as any).Paddle.Setup({ vendor: Number(vendorId) }); } catch (e) { /* ignore */ }
      setScriptLoaded(true);
      openFromQuery();
      return;
    }
    // Fallback: dynamically load Paddle.js if not loaded by layout
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/paddle.js';
    s.async = true;
    s.onload = () => {
      try { if ((window as any).Paddle && vendorId) (window as any).Paddle.Setup({ vendor: Number(vendorId) }); } catch (e) { /* ignore */ }
      setScriptLoaded(true);
      openFromQuery();
    };
    document.head.appendChild(s);

    function openFromQuery() {
      try {
        const params = new URLSearchParams(window.location.search || '');
        const tx = params.get('_ptxn');
        if (!tx) return;
        // If paddle script loaded and available, open overlay with transactionId
        if ((window as any).Paddle && (window as any).Paddle.Checkout) {
          try {
            (window as any).Paddle.Checkout.open({ transactionId: tx });
            // Remove `_ptxn` param from URL to avoid repeated auto-open on reload
            try { window.history.replaceState(null, '', window.location.pathname); } catch (e) {}
          }
          catch (e) { console.warn('Failed to open Paddle checkout overlay with transactionId', e); }
        }
      } catch (err) {
        console.warn('Error detecting _ptxn param', err);
      }
    }
  }, []);

  return null;
}
