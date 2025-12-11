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
  Star
} from 'lucide-react';
  import PaddleCheckoutButton from '@/components/billing/PaddleCheckoutButton';

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

  // NOTE: We keep the transactional checkout button via `PaddleCheckoutButton`.

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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-uvz-orange to-pink-500 text-white font-bold rounded-full mb-6">
            <Crown className="w-5 h-5" />
            Upgrade to Pro
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Turn Your Research Into{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-uvz-orange to-pink-500">
              Revenue
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the Product Builder and Marketplace to transform your research insights into real digital products you can sell.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-12">
          <div className="bg-white border-4 border-black rounded-2xl shadow-brutal overflow-hidden">
            {/* Card Header */}
            <div className="p-6 bg-gradient-to-r from-uvz-orange to-pink-500 text-white text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wide">Most Popular</span>
                <Star className="w-5 h-5" />
              </div>
              <h2 className="text-3xl font-black">Pro Plan</h2>
            </div>

            {/* Pricing */}
            <div className="p-6 text-center border-b-2 border-gray-100">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-black">$29</span>
                <span className="text-gray-500 font-bold">/month</span>
              </div>
              <p className="text-gray-500 mt-2">Cancel anytime • No hidden fees</p>
            </div>

            {/* Features List */}
            <div className="p-6 space-y-4">
              {PRO_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="p-6 bg-gray-50">
              <PaddleCheckoutButton
                  productId={process.env.NEXT_PUBLIC_PADDLE_PRO_PRODUCT_ID || 'pro'}
                  className="w-full py-4 bg-uvz-orange text-white font-black text-lg border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <>
                    <Crown className="w-5 h-5" />
                    Upgrade to Pro Now
                  </>
                </PaddleCheckoutButton>
              <p className="text-center text-sm text-gray-500 mt-3">
                Secure checkout powered by Paddle
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {PRO_FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="bg-white border-2 border-black rounded-xl p-6 hover:shadow-brutal transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-black text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-black text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <details className="bg-white border-2 border-black rounded-xl p-4 group">
              <summary className="font-bold cursor-pointer list-none flex items-center justify-between">
                Can I cancel anytime?
                <span className="transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                Yes! You can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </details>
            <details className="bg-white border-2 border-black rounded-xl p-4 group">
              <summary className="font-bold cursor-pointer list-none flex items-center justify-between">
                What happens to my products if I downgrade?
                <span className="transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                Your products will remain in your account, but you won&apos;t be able to edit them or list new ones on the marketplace until you upgrade again.
              </p>
            </details>
            <details className="bg-white border-2 border-black rounded-xl p-4 group">
              <summary className="font-bold cursor-pointer list-none flex items-center justify-between">
                Is there a free trial?
                <span className="transform group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-gray-600">
                We offer a free tier with limited research sessions so you can try the platform. When you&apos;re ready to build products, upgrade to Pro!
              </p>
            </details>
          </div>
        </div>
      </main>
    </div>
  );
}
