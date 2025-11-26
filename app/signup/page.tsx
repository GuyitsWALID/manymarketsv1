'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      alert('Check your email for the confirmation link!');
      router.push('/login');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <svg width="50" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M170.5 216L212.5 296L170.5 376H128L170.5 296L128 216H170.5Z" fill="black"/>
              <path d="M341.5 216L299.5 296L341.5 376H384L341.5 296L384 216H341.5Z" fill="#f97316"/>
              <path d="M256 296L298 216H255L213 296L255 376H298L256 296Z" fill="black"/>
            </svg>
          </Link>
          <h1 className="text-4xl font-black mb-2">Get Started</h1>
          <p className="text-lg text-gray-600">Create your account to discover your UVZ</p>
        </div>

        <div className="bg-white border-4 border-black p-8 shadow-brutal">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border-2 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor="email" className="block font-bold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:border-uvz-orange"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block font-bold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border-2 border-black focus:outline-none focus:border-uvz-orange"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-uvz-orange text-white font-bold py-3 border-4 border-black shadow-brutal hover:-translate-y-1 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-uvz-orange font-bold hover:underline">
                Log In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
