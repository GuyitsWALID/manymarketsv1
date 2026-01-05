'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, MailX, CheckCircle, XCircle, Loader2 } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'pending' | 'success' | 'error' | 'already'>('pending');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If success param is set, we were redirected after successful unsubscribe
    if (success === 'true') {
      setStatus('success');
      return;
    }

    // If token is present, verify and process unsubscribe
    if (token) {
      setLoading(true);
      fetch('/api/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        })
        .catch(() => setStatus('error'))
        .finally(() => setLoading(false));
    } else if (!success) {
      // No token and no success - show already unsubscribed or landing state
      setStatus('already');
    }
  }, [token, success]);

  return (
    <div className="min-h-screen bg-uvz-cream flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black rounded-2xl shadow-brutal p-8 max-w-md w-full text-center">
        {loading ? (
          <>
            <Loader2 className="w-16 h-16 text-uvz-orange animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-black mb-2">Processing...</h1>
            <p className="text-gray-600">Please wait while we update your preferences.</p>
          </>
        ) : status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-black mb-2">You&apos;re Unsubscribed</h1>
            <p className="text-gray-600 mb-6">
              You won&apos;t receive any more daily niche idea emails from us. 
              We&apos;re sorry to see you go!
            </p>
            <div className="space-y-3">
              <Link
                href="/daily-ideas"
                className="block w-full bg-uvz-orange text-white font-bold py-3 px-6 border-3 border-black rounded-xl shadow-brutal-sm hover:-translate-y-0.5 transition-all"
              >
                Browse Ideas on the Website
              </Link>
              <Link
                href="/"
                className="block w-full bg-white text-black font-bold py-3 px-6 border-3 border-black rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </>
        ) : status === 'error' ? (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-black mb-2">Something Went Wrong</h1>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t process your unsubscribe request. The link may have expired or is invalid.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                If you continue to receive emails, please contact us at{' '}
                <a href="mailto:support@manymarkets.ai" className="text-uvz-orange underline">
                  support@manymarkets.ai
                </a>
              </p>
              <Link
                href="/"
                className="block w-full bg-uvz-orange text-white font-bold py-3 px-6 border-3 border-black rounded-xl shadow-brutal-sm hover:-translate-y-0.5 transition-all"
              >
                Go to Homepage
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailX className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-black mb-2">Email Preferences</h1>
            <p className="text-gray-600 mb-6">
              To unsubscribe from daily idea emails, please click the unsubscribe link in your email.
            </p>
            <div className="space-y-3">
              <Link
                href="/daily-ideas"
                className="block w-full bg-uvz-orange text-white font-bold py-3 px-6 border-3 border-black rounded-xl shadow-brutal-sm hover:-translate-y-0.5 transition-all"
              >
                Browse Daily Ideas
              </Link>
              <Link
                href="/"
                className="block w-full bg-white text-black font-bold py-3 px-6 border-3 border-black rounded-xl hover:bg-gray-50 transition-colors"
              >
                Go to Homepage
              </Link>
            </div>
          </>
        )}

        {/* Re-subscribe hint */}
        {status === 'success' && (
          <p className="text-xs text-gray-400 mt-6">
            Changed your mind? Log in to your account settings to re-subscribe.
          </p>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
