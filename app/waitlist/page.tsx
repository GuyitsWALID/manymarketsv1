'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Rocket, 
  Crown, 
  Gift, 
  Check, 
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Star,
  Heart,
  Globe,
  ChevronDown,
  Loader2,
  PartyPopper,
  BadgePercent
  , Twitter, Linkedin, Facebook, Mail, Copy, Share2
} from 'lucide-react';

// Popular countries for the dropdown
const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas',
    'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize',
    'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil',
    'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China',
    'Colombia', 'Comoros', 'Congo (Democratic Republic)', 'Congo (Republic)',
    'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
    'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
    'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
    'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia',
    'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania',
    'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
    'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
    'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
    'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
    'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
    'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
    'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia',
    'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan',
    'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga',
    'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
    'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay',
    'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
    'Zambia', 'Zimbabwe', 'Other'
];

const BENEFITS = [
  {
    icon: Crown,
    title: 'Lifetime Access',
    description: 'Get lifetime Pro access at 50% off the regular price',
    highlight: true,
  },
  {
    icon: Rocket,
    title: 'Early Access',
    description: 'Be the first to try new features before anyone else',
  },
  {
    icon: Gift,
    title: 'Founding Member Badge',
    description: 'Exclusive badge showing you believed in us from day one',
  },
  {
    icon: Users,
    title: 'Priority Support',
    description: 'Direct access to our team for help and feedback',
  },
  {
    icon: TrendingUp,
    title: 'Shape the Product',
    description: 'Your feedback directly influences our roadmap',
  },
  {
    icon: Zap,
    title: 'Bonus Resources',
    description: 'Exclusive guides, templates, and training materials',
  },
];

// Workflow steps - the unique ManyMarkets journey
const WORKFLOW_STEPS = [
  {
    step: 1,
    title: 'Pick an Industry',
    description: 'Start with a broad industry you\'re interested in or have expertise in',
    icon: '🎯',
  },
  {
    step: 2,
    title: 'Find Underserved Niches',
    description: 'AI analyzes the market to discover niches with unmet demand',
    icon: '🔍',
  },
  {
    step: 3,
    title: 'Drill to Your UVZ',
    description: 'Pinpoint your Unique Value Zone — where your skills meet market gaps',
    icon: '💎',
  },
  {
    step: 4,
    title: 'Generate Product Ideas',
    description: 'Get AI-powered product concepts tailored to your UVZ',
    icon: '💡',
  },
  {
    step: 5,
    title: 'Build Your Product',
    description: 'Use our Product Builder to create ebooks, courses, templates & more',
    icon: '🏗️',
  },
];

