'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, Github, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // If we get a session back from the client sign-in, set it on the server via API
        const session = data?.session;
        if (session?.access_token && session?.refresh_token) {
          const res = await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            }),
          });

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body?.error || 'Failed to set server session');
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/chat`,
          },
        });
        if (error) throw error;
        setError('Check your email for the confirmation link!');
        return;
      }
      router.push('/chat');
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/chat`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-uvz-orange border-r-8 border-black relative overflow-hidden p-12 flex-col justify-between">


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000] max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-yellow-300 border-4 border-black flex items-center justify-center shrink-0">
          <Sparkles className="w-8 h-8" />
              </div>
              <div>
          <h3 className="text-xl font-black mb-2">Find Your trending product</h3>
          <p className="font-medium text-gray-700">
            Discover profitable niches that match your skills and passion
          </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000] max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-300 border-4 border-black flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
              </div>
              <div>
          <h3 className="text-xl font-black mb-2">Build Products</h3>
          <p className="font-medium text-gray-700">
            Launch digital products in weeks, not months
          </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000] max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-green-300 border-4 border-black flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M12 2V22M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6313 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6313 13.6815 18 14.5717 18 15.5C18 16.4283 17.6313 17.3185 16.9749 17.9749C16.3185 18.6313 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
              </div>
              <div>
          <h3 className="text-xl font-black mb-2">Earn Revenue</h3>
          <p className="font-medium text-gray-700">
            Turn your expertise into sustainable income
          </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000] max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-purple-300 border-4 border-black flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M9 19C9 19.5304 9.21071 20.0391 9.58579 20.4142C9.96086 20.7893 10.4696 21 11 21H13C13.5304 21 14.0391 20.7893 14.4142 20.4142C14.7893 20.0391 15 19.5304 15 19V5C15 4.46957 14.7893 3.96086 14.4142 3.58579C14.0391 3.21071 13.5304 3 13 3H11C10.4696 3 9.96086 3.21071 9.58579 3.58579C9.21071 3.96086 9 4.46957 9 5V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 10C3 9.46957 3.21071 8.96086 3.58579 8.58579C3.96086 8.21071 4.46957 8 5 8H7C7.53043 8 8.03914 8.21071 8.41421 8.58579C8.78929 8.96086 9 9.46957 9 10V19C9 19.5304 8.78929 20.0391 8.41421 20.4142C8.03914 20.7893 7.53043 21 7 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 13C15 12.4696 15.2107 11.9609 15.5858 11.5858C15.9609 11.2107 16.4696 11 17 11H19C19.5304 11 20.0391 11.2107 20.4142 11.5858C20.7893 11.9609 21 12.4696 21 13V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H17C16.4696 21 15.9609 20.7893 15.5858 20.4142C15.2107 20.0391 15 19.5304 15 19V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
              </div>
              <div>
          <h3 className="text-xl font-black mb-2">Track Analytics</h3>
          <p className="font-medium text-gray-700">
            Real-time insights on market trends and opportunities
          </p>
              </div>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000000] max-w-md">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-pink-300 border-4 border-black flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
            <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
              </div>
              <div>
          <h3 className="text-xl font-black mb-2">Join Community</h3>
          <p className="font-medium text-gray-700">
            Connect with creators and share market insights
          </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-yellow-300 border-4 border-black rotate-12 opacity-50" />
        <div className="absolute bottom-32 right-20 w-24 h-24 bg-white border-4 border-black -rotate-12 opacity-50" />
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block">
                <img src="3-Photoroom.png" alt="manymarkets logo" className='h-12 w-auto' />
            </div>
            <h1 className="text-4xl font-black mb-2">
              {isLogin ? 'Welcome Back!' : 'Join UVZ'}
            </h1>
            <p className="text-lg font-medium text-gray-600">
              {isLogin ? 'Sign in to continue your journey' : 'Start finding your Unique Value Zone'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-100 border-4 border-black"
            >
              <p className="font-bold text-sm">{error}</p>
            </motion.div>
          )}

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={loading}
              className="w-full bg-white border-4 border-black p-4 font-bold flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-brutal transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>
            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={loading}
              className="w-full bg-white border-4 border-black p-4 font-bold flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-brutal transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-black" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 font-bold text-gray-600">OR</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label className="block font-bold mb-2 text-sm uppercase">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-uvz-orange/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold mb-2 text-sm uppercase">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-uvz-orange/20 font-medium"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end">
                <Link href="/reset-password" className="text-sm font-bold hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-uvz-orange text-white border-4 border-black p-4 font-bold flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-brutal transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm font-bold hover:underline"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Terms */}
          <p className="mt-8 text-xs text-center text-gray-600 font-medium">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline font-bold">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline font-bold">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
