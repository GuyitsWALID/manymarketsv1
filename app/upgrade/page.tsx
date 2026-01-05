'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Crown, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  Zap, 
  Users, 
  BarChart3, 
  Package, 
  Rocket,
  Loader2,
  Star,
  Gift,
  Infinity,
  MessageCircle
} from 'lucide-react';
import WhopCheckoutEmbed from '@/components/billing/WhopCheckoutEmbed';
import { ENABLE_PRICING } from '@/lib/config';

const PRO_FEATURES = [
  {
    icon: Package,
    title: 'Product Builder Studio',
    description: 'Turn your research into fully-formed digital products with our guided builder'
  },
  {
    icon: Users,
    title: 'Marketplace Listing',
    description: 'List and sell your products to our community of entrepreneurs'
  },
  {
    icon: Sparkles,
    title: 'Unlimited AI Sessions',
    description: 'No limits on research sessions - explore as many niches as you want'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track your product performance and marketplace insights'
  },
  {
    icon: Rocket,
    title: 'Priority Support',
    description: 'Get help from our team when you need it most'
  },
  {
    icon: Zap,
    title: 'Early Access Features',
    description: 'Be the first to try new tools and capabilities'
  }
];

export default function UpgradePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [checkingPlan, setCheckingPlan] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('lifetime');

  useEffect(() => {
    checkCurrentPlan();
  }, []);

  const checkCurrentPlan = async () => {
    try {
      const response = await fetch('/api/billing');
      if (response.ok) {
        const data = await response.json();
        setCurrentPlan(data.currentPlan || 'free');
        // If already Pro, redirect to builder
        if (data.currentPlan === 'pro' || data.currentPlan === 'enterprise') {
          router.push('/builder');
        }
      }
    } catch (error) {
      console.error('Error checking plan:', error);
    } finally {
      setCheckingPlan(false);
    }
  };

  if (checkingPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-uvz-orange" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-pink-50">
      {/* Header */}
      <header className="border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link 
            href="/chat" 
            className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Research
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
            <span className="text-gray-500">Current Plan:</span>
            <span className="font-bold capitalize">{currentPlan}</span>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          
          {/* Left Side - Pro Plan Description */}
          <div>
            {/* Hero */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-uvz-orange to-pink-500 text-white font-bold rounded-full mb-4">
                <Crown className="w-5 h-5" />
                Upgrade to Pro
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4">
                Turn Your Research Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-uvz-orange to-pink-500">
                  Revenue
                </span>
              </h1>
              <p className="text-lg text-gray-600">
                Unlock the Product Builder and Marketplace to transform your research insights into real digital products you can sell.
              </p>
            </div>

            {/* Pricing Toggle */}
            <div className="bg-white border-4 border-black rounded-2xl shadow-brutal p-6 mb-8">
              {/* Plan Selector */}
              <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                  onClick={() => setSelectedPlan('monthly')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all ${
                    selectedPlan === 'monthly'
                      ? 'bg-white border-2 border-black shadow-md'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setSelectedPlan('lifetime')}
                  className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all relative ${
                    selectedPlan === 'lifetime'
                      ? 'bg-gradient-to-r from-uvz-orange to-pink-500 text-white border-2 border-black shadow-md'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                    BEST VALUE
                  </span>
                  Lifetime
                </button>
              </div>

              {/* Selected Plan Details */}
              {selectedPlan === 'monthly' ? (
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-5 h-5 text-uvz-orange" />
                      <span className="font-bold text-sm uppercase tracking-wide text-gray-600">Pro Monthly</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-500 line-through">$10</span>
                      <span className="text-4xl font-black">$8</span>
                      <span className="text-gray-500 font-bold">/month</span>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>✓ Cancel anytime</p>
                    <p>✓ No hidden fees</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Gift className="w-5 h-5 text-uvz-orange" />
                      <span className="font-bold text-sm uppercase tracking-wide text-gray-600">Lifetime Deal</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-red-500 line-through">$97</span>
                      <span className="text-4xl font-black">$49</span>
                      <span className="text-gray-500 font-bold">one-time</span>
                    </div>
                    <p className="text-sm text-green-600 font-bold mt-1">🎉 Save $48 - Pay once, own forever!</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>✓ Never pay again</p>
                    <p>✓ All future updates</p>
                  </div>
                </div>
              )}
            </div>

            {/* Features List */}
            <div className="space-y-4 mb-8">
              <h3 className="font-black text-lg">Everything you need to succeed:</h3>
              {PRO_FEATURES.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start gap-3 bg-white border-2 border-black rounded-xl p-4 hover:shadow-brutal transition-all">
                    <div className="w-10 h-10 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-lg flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                );
              })}

              {/* Extra Lifetime Perks */}
              {selectedPlan === 'lifetime' && (
                <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300">
                  <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                    <Gift className="w-5 h-5 text-uvz-orange" />
                    Exclusive Lifetime Bonuses:
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl">
                      <Infinity className="w-6 h-6 text-uvz-orange" />
                      <div>
                        <span className="font-bold">Lifetime Updates</span>
                        <p className="text-sm text-gray-600">Get all future features and improvements forever</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl">
                      <Crown className="w-6 h-6 text-uvz-orange" />
                      <div>
                        <span className="font-bold">Founding Member Badge</span>
                        <p className="text-sm text-gray-600">Exclusive badge on your profile and marketplace listings</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-pink-50 border-2 border-orange-200 rounded-xl">
                      <MessageCircle className="w-6 h-6 text-uvz-orange" />
                      <div>
                        <span className="font-bold">1-on-1 Onboarding Call</span>
                        <p className="text-sm text-gray-600">30-minute strategy session to maximize your success</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FAQ Section */}
            <div>
              <h3 className="font-black text-lg mb-4">Frequently Asked Questions</h3>
              <div className="space-y-3">
                <details className="bg-white border-2 border-black rounded-xl p-4 group">
                  <summary className="font-bold cursor-pointer list-none flex items-center justify-between text-sm">
                    What&apos;s the difference between Monthly and Lifetime?
                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-gray-600 text-sm">
                    Monthly is $8/month with all Pro features. Lifetime is a one-time $49 payment that gives you permanent access plus exclusive bonuses like founding member badge, 1-on-1 onboarding, and all future updates forever.
                  </p>
                </details>
                <details className="bg-white border-2 border-black rounded-xl p-4 group">
                  <summary className="font-bold cursor-pointer list-none flex items-center justify-between text-sm">
                    Can I cancel anytime?
                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-gray-600 text-sm">
                    Yes! Monthly subscribers can cancel anytime. You&apos;ll continue to have access until the end of your billing period. Lifetime members never need to worry about this—you own it forever.
                  </p>
                </details>
                <details className="bg-white border-2 border-black rounded-xl p-4 group">
                  <summary className="font-bold cursor-pointer list-none flex items-center justify-between text-sm">
                    What happens to my products if I downgrade?
                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-gray-600 text-sm">
                    Your products will remain in your account, but you won&apos;t be able to edit them or list new ones on the marketplace until you upgrade again.
                  </p>
                </details>
                <details className="bg-white border-2 border-black rounded-xl p-4 group">
                  <summary className="font-bold cursor-pointer list-none flex items-center justify-between text-sm">
                    Is there a free trial?
                    <span className="transform group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-gray-600 text-sm">
                    We offer a free tier with 2 research sessions so you can try the platform. When you&apos;re ready to build products, upgrade to Pro!
                  </p>
                </details>
              </div>
            </div>
          </div>

          {/* Right Side - Whop Checkout */}
          <div className="lg:sticky lg:top-8">
            <div className="bg-white border-4 border-black rounded-2xl shadow-brutal overflow-hidden">
              {/* Checkout Header */}
              <div className={`p-4 text-white text-center ${
                selectedPlan === 'lifetime' 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-uvz-orange to-pink-500'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  {selectedPlan === 'lifetime' ? (
                    <>
                      <Gift className="w-5 h-5" />
                      <span className="font-bold">Get Lifetime Access</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-5 h-5" />
                      <span className="font-bold">Complete Your Upgrade</span>
                    </>
                  )}
                </div>
                {selectedPlan === 'lifetime' && (
                  <p className="text-sm opacity-90 mt-1">One-time payment • Forever access</p>
                )}
              </div>

              {/* Checkout Content */}
              <div className="p-6">
                {ENABLE_PRICING ? (
                  <>
                    <WhopCheckoutEmbed
                      planId={selectedPlan === 'lifetime' 
                        ? (process.env.NEXT_PUBLIC_WHOP_LIFETIME_PLAN_ID || process.env.NEXT_PUBLIC_WHOP_PRO_PLAN_ID || '')
                        : (process.env.NEXT_PUBLIC_WHOP_PRO_PLAN_ID || '')
                      }
                      theme="light"
                      onComplete={(planId, receiptId) => {
                        console.log('Checkout complete:', planId, receiptId);
                        router.push('/upgrade/complete?status=success&receipt_id=' + receiptId);
                      }}
                      className="w-full min-h-[400px]"
                    />
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-center text-xs text-gray-500">
                        🔒 Secure checkout powered by Whop
                      </p>
                      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
                        <span>💳 All major cards</span>
                        <span>🌍 Global payments</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="font-bold text-lg mb-2">Billing Temporarily Disabled</div>
                    <p className="text-sm text-gray-500">ManyMarkets is currently free for all users. Paid plans and checkout are disabled for now.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-2">Trusted by 1,000+ creators</p>
              <div className="flex items-center justify-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
                <span className="text-sm font-bold ml-1">4.9/5</span>
              </div>
            </div>

            {/* Money Back Guarantee */}
            {selectedPlan === 'lifetime' && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl text-center">
                <p className="font-bold text-green-800">💚 30-Day Money Back Guarantee</p>
                <p className="text-sm text-green-600">Not satisfied? Get a full refund, no questions asked.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