export default function WaitlistPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [totalSignups, setTotalSignups] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Fetch total signups
    fetch('/api/waitlist')
      .then(res => res.json())
      .then(data => {
        if (data.totalSignups) {
          setTotalSignups(data.totalSignups);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          country: formData.country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSuccess(true);
      setPosition(data.position);
      
      // Trigger confetti
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then((confetti) => {
          confetti.default({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#FF6B35', '#F7C59F', '#2EC4B6', '#E71D36', '#011627'],
          });
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-pink-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-pink-200 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b-2 border-black bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-row sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <img src="/2-Photoroom.png" alt="manymarketrs logo" className="h-10 w-auto mb-2 sm:mb-0" />
          {/* Mobile count badge (visible on xs) - replaces 'Be first!' text with actual number */}
          <div aria-label={totalSignups > 0 ? `${totalSignups} creators joined` : 'No signups yet'} className="flex sm:hidden items-center gap-2 px-3 py-1 bg-gradient-to-r from-orange-100 to-pink-100 border-2 border-black rounded-full justify-center min-w-0" title={totalSignups > 0 ? `${totalSignups} creators joined` : 'No signups yet'}>
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold text-sm">{totalSignups > 0 ? `${totalSignups}+` : '0'}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 border-2 border-black rounded-full w-full sm:w-auto justify-center min-w-0">
            <Users className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold text-sm truncate">{totalSignups > 0 ? `${totalSignups}+ joined` : 'Be first!'}</span>
          </div>
         </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-500 rounded-full mb-6">
                <BadgePercent className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700">Early Bird Special: 50% OFF Lifetime Access</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
                From Industry
                <span className="block bg-gradient-to-r from-uvz-orange via-pink-500 to-purple-600 bg-clip-text text-transparent">
                  to Monetizable
                </span>
                <span className="block">Digital Product</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                ManyMarkets guides you from picking an industry → finding underserved niches → 
                drilling to your Unique Value Zone → building real digital products with AI.
              </p>

              {/* Simple counter */}
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full w-full max-w-xs mx-auto sm:mx-0 min-w-0">
                  <Users className="w-5 h-5 text-uvz-orange flex-shrink-0" />
                  <span className="font-bold truncate">{totalSignups > 0 ? `${totalSignups}+ creators` : 'Be the first'} on the waitlist</span>
                </div>
              </div>

              {/* Mobile CTA for scroll */}
              <div className="lg:hidden">
                <button 
                  onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className="w-full py-4 px-6 bg-gradient-to-r from-uvz-orange to-pink-500 text-white font-bold text-lg rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-lg transition-all flex items-center justify-center gap-2"
                >
                  Join the Waitlist
                  <ChevronDown className="w-5 h-5 animate-bounce" />
                </button>
              </div>
            </div>

            {/* Right - Form */}
            <div id="signup-form" className="lg:pl-8">
              {isSuccess ? (
                /* Success State */
                <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-brutal text-center">
                  <div className="text-6xl mb-4 animate-bounce">
                    <PartyPopper className="w-20 h-20 mx-auto text-uvz-orange" />
                  </div>
                  <h2 className="text-3xl font-black mb-2 bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                    You&apos;re In! 🎉
                  </h2>
                  {position && (
                    <p className="text-lg text-gray-600 mb-4">
                      You&apos;re <span className="font-black text-uvz-orange">#{position}</span> on the waitlist
                    </p>
                  )}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                    <p className="font-bold text-green-700 mb-2">🎁 Your Early Bird Benefits:</p>
                    <ul className="text-sm text-green-600 space-y-1 text-left">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Lifetime Pro access at 50% off
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Founding member badge
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4" /> Priority access when we launch
                      </li>
                    </ul>
                  </div>
                  <p className="text-gray-500 text-sm">
                    We&apos;ll email you when it&apos;s your turn!
                  </p>
                  <div className="mt-6 grid grid-cols-2 sm:flex sm:flex-wrap gap-3 justify-center">
                    {/* Twitter / X */}
                    <button
                      onClick={() => {
                        const text = `I joined the ManyMarkets waitlist! Discover profitable niches & build digital products with AI. Join me: ${window.location.origin}/waitlist`;
                        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      aria-label="Share on X"
                      className="flex items-center gap-2 px-3 py-2 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      Share on X
                    </button>

                    {/* LinkedIn */}
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/waitlist`;
                        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                      }}
                      aria-label="Share on LinkedIn"
                      className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      Share on LinkedIn
                    </button>

                    {/* Facebook */}
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/waitlist`;
                        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                      }}
                      aria-label="Share on Facebook"
                      className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      Share on Facebook
                    </button>

                    {/* WhatsApp */}
                    <button
                      onClick={() => {
                        const text = `I joined the ManyMarkets waitlist — find profitable niches & build digital products: ${window.location.origin}/waitlist`;
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      aria-label="Share on WhatsApp"
                      className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share on WhatsApp
                    </button>

                    {/* Telegram */}
                    <button
                      onClick={() => {
                        const text = `I joined the ManyMarkets waitlist! Find profitable niches & build digital products: ${window.location.origin}/waitlist`;
                        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/waitlist')}&text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      aria-label="Share on Telegram"
                      className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Share on Telegram
                    </button>

                    {/* Email */}
                    <button
                      onClick={() => {
                        const subject = 'Join me on the ManyMarkets waitlist';
                        const body = `I joined the ManyMarkets waitlist! Discover profitable niches & build digital products: ${window.location.origin}/waitlist`;
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                      }}
                      aria-label="Share via Email"
                      className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>

                    {/* Copy link */}
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(`${window.location.origin}/waitlist`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        } catch (e) {
                          // ignore
                        }
                      }}
                      aria-label="Copy waitlist link"
                      className="flex items-center gap-2 px-3 py-2 bg-white text-black rounded-xl font-bold border-2 border-black hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Copied!' : 'Copy link'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit} className="bg-white border-4 border-black rounded-3xl p-4 sm:p-8 shadow-brutal w-full max-w-md mx-auto lg:mx-0">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 rounded-full text-sm font-bold text-orange-700 mb-4">
                      <Gift className="w-4 h-4" />
                      Limited Early Bird Spots
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black">
                      Join the Waitlist
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Be first to access ManyMarkets + get 50% off forever
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Your Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                        className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange focus:border-uvz-orange transition-all"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-bold mb-2">Email Address</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                        className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange focus:border-uvz-orange transition-all"
                      />
                    </div>

                    {/* Country */}
                    <div>
                      <label className="block text-sm font-bold mb-2">
                        <Globe className="w-4 h-4 inline mr-1" />
                        Country
                      </label>
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                        className="w-full px-4 py-3 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-uvz-orange focus:border-uvz-orange transition-all bg-white"
                      >
                        <option value="">Select your country</option>
                        {COUNTRIES.map((country) => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="p-3 bg-red-50 border-2 border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 px-6 bg-gradient-to-r from-uvz-orange to-pink-500 text-white font-bold text-lg rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        <>
                          Get Early Access
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Trust indicators */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Check className="w-4 h-4 text-green-500" />
                        No spam, ever
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        Unsubscribe anytime
                      </span>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="bg-white border-y-4 border-black py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Early Bird <span className="text-uvz-orange">Benefits</span> 🐦
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Join now and lock in exclusive perks that won&apos;t be available after launch
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {BENEFITS.map((benefit, index) => (
                <div 
                  key={index}
                  className={`p-6 rounded-2xl border-2 border-black transition-all hover:-translate-y-1 hover:shadow-brutal ${
                    benefit.highlight 
                      ? 'bg-gradient-to-br from-orange-100 to-pink-100 shadow-brutal' 
                      : 'bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center mb-4 ${
                    benefit.highlight ? 'bg-uvz-orange text-white' : 'bg-gray-100'
                  }`}>
                    <benefit.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                  {benefit.highlight && (
                    <div className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                      <Check className="w-4 h-4" />
                      Save $99+
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
                Powered by <span className="text-uvz-orange">AI</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-black rounded-2xl flex items-center justify-center text-4xl">
                  💎
                </div>
                <h3 className="font-black text-xl mb-2">UVZ Discovery</h3>
                <p className="text-gray-600">
                  Find your Unique Value Zone where your skills meet underserved market demand
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-black rounded-2xl flex items-center justify-center text-4xl">
                  🏗️
                </div>
                <h3 className="font-black text-xl mb-2">Product Builder</h3>
                <p className="text-gray-600">
                  Create ebooks, courses, templates & more with our guided AI builder
                </p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-100 to-green-200 border-2 border-black rounded-2xl flex items-center justify-center text-4xl">
                  📊
                </div>
                <h3 className="font-black text-xl mb-2">Idea Scorer</h3>
                <p className="text-gray-600">
                  Validate your product ideas with AI-powered scoring before you build
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The Workflow Section */}
        <section className="bg-gradient-to-br from-gray-900 to-black text-white py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-4">
            The <span className="text-uvz-orange">ManyMarkets</span> Workflow
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A proven path from broad industry to monetizable digital product
              </p>
            </div>

            <div className="relative">
              {/* Connection line */}
              <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-uvz-orange via-pink-500 to-purple-600 -translate-y-1/2 z-0" />
              <div className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 pb-4 md:pb-0">
                  {WORKFLOW_STEPS.map((step) => (
                    <div 
                      key={step.step}
                      className="bg-black border border-white/20 rounded-2xl p-4 md:p-6 w-full text-center hover:bg-gray-900 transition-colors"
                    >
                      <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-xl flex items-center justify-center text-2xl border-2 border-white/30">
                        {step.icon}
                      </div>
                      <div className="text-xs text-uvz-orange font-bold mb-1">Step {step.step}</div>
                      <h3 className="font-bold text-sm mb-2">{step.title}</h3>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Ready to Find Your UVZ? 💎
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join the waitlist and get lifetime access at 50% off when we launch
            </p>
            <button
              onClick={() => document.getElementById('signup-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 py-4 px-8 bg-gradient-to-r from-uvz-orange to-pink-500 text-white font-bold text-lg rounded-xl border-2 border-black shadow-brutal hover:shadow-brutal-lg hover:-translate-y-1 transition-all"
            >
              Join the Waitlist
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-black bg-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start w-full sm:w-auto mb-2 sm:mb-0">
            <img src="2-Photoroom.png" alt="manymarkets footer logo" className="h-10 w-auto" />
          </div>
          <p className="text-sm text-gray-500 w-full sm:w-auto mb-2 sm:mb-0">
            © {new Date().getFullYear()} ManyMarkets. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm w-full sm:w-auto justify-center sm:justify-end">
            <Link href="/" className="text-gray-500 hover:text-black transition-colors">
              Home
            </Link>
            <Link href="/login" className="text-gray-500 hover:text-black transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
