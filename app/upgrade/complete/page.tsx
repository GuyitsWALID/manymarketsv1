'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

function UpgradeCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  useEffect(() => {
    // Check the status query parameter from Whop redirect
    const statusParam = searchParams.get('status');
    const receiptId = searchParams.get('receipt_id');
    
    if (statusParam === 'success' || receiptId) {
      setStatus('success');
      // Optionally verify the purchase on the server
      verifyPurchase(receiptId);
    } else if (statusParam === 'error') {
      setStatus('error');
    } else {
      // Default to success if redirected without explicit status
      // This handles cases where Whop redirects without status param
      setTimeout(() => {
        if (status === 'loading') {
          setStatus('success');
        }
      }, 2000);
    }
  }, [searchParams]);

  const verifyPurchase = async (receiptId: string | null) => {
    if (!receiptId) return;
    
    try {
      // You can add server-side verification here if needed
      const response = await fetch('/api/billing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptId }),
      });
      
      if (response.ok) {
        setStatus('success');
      }
    } catch (error) {
      console.error('Failed to verify purchase:', error);
      // Still show success since Whop handles the payment
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Processing your upgrade...</h1>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white border-4 border-black rounded-2xl shadow-brutal p-8 max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">
            Something went wrong with your payment. Please try again or contact support if the issue persists.
          </p>
          <div className="space-y-3">
            <Link
              href="/upgrade"
              className="flex items-center justify-center gap-2 w-full py-3 bg-uvz-orange text-white font-bold rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              Try Again
            </Link>
            <Link
              href="/chat"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl border-2 border-black hover:-translate-y-0.5 transition-all"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black rounded-2xl shadow-brutal p-8 max-w-md text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-black mb-2">Welcome to Pro! 🎉</h1>
        <p className="text-gray-600 mb-6">
          Your upgrade was successful. You now have unlimited access to AI research sessions and all Pro features.
        </p>
        <div className="space-y-3">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 w-full py-3 bg-uvz-orange text-white font-bold rounded-xl border-2 border-black shadow-brutal hover:-translate-y-0.5 transition-all"
          >
            Start Researching
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/builder"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 text-gray-700 font-bold rounded-xl border-2 border-black hover:-translate-y-0.5 transition-all"
          >
            Go to Product Builder
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Processing your upgrade...</h1>
          <p className="text-gray-600 mt-2">Please wait while we confirm your payment.</p>
        </div>
      </div>
    }>
      <UpgradeCompleteContent />
    </Suspense>
  );
}
