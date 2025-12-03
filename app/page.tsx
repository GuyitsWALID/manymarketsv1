'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { Sparkles, TrendingUp, Rocket, Zap, Users, DollarSign, Check, Twitter, Linkedin, Github, Mail, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const HandDrawnCircle = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <RoughNotation type="circle" show={true} color="#f97316" strokeWidth={3} animationDelay={delay} animationDuration={1000}>
    {children}
  </RoughNotation>
);

const HandDrawnUnderline = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <RoughNotation type="underline" show={true} color="#1e3a8a" strokeWidth={4} animationDelay={delay} animationDuration={800}>
    {children}
  </RoughNotation>
);
const HandDrawnBox = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
  <RoughNotation type="box" show={true} color="#f97316" strokeWidth={2} animationDelay={delay} animationDuration={1000}>
    {children}
  </RoughNotation>
);

export default function Home() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Check if user is logged in and redirect to chat
  useEffect(() => {
    async function checkAuth() {
      try {
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 3000)
        );
        
        // First check session from local storage (faster)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          router.push('/chat');
          return;
        }
        
        // If no session, try getUser with timeout as fallback
        const authPromise = supabase.auth.getUser().then(r => r.data?.user);
        const user = await Promise.race([authPromise, timeoutPromise]);
        
        if (user) {
          router.push('/chat');
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router, supabase.auth]);
  
  // Accessibility: keep the accessible label updated for the menu toggle
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkbox = document.getElementById('menu-toggle') as HTMLInputElement | null;
    const label = document.querySelector('label[for="menu-toggle"]') as HTMLLabelElement | null;
    if (!checkbox || !label) return;

    function updateAria() {
      // checkbox and label are non-null because we returned earlier if they were falsy
      label!.setAttribute('aria-label', checkbox!.checked ? 'Close menu' : 'Open menu');
    }

    updateAria();
    function onChange() {
      updateAria();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && checkbox!.checked) {
        checkbox!.checked = false;
        updateAria();
      }
    }

    checkbox.addEventListener('change', onChange);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      checkbox.removeEventListener('change', onChange);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // If the OAuth provider redirects back to the app root with a `code` query param (e.g. /?code=...),
  // forward the request to our auth callback route so we can exchange the code for a session.
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code && !window.location.pathname.startsWith('/auth/callback')) {
        window.location.replace(`/auth/callback${window.location.search}`);
      }
    } catch (err) {
      // swallow — nothing to do here
    }
  }, []);

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const features = [
    { 
      icon: Sparkles, 
      title: "AI-Powered Discovery", 
      desc: "Our intelligent chatbot analyzes thousands of market data points to find your Unique Value Zone—a validated, low-competition, high-demand niche that matches your skills.",
      detail: "Get 3-5 validated niche ideas in minutes, not months."
    },
    { 
      icon: Rocket, 
      title: "All-in-One Creation Studio", 
      desc: "Build professional digital products with our integrated suite. Create ebooks, online courses, templates, and more—all without leaving the platform.",
      detail: "No need for expensive tools or technical expertise."
    },
    { 
      icon: TrendingUp, 
      title: "Instant Marketplace Launch", 
      desc: "Sell your products immediately in our built-in marketplace. Automatic payment processing, delivery, and revenue tracking—we handle everything.",
      detail: "Start earning from day one with zero setup friction."
    }
  ];

  const stats = [
    { number: "10K+", label: "Products Created", icon: Sparkles },
    { number: "$2M+", label: "Creator Earnings", icon: DollarSign },
    { number: "5K+", label: "Active Creators", icon: Users },
    { number: "95%", label: "Success Rate", icon: TrendingUp }
  ];

  const pricingPlans = [
    {
      name: "FREE",
      price: "$0",
      period: "forever",
      description: "Perfect for exploring and validating your first niche idea",
      features: [
        "1 AI Research Session",
        "Basic Market Insights",
        "Niche Comparison Tools",
        "Community Access",
        "UVZ Report (Limited)"
      ],
      cta: "Start Free",
      popular: false
    },
    {
      name: "PRO",
      price: "$29",
      period: "per month",
      description: "Everything you need to build and launch profitable digital products",
      features: [
        "Unlimited AI Research Sessions",
        "Full Builder Studio Access",
        "Advanced Market Analytics",
        "Unlimited Products",
        "Marketplace Listing",
        "85% Revenue (15% platform fee)",
        "Priority Support",
        "Marketing Asset Generator",
        "Analytics Dashboard"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "ENTERPRISE",
      price: "Custom",
      period: "contact us",
      description: "For agencies, consultants, and teams scaling digital product businesses",
      features: [
        "Everything in Pro",
        "White-Label Options",
        "API Access",
        "Custom Integrations",
        "90% Revenue (10% platform fee)",
        "Dedicated Account Manager",
        "Custom Training",
        "Advanced Analytics",
        "Multi-user Teams"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const process = [
    {
      step: "01",
      title: "Discover Your Niche",
      description: "Chat with our AI to identify profitable market opportunities aligned with your skills and passions. Get validated niche ideas backed by real data."
    },
    {
      step: "02",
      title: "Build Your Product",
      description: "Use our integrated creation studio to build professional digital products. Templates, AI writing assistance, and design tools—all in one place."
    },
    {
      step: "03",
      title: "Launch & Earn",
      description: "Publish to our marketplace instantly. We handle payments, delivery, and customer management. You focus on creating and earning."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-black font-sans overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-sm ">
        <div className="flex items-center justify-between container mx-auto px-4 sm:px-6 py-3">
          <img src="/3-Photoroom.png" alt="ManyMarkets Logo" className="h-8 sm:h-10 md:h-14 w-auto" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 font-bold text-base">
        <Link href="#features" className="hover:underline decoration-4 decoration-uvz-orange">Features</Link>
        <Link href="#pricing" className="hover:underline decoration-4 decoration-uvz-orange">Pricing</Link>
        <Link href="/marketplace" className="hover:underline decoration-4 decoration-uvz-orange">Marketplace</Link>
        <Link href="/login" className="hover:underline decoration-4 decoration-uvz-orange">Login</Link>
        <Link href="/login" className="bg-uvz-orange text-black px-6 py-2 border-2 border-black hover:bg-white hover:text-black transition-all shadow-brutal active:translate-x-1 active:translate-y-1 active:shadow-none text-base">
          Get Started
        </Link>
          </nav>
          {/* Toggle hamburger -> X animation + aria update for accessibility */}
          {/* Moved mobile menu hamburger css to `app/globals.css` to avoid hydration mismatches */}

          {/* Client-only JS to keep the accessible label updated and ensure user sees "Close menu" when opened */}
          {/* Mobile Menu Toggle and Hidden Checkbox */}
        <input id="menu-toggle" type="checkbox" className="peer hidden" aria-hidden="true" />
          <div className="md:hidden flex items-center">
        <label
          htmlFor="menu-toggle"
          className="cursor-pointer p-2 border-2 border-black rounded-md bg-white shadow-brutal flex flex-col gap-1 justify-center w-10 h-10"
          aria-label="Toggle menu"
          aria-controls="mobile-menu"
        >
          <span className="block w-6 h-0.5 bg-black" />
          <span className="block w-6 h-0.5 bg-black" />
          <span className="block w-6 h-0.5 bg-black" />
        </label>
          </div>

          {/* Mobile Nav Panel (checkbox controlled) */}
          <div
        id="mobile-menu"
        className="peer-checked:block hidden absolute top-full left-0 w-full bg-white border-t-4 border-black shadow-brutal z-40"
        aria-hidden="false"
          >
        <div className="container mx-auto px-6 py-6">
          

          <nav className="flex flex-col gap-3 text-lg font-bold">
            <Link
          href="#features"
          className="block px-4 py-3 hover:underline decoration-4 decoration-uvz-orange border-l-4 border-transparent hover:border-uvz-orange transition-all"
          onClick={() => {
            const el = document.getElementById('menu-toggle') as HTMLInputElement | null;
            if (el) el.checked = false;
          }}
            >
          Features
            </Link>
            <Link
          href="#pricing"
          className="block px-4 py-3 hover:underline decoration-4 decoration-uvz-orange border-l-4 border-transparent hover:border-uvz-orange transition-all"
          onClick={() => {
            const el = document.getElementById('menu-toggle') as HTMLInputElement | null;
            if (el) el.checked = false;
          }}
            >
          Pricing
            </Link>
            <Link
          href="/marketplace"
          className="block px-4 py-3 hover:underline decoration-4 decoration-uvz-orange border-l-4 border-transparent hover:border-uvz-orange transition-all"
          onClick={() => {
            const el = document.getElementById('menu-toggle') as HTMLInputElement | null;
            if (el) el.checked = false;
          }}
            >
          Marketplace
            </Link>
            <Link
          href="/login"
          className="block px-4 py-3 hover:underline decoration-4 decoration-uvz-orange border-l-4 border-transparent hover:border-uvz-orange transition-all"
          onClick={() => {
            const el = document.getElementById('menu-toggle') as HTMLInputElement | null;
            if (el) el.checked = false;
          }}
            >
          Login
            </Link>

            <Link
          href="/login"
          className="block mt-2 px-4 py-3 bg-uvz-orange text-black border-2 border-black text-center font-bold shadow-brutal"
          onClick={() => {
            const el = document.getElementById('menu-toggle') as HTMLInputElement | null;
            if (el) el.checked = false;
          }}
            >
          Get Started
            </Link>
          </nav>
        </div>
          </div>
        </div>
      </header>
        
        

      <main>
        {/* Hero Section */}
        <section className="container mt-20 sm:mt-24 md:mt-28 mx-auto px-4 sm:px-6 py-8 md:py-32">
            <div className="max-w-5xl mx-auto text-center space-y-4 relative">
            {/* Floating hand-drawn icons - Top side */}
            <motion.div
              initial={{ opacity: 0, y: -50, rotate: 10 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="absolute left-1/2 -translate-x-1/2 -top-16 hidden lg:flex gap-18 items-center"
            >
              <RoughNotation type="box" show={true} color="#f97316" strokeWidth={3} animationDelay={0}>
              <Sparkles className="w-12 h-12 text-black" />
              </RoughNotation>

              <RoughNotation type="highlight" show={true} color="#fef08a" strokeWidth={2} animationDelay={0}>
              <TrendingUp className="w-10 h-10 text-uvz-orange" />
              </RoughNotation>
            </motion.div>

            {/* Floating hand-drawn icons - Left side */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -15 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute -left-20 top-10 hidden lg:block"
            >
              <RoughNotation type="circle" show={true} color="#f97316" strokeWidth={3} animationDelay={0}>
            <Sparkles className="w-12 h-12 text-uvz-orange" />
              </RoughNotation>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50, rotate: 15 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="absolute -left-16 top-40 hidden lg:block"
            >
              <RoughNotation type="box" show={true} color="#000000" strokeWidth={2} animationDelay={0}>
          <Rocket className="w-10 h-10 text-black" />
              </RoughNotation>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 0.9, duration: 0.8 }}
              className="absolute -left-12 bottom-20 hidden lg:block"
            >
              <RoughNotation type="highlight" show={true} color="#fef08a" strokeWidth={2} animationDelay={0}>
          <TrendingUp className="w-10 h-10 text-uvz-orange" />
              </RoughNotation>
            </motion.div>

            {/* Floating hand-drawn icons - Right side */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 15 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="absolute -right-20 top-20 hidden lg:block"
            >
              <RoughNotation type="box" show={true} color="#f97316" strokeWidth={3} animationDelay={0}>
          <Zap className="w-12 h-12 text-black" />
              </RoughNotation>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotate: -15 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="absolute -right-16 top-52 hidden lg:block"
            >
              <RoughNotation type="circle" show={true} color="#000000" strokeWidth={2} animationDelay={0}>
          <DollarSign className="w-10 h-10 text-uvz-orange" />
              </RoughNotation>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 10 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute -right-12 bottom-32 hidden lg:block"
            >
              <RoughNotation type="underline" show={true} color="#f97316" strokeWidth={3} animationDelay={0}>
                <Users className="w-10 h-10 text-black" />
              </RoughNotation>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6">
          From Market Insight to{" "}
          <span className="text-uvz-orange">Marketplace Success</span>
              </h2>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium max-w-3xl mx-auto text-left sm:text-center px-2"
            >
              The only platform that guides you from <strong>"I want to build something"</strong> to <strong>"I'm making sales"</strong>—with AI doing the heavy lifting. Discover profitable niches, create digital products, and launch your marketplace business in days, not months.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 pt-6 sm:pt-8 px-2"
            >
              <Link href="/login" className="group bg-uvz-orange text-white text-base sm:text-lg md:text-xl font-bold px-6 sm:px-8 py-3 sm:py-4 border-3 sm:border-4 border-black shadow-brutal hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_#000000] transition-all inline-flex items-center justify-center gap-2">
                Start Discovery <Zap className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
              </Link>
              <Link href="/marketplace" className="group bg-white text-black text-base sm:text-lg md:text-xl font-bold px-6 sm:px-8 py-3 sm:py-4 border-3 sm:border-4 border-black shadow-brutal hover:-translate-y-2 hover:shadow-[8px_8px_0px_0px_#000000] transition-all inline-flex items-center justify-center gap-2">
                Browse Marketplace <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>

            {/* Stats Bar */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 pt-8 sm:pt-12 md:pt-16 max-w-4xl mx-auto px-2"
            >
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                  className="border-2 sm:border-3 md:border-4 border-black p-3 sm:p-4 md:p-6 bg-white shadow-brutal"
                >
                  <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mx-auto mb-1 sm:mb-2 text-uvz-orange" />
                  <div className="text-xl sm:text-2xl md:text-3xl font-black mb-1">
                    <HandDrawnCircle delay={1200 + i * 100}>{stat.number}</HandDrawnCircle>
                  </div>
                  <div className="text-sm font-bold uppercase">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-yellow-50 border-y-2 sm:border-y-4 border-black py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-center mb-8 sm:mb-12 md:mb-16 uppercase">
              <HandDrawnBox delay={100}>How It Works</HandDrawnBox>
            </h2>
            <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-12 max-w-6xl mx-auto">
              {process.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="relative"
                >
                  <div className="text-5xl sm:text-6xl md:text-8xl font-black text-uvz-orange/20 absolute -top-4 sm:-top-6 md:-top-8 -left-2 sm:-left-4 -z-10">
                    {item.step}
                  </div>
                  <div className="border-2 sm:border-3 md:border-4 border-black p-4 sm:p-6 md:p-8 bg-white shadow-brutal h-full hover:-translate-y-2 transition-transform">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-4 uppercase">
                      <HandDrawnUnderline delay={300 + i * 100}>{item.title}</HandDrawnUnderline>
                    </h3>
                    <p className="font-medium leading-relaxed">{item.description}</p>
                  </div>
                  {i < process.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-12 h-12 text-uvz-orange" strokeWidth={3} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-32">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-center mb-8 sm:mb-12 md:mb-16 uppercase">
            Everything You Need to <span className="text-uvz-orange"><HandDrawnUnderline delay={100}>Succeed</HandDrawnUnderline></span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, rotate: i % 2 === 0 ? 1 : -1 }}
                onHoverStart={() => setHoveredFeature(i)}
                onHoverEnd={() => setHoveredFeature(null)}
                className="border-2 sm:border-3 md:border-4 border-black p-4 sm:p-6 md:p-8 shadow-brutal bg-white cursor-pointer relative overflow-hidden"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                  className={`absolute top-3 right-3 sm:top-4 sm:right-4 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-2 sm:border-3 md:border-4 border-black rounded-full flex items-center justify-center ${
                    hoveredFeature === i ? "bg-uvz-orange" : "bg-yellow-300"
                  } transition-colors`}
                >
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                </motion.div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black mb-2 sm:mb-4 uppercase pr-14 sm:pr-16 md:pr-20">
                  {feature.title}
                </h3>
                <p className="font-medium mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">{feature.desc}</p>
                <div className="border-t-2 border-black pt-3 sm:pt-4 mt-3 sm:mt-4">
                  <p className="text-xs sm:text-sm font-bold text-uvz-blue">{feature.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="bg-blue-50 border-y-2 sm:border-y-4 border-black py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="container mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-center mb-4 sm:mb-6 uppercase">
              <HandDrawnBox delay={100}>Simple, Transparent Pricing</HandDrawnBox>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-center mb-8 sm:mb-12 md:mb-16 font-medium max-w-2xl mx-auto px-2">
              Start free, upgrade when you're ready. No hidden fees, no surprises. Pay only for what you use.
            </p>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`border-2 sm:border-3 md:border-4 border-black p-4 sm:p-6 md:p-8 bg-white shadow-brutal relative ${
                    plan.popular ? "sm:col-span-2 lg:col-span-1 lg:-translate-y-4 lg:scale-105" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 bg-uvz-orange text-white px-3 sm:px-6 py-1 sm:py-2 border-2 sm:border-4 border-black font-black uppercase text-xs sm:text-sm shadow-brutal">
                      Most Popular
                    </div>
                  )}
                  <div className="text-center mb-4 sm:mb-6 md:mb-8">
                    <h3 className="text-xl sm:text-2xl font-black uppercase mb-1 sm:mb-2">{plan.name}</h3>
                    <div className="text-3xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2">
                      <HandDrawnCircle delay={300 + i * 100}>{plan.price}</HandDrawnCircle>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-gray-600 uppercase">{plan.period}</div>
                  </div>
                  <p className="text-center font-medium mb-4 sm:mb-6 min-h-10 sm:min-h-12 text-sm sm:text-base">{plan.description}</p>
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 shrink-0 text-uvz-orange" strokeWidth={3} />
                        <span className="font-medium text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href="/signup" 
                    className={`block text-center font-bold px-4 sm:px-6 py-2 sm:py-3 border-2 sm:border-4 border-black shadow-brutal hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#000000] transition-all text-sm sm:text-base ${
                      plan.popular ? "bg-uvz-orange text-white" : "bg-white text-black"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8 sm:mt-12 max-w-3xl mx-auto px-2">
              <p className="text-xs sm:text-sm font-medium border-2 sm:border-4 border-black p-4 sm:p-6 bg-white shadow-brutal">
                <strong>💰 Marketplace Fees:</strong> Free users cannot sell on marketplace. Pro users pay 15% commission on sales. Enterprise users pay only 10% commission. All plans include free payment processing through Stripe.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto border-4 sm:border-6 md:border-8 border-black p-6 sm:p-10 md:p-12 lg:p-16 bg-gradient-to-br from-yellow-300 to-yellow-200 shadow-[6px_6px_0px_0px_#000000] sm:shadow-[8px_8px_0px_0px_#000000] md:shadow-[12px_12px_0px_0px_#000000] text-center"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black mb-4 sm:mb-6 uppercase leading-tight">
              Ready to Build Your <span className="text-uvz-orange">Marketplace Empire?</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl font-medium mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of creators who have discovered their profitable niche and launched successful digital product businesses with ManyMarkets.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 sm:gap-3 bg-black text-white text-lg sm:text-xl md:text-2xl font-bold px-6 sm:px-8 md:px-12 py-4 sm:py-5 md:py-6 border-2 sm:border-4 border-black hover:bg-uvz-orange hover:scale-105 transition-all shadow-brutal"
            >
              Start Free Today <Rocket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
            </Link>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm font-bold">No credit card required • 5-minute setup • Cancel anytime</p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 sm:border-t-4 border-black bg-black text-white py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 md:gap-12 mb-8 sm:mb-12">
            <div className="col-span-2 md:col-span-1">
              <h3 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 uppercase">ManyMarkets</h3>
              <p className="font-medium text-gray-300">
                AI-powered platform for discovering profitable niches and launching digital product businesses.
              </p>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-black mb-2 sm:mb-4 uppercase border-b-2 border-white pb-1 sm:pb-2">Product</h4>
              <ul className="space-y-1 sm:space-y-2 font-medium text-sm sm:text-base">
                <li><Link href="/features" className="hover:text-uvz-orange transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-uvz-orange transition-colors">Pricing</Link></li>
                <li><Link href="/marketplace" className="hover:text-uvz-orange transition-colors">Marketplace</Link></li>
                <li><Link href="/templates" className="hover:text-uvz-orange transition-colors">Templates</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-black mb-2 sm:mb-4 uppercase border-b-2 border-white pb-1 sm:pb-2">Company</h4>
              <ul className="space-y-1 sm:space-y-2 font-medium text-sm sm:text-base">
                <li><Link href="/about" className="hover:text-uvz-orange transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-uvz-orange transition-colors">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-uvz-orange transition-colors">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-uvz-orange transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-base sm:text-lg font-black mb-2 sm:mb-4 uppercase border-b-2 border-white pb-1 sm:pb-2">Legal</h4>
              <ul className="space-y-1 sm:space-y-2 font-medium text-sm sm:text-base">
                <li><Link href="/privacy" className="hover:text-uvz-orange transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-uvz-orange transition-colors">Terms of Service</Link></li>
                <li><Link href="/cookies" className="hover:text-uvz-orange transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t-2 border-white pt-6 sm:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="font-medium text-gray-300 text-sm sm:text-base text-center md:text-left">
              © 2025 ManyMarkets. All rights reserved.
            </p>
            
            <div className="flex gap-3 sm:gap-4">
              <Link 
                href="https://twitter.com/manymarkets" 
                target="_blank"
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white hover:bg-uvz-orange hover:border-uvz-orange transition-all flex items-center justify-center group"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </Link>
              <Link 
                href="https://linkedin.com/company/manymarkets" 
                target="_blank"
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white hover:bg-uvz-orange hover:border-uvz-orange transition-all flex items-center justify-center group"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </Link>
              <Link 
                href="https://github.com/manymarkets" 
                target="_blank"
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white hover:bg-uvz-orange hover:border-uvz-orange transition-all flex items-center justify-center group"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </Link>
              <Link 
                href="mailto:hello@manymarkets.com"
                className="w-10 h-10 sm:w-12 sm:h-12 border-2 border-white hover:bg-uvz-orange hover:border-uvz-orange transition-all flex items-center justify-center group"
                aria-label="Email"
              >
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
