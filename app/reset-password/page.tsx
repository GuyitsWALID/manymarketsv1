'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      
      if (error) throw error;
      setSuccess(true);
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-green-50 border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000]">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-300 border-4 border-black flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black mb-2">Check Your Email</h1>
              <p className="text-gray-700 font-medium mb-6">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <Link
                href="/login"
                className="bg-uvz-orange text-white border-4 border-black px-6 py-3 font-bold flex items-center gap-2 hover:-translate-y-1 hover:shadow-brutal transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-bold hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_#000000]">
          <h1 className="text-3xl font-black mb-2">Reset Password</h1>
          <p className="text-gray-600 font-medium mb-6">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="bg-red-50 border-4 border-red-500 p-4 mb-6">
              <p className="text-red-700 font-bold text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-12 pr-4 py-3 border-4 border-black focus:outline-none focus:ring-4 focus:ring-uvz-orange/20 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-uvz-orange text-white border-4 border-black p-4 font-bold flex items-center justify-center gap-2 hover:-translate-y-1 hover:shadow-brutal transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
