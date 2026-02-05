'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Users, 
  Flame,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Lock,
  ArrowRight,
  Lightbulb,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Zap,
  Filter,
  X,
  ExternalLink,
  Crown,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';

interface DailyIdea {
  id: string;
  name: string;
  industry: string;
  one_liner: string;
  description: string;
  target_audience: string;
  core_problem: string;
  opportunity_score: number;
  problem_score?: number;
  feasibility_score?: number;
  total_score?: number;
  scores_explanation?: any;
  demand_level: string;
  competition_level: string;
  trending_score: number;
  market_size: string;
  growth_rate: string;
  pain_points: string[];
  monetization_ideas: any[];
  product_ideas: any[];
  validation_signals: any[];
  full_research_report: any;
  sources: any[];
  featured_date: string;
}

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

interface ApiResponse {
  ideas: DailyIdea[];
  isGenerating?: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: {
    industries: string[];
  };
}

interface IdeaDetailResponse {
  idea: DailyIdea;
  isPro: boolean;
  gated: boolean;
  gatedSections: string[];
}

function DailyIdeasContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');
  const supabase = createClient();
  
  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState<boolean>(true); // Default to desktop, update after mount
  const [hasMounted, setHasMounted] = useState(false); // Track hydration complete
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Pro/Free tier state
  const [isPro, setIsPro] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  // Ideas state
  const [ideas, setIdeas] = useState<DailyIdea[]>([]);
  const [todaysIdea, setTodaysIdea] = useState<DailyIdea | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<DailyIdea | null>(null);
  // Selected product index for the currently opened idea (null = none selected)
  const [selectedProductIdx, setSelectedProductIdx] = useState<number | null>(null);
  const [gatedSections, setGatedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [productGenLoading, setProductGenLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'validation' | 'products'>('overview');

  // Handle responsive - only run after hydration to prevent mismatch
  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    // Set initial value after mount (hydration complete)
    handleResize();
    setHasMounted(true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user data
  useEffect(() => {
    async function loadUser() {
      try {
        const { data } = await supabase.auth.getUser();
        const user = data?.user ?? null;
        setCurrentUser(user);

        if (user) {
          // Load sessions for sidebar
          const response = await fetch('/api/sessions');
          if (response.ok) {
            const { sessions: userSessions } = await response.json();
            setSessions(userSessions || []);
          }
          
          // Check Pro status
          try {
            const billingRes = await fetch('/api/billing');
            if (billingRes.ok) {
              const billingData = await billingRes.json();
              setIsPro(billingData.currentPlan === 'pro' || billingData.currentPlan === 'enterprise');
            }
          } catch {
            setIsPro(false);
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
      }
    }
    loadUser();
  }, [supabase]);

  // Fetch ideas list
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout;
    
    async function fetchIdeas() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', pagination.page.toString());
        if (selectedIndustry) params.set('industry', selectedIndustry);
        
        const res = await fetch(`/api/daily-ideas?${params}`);
        const data: ApiResponse = await res.json();
        
        setIdeas(data.ideas);
        setIsGenerating(data.isGenerating || false);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        }));
        setIndustries(data.filters.industries);
        
        // Find today's idea
        const today = new Date().toISOString().split('T')[0];
        const todayIdea = data.ideas.find(idea => idea.featured_date === today);
        setTodaysIdea(todayIdea || data.ideas[0] || null);
        
        // If still generating, retry after 10 seconds
        if (data.isGenerating) {
          retryTimeout = setTimeout(fetchIdeas, 10000);
        }
      } catch (error) {
        console.error('Failed to fetch ideas:', error);
      }
      setLoading(false);
    }
    
    fetchIdeas();
    
    return () => {
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [pagination.page, selectedIndustry]);

  // Fetch selected idea detail
  useEffect(() => {
    async function fetchIdeaDetail() {
      if (!selectedId) {
        setSelectedIdea(null);
        return;
      }
      
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/daily-ideas/${selectedId}`);
        const data: IdeaDetailResponse = await res.json();
        
          setSelectedIdea(data.idea);
        // Reset any product selection when switching ideas
        setSelectedProductIdx(null);
        setIsPro(data.isPro);
        setGatedSections(data.gatedSections);
      } catch (error) {
        console.error('Failed to fetch idea detail:', error);
      }
      setDetailLoading(false);
    }
    
    fetchIdeaDetail();
  }, [selectedId]);

  const handleIdeaClick = (idea: DailyIdea) => {
    // Check if this is today's idea or user is Pro
    const today = new Date().toISOString().split('T')[0];
    const isToday = idea.featured_date === today;
    
    if (!isPro && !isToday) {
      setIsUpgradeModalOpen(true);
      return;
    }
    
    router.push(`/daily-ideas?id=${idea.id}`);
  };

  const handleCloseDetail = () => {
    router.push('/daily-ideas');
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      setIsLogoutOpen(false);
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const loadSession = useCallback(async (sessionId: string) => {
    router.push(`/chat?session=${sessionId}`);
  }, [router]);

  const createNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  // Generate additional product ideas from server-side suggestions (no placeholders)
  const generateMoreProducts = useCallback(async (count: number) => {
    if (!selectedIdea) return;
    setProductGenLoading(true);
    try {
      const res = await fetch('/api/research/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId: selectedIdea.id, count }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data?.error || 'Failed to generate suggestions';
        console.error('Generate products error:', msg);
        // Show user-friendly alert (non-blocking)
        alert(msg);
        return;
      }

      // API returns `suggestions` (server) or `products` (older format)
      const newProducts = data.suggestions || data.products || [];
      if (!newProducts || newProducts.length === 0) {
        // Notify user
        console.warn('No products returned from generation');
        alert('No product suggestions could be generated. Please try again later.');
        return;
      }

      // Merge unique by name/type
      const existing = selectedIdea.product_ideas || [];
      const merged = [...existing];
      for (const np of newProducts) {
        const exists = merged.some((p:any) => (p.id && np.id && p.id === np.id) || p.name === np.name);
        if (!exists) merged.push(np);
      }

      const updatedIdea = { ...selectedIdea, product_ideas: merged };
      setSelectedIdea(updatedIdea);
      setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
    } catch (e) {
      console.error(e);
      // Silent UI notice
    } finally {
      setProductGenLoading(false);
    }
  }, [selectedIdea, setSelectedIdea, setIdeas]);

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-500 bg-green-100';
    if (score >= 5) return 'text-yellow-500 bg-yellow-100';
    return 'text-red-500 bg-red-100';
  };

  // Format score for display - no fallback to avoid showing same scores
  const formatScore = (value?: number | null) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    const num = Math.round(Number(value) * 10) / 10;
    return num % 1 === 0 ? String(Math.round(num)) : num.toFixed(1);
  };

  // Compute total score as average of opportunity, problem, and feasibility scores
  const computeTotalScore = (idea?: DailyIdea | null) => {
    const target = idea || selectedIdea;
    if (!target) return 0;
    // If total_score is already set in the database, use it
    if (target.total_score !== null && target.total_score !== undefined) {
      return Math.round(Number(target.total_score) * 10) / 10;
    }
    // Calculate average from component scores
    const parts = [
      target.opportunity_score, 
      target.problem_score, 
      target.feasibility_score
    ].filter(v => typeof v === 'number' && !Number.isNaN(v)) as number[];
    if (parts.length > 0) {
      const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
      return Math.round(avg * 10) / 10;
    }
    // Last resort fallback
    return target.opportunity_score ?? 0;
  };

  const getDemandBadge = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-green-500',
      medium: 'bg-yellow-500',
      low: 'bg-red-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  const getCompetitionBadge = (level: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-500',
      medium: 'bg-yellow-500',
      high: 'bg-red-500',
    };
    return colors[level] || 'bg-gray-500';
  };

  // Utility clamp
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getMainMargin = () => {
    if (!isDesktop) return 0;
    if (!isSidebarOpen) return 0;
    return 288;
  };

  const today = new Date().toISOString().split('T')[0];

  const productIndexForHref = selectedProductIdx !== null ? selectedProductIdx : (selectedIdea && selectedIdea.product_ideas && selectedIdea.product_ideas.length > 0 ? 0 : undefined);


  return (
    <div className="h-screen bg-uvz-cream overflow-hidden">
      {/* Header */}
      <ChatHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        currentUser={currentUser}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        setIsLogoutOpen={setIsLogoutOpen}
        sessionCount={sessions.length}
        isPro={isPro}
        onUpgradeClick={() => setIsUpgradeModalOpen(true)}
      />

      {/* Sidebar - only render mobile overlay after hydration to prevent mismatch */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        isMobile={hasMounted ? !isDesktop : false}
        onClose={() => setIsSidebarOpen(false)}
        createNewChat={createNewChat}
        isLogoutOpen={isLogoutOpen}
        setIsLogoutOpen={setIsLogoutOpen}
        handleLogout={handleLogout}
        sessions={sessions}
        currentSessionId={null}
        onSelectSession={loadSession}
        onDeleteSession={async () => {}}
      />

      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white border-4 border-black rounded-2xl shadow-brutal max-w-md w-full p-6"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-uvz-orange to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black mb-2">Unlock All Daily Ideas</h2>
                <p className="text-gray-600 mb-4">
                  Free users can only access today's idea. Upgrade to Pro to unlock the full archive and research any idea in chat!
                </p>
                
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xl text-red-500 line-through">$10</span>
                    <span className="text-3xl font-black">$8</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <ul className="text-sm text-left space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Full Daily Ideas Archive
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Research Any Idea in Chat
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Unlimited AI Research Sessions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Full Builder Studio Access
                    </li>
                  </ul>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="flex-1 px-4 py-3 border-2 border-black rounded-xl font-bold hover:bg-gray-100 transition-colors"
                  >
                    Maybe Later
                  </button>
                  <Link
                    href="/upgrade"
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-uvz-orange to-pink-500 text-white border-2 border-black rounded-xl font-bold shadow-brutal hover:-translate-y-0.5 transition-all text-center"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        style={{ marginLeft: getMainMargin() }}
        className="h-screen pt-16 overflow-y-auto transition-all duration-300 ease-in-out"
      >
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-uvz-orange via-pink-500 to-purple-600 text-white py-8 md:py-12 border-b-4 border-black">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full mb-4 md:mb-6">
              <Flame className="w-4 h-4 md:w-5 md:h-5" />
              <span className="font-bold text-sm md:text-base">Fresh Ideas Daily</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black mb-3 md:mb-4">
              Daily AI Niche Ideas
            </h1>
            <p className="text-base md:text-xl opacity-90 max-w-2xl mx-auto">
              Pre-researched, data-backed niche opportunities. Skip the research, start building.
            </p>
            {isPro && (
              <div className="inline-flex items-center gap-2 mt-4 bg-white/20 px-4 py-2 rounded-full">
                <Crown className="w-4 h-4" />
                <span className="font-bold text-sm">Full Archive Access</span>
              </div>
            )}
          </div>
        </section>

        {/* Content Area */}
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          {/* Today's Idea - Featured for Free Users */}
          {!isPro && todaysIdea && (
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-black mb-4 flex items-center gap-2">
                <Flame className="w-6 h-6 text-uvz-orange" />
                Today's Idea
              </h2>
              <motion.button
                onClick={() => handleIdeaClick(todaysIdea)}
                className="w-full bg-white border-4 border-black rounded-xl p-4 md:p-6 text-left hover:shadow-brutal transition-all hover:-translate-y-1 group"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-white bg-uvz-orange px-2 py-1 rounded-full">
                        {todaysIdea.industry}
                      </span>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Free Access
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-black mb-2 group-hover:text-uvz-orange transition-colors">
                      {todaysIdea.name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {todaysIdea.one_liner}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs text-white px-2 py-1 rounded-full ${getDemandBadge(todaysIdea.demand_level)}`}>
                        {todaysIdea.demand_level} demand
                      </span>
                      <span className={`text-xs text-white px-2 py-1 rounded-full ${getCompetitionBadge(todaysIdea.competition_level)}`}>
                        {todaysIdea.competition_level} competition
                      </span>
                    </div>
                  </div>
                  <div className={`text-3xl font-black px-4 py-2 rounded-lg ${getScoreColor(computeTotalScore(todaysIdea))}`}>
                    {computeTotalScore(todaysIdea)}/10
                  </div>
                </div>
              </motion.button>
            </div>
          )}

          {/* Archive Section */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl md:text-2xl font-black flex items-center gap-2">
                {isPro ? (
                  <>
                    <Sparkles className="w-6 h-6 text-uvz-orange" />
                    All Ideas
                  </>
                ) : (
                  <>
                    <Lock className="w-6 h-6 text-gray-400" />
                    Previous Ideas
                    <span className="text-sm font-normal text-gray-500">(Pro Only)</span>
                  </>
                )}
              </h2>
              {isPro && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded-lg hover:bg-gray-100 font-bold text-sm transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              )}
            </div>

            {/* Filter Panel (Pro only) */}
            <AnimatePresence>
              {showFilters && isPro && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="bg-white border-4 border-black rounded-xl p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm">Industry:</span>
                      <button
                        onClick={() => setSelectedIndustry('')}
                        className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-colors ${
                          !selectedIndustry ? 'bg-uvz-orange text-white' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      {industries.map(ind => (
                        <button
                          key={ind}
                          onClick={() => setSelectedIndustry(ind)}
                          className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium transition-colors ${
                            selectedIndustry === ind ? 'bg-uvz-orange text-white' : 'bg-gray-100 hover:bg-gray-200'
                          }`}
                        >
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ideas Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white border-4 border-black rounded-xl p-6 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : ideas.length === 0 ? (
              /* Empty State - Generating or waiting */
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-uvz-orange/20 to-pink-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  {isGenerating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-10 h-10 text-uvz-orange" />
                    </motion.div>
                  ) : (
                    <Sparkles className="w-10 h-10 text-uvz-orange" />
                  )}
                </div>
                <h3 className="text-2xl font-black mb-3">
                  {isGenerating ? "🔬 Researching Today's Niche..." : "Ideas Coming Soon!"}
                </h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  {isGenerating 
                    ? "Our AI is deep-diving into market trends, analyzing competition, and finding a hidden gem opportunity. This takes about 30-60 seconds..."
                    : "Our AI is researching the hottest niches and opportunities. New ideas are generated daily at 8 AM UTC."
                  }
                </p>
                {isGenerating ? (
                  <div className="bg-white border-4 border-black rounded-xl p-4 md:p-6 max-w-md mx-auto">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-uvz-orange/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Target className="w-6 h-6 text-uvz-orange" />
                        </motion.div>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-bold">AI Research in Progress</p>
                        <p className="text-sm text-gray-500">Page will refresh automatically when ready</p>
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-uvz-orange to-pink-500"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 30, ease: "linear" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-4 border-black rounded-xl p-4 md:p-6 max-w-sm mx-auto">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold">Check back soon</p>
                        <p className="text-sm text-gray-500">Or start your own research in chat!</p>
                      </div>
                    </div>
                  </div>
                )}
                {!isGenerating && (
                  <Link
                    href="/chat"
                    className="inline-flex items-center gap-2 bg-uvz-orange text-white font-bold px-6 py-3 border-2 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all mt-6"
                  >
                    <Zap className="w-5 h-5" />
                    Start Research in Chat
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* For Pro: show all ideas */}
                {isPro ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {ideas.map((idea) => (
                      <motion.button
                        key={idea.id}
                        onClick={() => handleIdeaClick(idea)}
                        className="bg-white border-4 border-black rounded-xl p-4 md:p-6 text-left hover:shadow-brutal transition-all hover:-translate-y-1 group"
                        whileHover={{ scale: 1.02 }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-white bg-uvz-orange px-2 py-1 rounded-full">
                              {idea.industry}
                            </span>
                            {idea.featured_date === today && (
                              <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                                <Flame className="w-3 h-3" />
                                Today
                              </span>
                            )}
                          </div>
                          <div className={`text-xl font-black px-2 py-1 rounded-lg ${getScoreColor(computeTotalScore(idea))}`}>
                            {computeTotalScore(idea)}/10
                          </div>
                        </div>

                        <h3 className="text-lg md:text-xl font-black mb-2 group-hover:text-uvz-orange transition-colors">
                          {idea.name}
                        </h3>

                        <p className="text-gray-600 text-sm md:text-base mb-3 line-clamp-2">
                          {idea.one_liner}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span className={`text-xs text-white px-2 py-1 rounded-full ${getDemandBadge(idea.demand_level)}`}>
                            {idea.demand_level} demand
                          </span>
                          <span className={`text-xs text-white px-2 py-1 rounded-full ${getCompetitionBadge(idea.competition_level)}`}>
                            {idea.competition_level} competition
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-100">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(idea.featured_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  /* For Free: show locked previous ideas */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {ideas.filter(idea => idea.featured_date !== today).slice(0, 4).map((idea) => (
                      <div
                        key={idea.id}
                        className="relative bg-white border-4 border-gray-300 rounded-xl p-4 md:p-6 opacity-60"
                      >
                        {/* Locked overlay */}
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] rounded-lg flex items-center justify-center z-10">
                          <button
                            onClick={() => setIsUpgradeModalOpen(true)}
                            className="flex flex-col items-center gap-2 p-4"
                          >
                            <div className="w-12 h-12 bg-gray-100 border-2 border-gray-300 rounded-full flex items-center justify-center">
                              <Lock className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="font-bold text-gray-600 text-sm">Upgrade to Access</span>
                          </button>
                        </div>

                        {/* Blurred content */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs font-bold text-white bg-gray-400 px-2 py-1 rounded-full">
                            {idea.industry}
                          </span>
                          <div className="text-xl font-black px-2 py-1 rounded-lg bg-gray-100 text-gray-400">
                            ?/10
                          </div>
                        </div>

                        <h3 className="text-lg font-black mb-2 text-gray-400">
                          {idea.name}
                        </h3>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                          {idea.one_liner}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(idea.featured_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upgrade CTA for Free users */}
                {!isPro && (
                  <div className="mt-8 text-center">
                    <div className="bg-gradient-to-br from-uvz-orange/10 to-pink-500/10 border-4 border-dashed border-uvz-orange/30 rounded-xl p-6 md:p-8">
                      <Crown className="w-12 h-12 text-uvz-orange mx-auto mb-4" />
                      <h3 className="text-xl md:text-2xl font-black mb-2">Want Access to All Ideas?</h3>
                      <p className="text-gray-600 mb-4 max-w-md mx-auto">
                        Upgrade to Pro to unlock the full archive of pre-researched niche ideas and start building today.
                      </p>
                      <Link
                        href="/upgrade"
                        className="inline-flex items-center gap-2 bg-uvz-orange text-white font-bold px-6 py-3 border-2 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all"
                      >
                        <Rocket className="w-5 h-5" />
                        Upgrade to Pro
                      </Link>
                    </div>
                  </div>
                )}

                {/* Pagination (Pro only) */}
                {isPro && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>
                    <span className="font-bold">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Idea Detail Modal */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-start md:items-center justify-center p-0 md:p-4 bg-black/50 overflow-y-auto"
            onClick={handleCloseDetail}
          >
            <div 
              className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-5xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-white md:border-4 md:border-black md:rounded-2xl h-full md:max-h-[90vh] overflow-hidden flex flex-col"
              >
                {detailLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
                  </div>
                ) : selectedIdea ? (
                  <>
                    {/* Modal Header */}
                    <div className="sticky top-0 bg-white border-b-2 border-black p-4 flex items-center justify-between z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white bg-uvz-orange px-2 py-1 rounded-full">
                          {selectedIdea.industry}
                        </span>
                        <div className={`text-lg font-black px-2 py-1 rounded-lg ${getScoreColor(computeTotalScore(selectedIdea))}`}>
                          {computeTotalScore(selectedIdea)}/10
                        </div>
                      </div>
                      <button
                        onClick={handleCloseDetail}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
                      <h2 className="text-2xl md:text-3xl font-black mb-2">{selectedIdea.name}</h2>
                      <p className="text-lg text-gray-600 mb-6">{selectedIdea.one_liner}</p>

                      {/* Tabs */}
                      <div className="flex gap-1 md:gap-2 mb-6 overflow-x-auto pb-2">
                        {(['overview', 'market', 'validation', 'products'] as const).map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 md:px-4 py-2 font-bold text-sm md:text-base rounded-lg transition-colors whitespace-nowrap ${
                              activeTab === tab 
                                ? 'bg-uvz-orange text-white' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="min-h-[200px]">
                        {activeTab === 'overview' && (
                          <div className="space-y-6">
                            <div>
                              <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                                <Target className="w-5 h-5 text-uvz-orange" />
                                Target Audience
                              </h3>
                              <p className="text-gray-700">{selectedIdea.target_audience}</p>
                            </div>
                            
                            <div>
                              <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                Core Problem
                              </h3>
                              <p className="text-gray-700">{selectedIdea.core_problem}</p>
                            </div>

                            {selectedIdea.pain_points && selectedIdea.pain_points.length > 0 && (
                              <div>
                                <h3 className="font-black text-lg mb-3">Pain Points</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {selectedIdea.pain_points.map((point, i) => (
                                    <div key={i} className="flex items-start gap-2 bg-red-50 p-3 rounded-xl">
                                      <span className="text-red-500 mt-0.5">•</span>
                                      <span className="text-sm">{point}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <h3 className="font-black text-lg mb-2">Description</h3>
                              <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.description}</p>
                            </div>
                          </div>
                        )}

                        {activeTab === 'market' && (
                          <div className="space-y-6">
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <BarChart3 className="w-5 h-5 text-blue-600" />
                                  <p className="text-sm font-bold text-blue-800">Market Size</p>
                                </div>
                                <p className="font-black text-2xl text-blue-900">{selectedIdea.market_size || 'N/A'}</p>
                              </div>
                              <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border-2 border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-5 h-5 text-green-600" />
                                  <p className="text-sm font-bold text-green-800">Growth Rate</p>
                                </div>
                                <p className="font-black text-2xl text-green-900">{selectedIdea.growth_rate || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Demand & Competition */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className={`p-5 rounded-xl border-2 ${
                                selectedIdea.demand_level === 'high' 
                                  ? 'bg-green-50 border-green-200' 
                                  : selectedIdea.demand_level === 'medium'
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <p className="text-sm font-bold text-gray-600 mb-1">Demand Level</p>
                                <div className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${
                                    selectedIdea.demand_level === 'high' ? 'bg-green-500' :
                                    selectedIdea.demand_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></span>
                                  <p className="font-black text-xl capitalize">{selectedIdea.demand_level}</p>
                                </div>
                              </div>
                              <div className={`p-5 rounded-xl border-2 ${
                                selectedIdea.competition_level === 'low' 
                                  ? 'bg-green-50 border-green-200' 
                                  : selectedIdea.competition_level === 'medium'
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-red-50 border-red-200'
                              }`}>
                                <p className="text-sm font-bold text-gray-600 mb-1">Competition</p>
                                <div className="flex items-center gap-2">
                                  <span className={`w-3 h-3 rounded-full ${
                                    selectedIdea.competition_level === 'low' ? 'bg-green-500' :
                                    selectedIdea.competition_level === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}></span>
                                  <p className="font-black text-xl capitalize">{selectedIdea.competition_level}</p>
                                </div>
                              </div>
                            </div>

                            {/* Trending Score - Fixed to /10 */}
                            <div className="bg-gradient-to-r from-orange-50 to-pink-50 p-5 rounded-xl border-2 border-orange-200">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Flame className="w-5 h-5 text-uvz-orange" />
                                  <span className="font-black text-lg">Trending Score</span>
                                </div>
                                <span className="font-black text-2xl text-uvz-orange">
                                  {formatScore(selectedIdea.trending_score)}/10
                                </span>
                              </div>
                              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-uvz-orange to-pink-500 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((Number(selectedIdea.trending_score ?? 0) / 10) * 100, 100)}%` }}
                                />
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                {Number(selectedIdea.trending_score ?? 0) >= 8 ? '🔥 Hot opportunity - Act fast!' :
                                 Number(selectedIdea.trending_score ?? 0) >= 6 ? '📈 Growing trend - Good timing' :
                                 Number(selectedIdea.trending_score ?? 0) >= 4 ? '⏳ Emerging - Early mover advantage' :
                                 '🌱 Nascent market - Long-term play'}
                              </p>
                            </div>

                            {/* Component Scores: Opportunity / Problem / Feasibility */}
                            <div className="grid grid-cols-3 gap-4 mt-4">
                              <div className="p-4 rounded-xl border-2 bg-green-50 border-green-200 text-center">
                                <p className="text-xs font-bold text-gray-600 mb-1">Opportunity</p>
                                <p className="font-black text-2xl text-green-900">{formatScore(selectedIdea.opportunity_score)}/10</p>
                                {selectedIdea.scores_explanation?.opportunity && (
                                  <p className="text-sm text-gray-600 mt-2">{selectedIdea.scores_explanation.opportunity}</p>
                                )}
                              </div>
                              <div className="p-4 rounded-xl border-2 bg-purple-50 border-purple-200 text-center">
                                <p className="text-xs font-bold text-gray-600 mb-1">Problem</p>
                                <p className="font-black text-2xl text-purple-900">{formatScore(selectedIdea.problem_score)}/10</p>
                                {selectedIdea.scores_explanation?.problem && (
                                  <p className="text-sm text-gray-600 mt-2">{selectedIdea.scores_explanation.problem}</p>
                                )}
                              </div>
                              <div className="p-4 rounded-xl border-2 bg-blue-50 border-blue-200 text-center">
                                <p className="text-xs font-bold text-gray-600 mb-1">Feasibility</p>
                                <p className="font-black text-2xl text-blue-900">{formatScore(selectedIdea.feasibility_score)}/10</p>
                                {selectedIdea.scores_explanation?.feasibility && (
                                  <p className="text-sm text-gray-600 mt-2">{selectedIdea.scores_explanation.feasibility}</p>
                                )}
                              </div>
                            </div>

                            {/* Overall Idea Score */}
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-5 rounded-xl border-2 border-yellow-200 mt-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Target className="w-5 h-5 text-yellow-600" />
                                  <span className="font-black text-lg">Overall Idea Score</span>
                                </div>
                                <span className={`font-black text-2xl px-3 py-1 rounded-lg ${getScoreColor(computeTotalScore())}`}>
                                  {computeTotalScore()}/10
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-2">
                                Average of Opportunity, Problem, and Feasibility scores
                              </p>
                            </div>

                            {/* Market Analysis from Full Report */}
                            {selectedIdea.full_research_report?.market_analysis && (
                              <div className="bg-gray-50 p-5 rounded-xl border-2 border-gray-200">
                                <h4 className="font-black text-lg mb-3">Market Analysis</h4>
                                <p className="text-gray-700 mb-4">{selectedIdea.full_research_report.market_analysis.overview}</p>
                                
                                {selectedIdea.full_research_report.market_analysis.key_trends && (
                                  <div className="mt-4">
                                    <p className="font-bold text-sm text-gray-600 mb-2">Key Trends:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedIdea.full_research_report.market_analysis.key_trends.map((trend: string, i: number) => (
                                        <span key={i} className="bg-white px-3 py-1 rounded-full text-sm border border-gray-300">
                                          {trend}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'validation' && (
                          <div>
                            {gatedSections.includes('validation_signals') ? (
                              <GatedContent onUpgrade={() => setIsUpgradeModalOpen(true)} />
                            ) : (
                              <div className="space-y-6">
                                {/* Validation & Strategy Frameworks */}
                                <h3 className="font-black text-lg flex items-center gap-2">
                                  <Target className="w-5 h-5 text-uvz-orange" />
                                  Idea Validation & Strategy Frameworks
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Value Equation - Circular Gauge */}
                                  <div className="bg-white border-2 p-5 rounded-xl flex items-center gap-4 min-w-0 overflow-hidden">
                                    <div className="w-28 h-28 flex items-center justify-center">
                                      {/* SVG circular gauge */}
                                      {(() => {
                                        const score = clamp(Math.round(computeTotalScore(selectedIdea)), 0, 10);
                                        const pct = score * 10; // 0-100
                                        const radius = 44;
                                        const circumference = 2 * Math.PI * radius;
                                        const dash = (pct / 100) * circumference;
                                        const offset = circumference - dash;

                                        return (
                                          <svg width="88" height="88" viewBox="0 0 100 100">
                                            <defs>
                                              <linearGradient id="valEqGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#F97316" />
                                                <stop offset="100%" stopColor="#EC4899" />
                                              </linearGradient>
                                            </defs>
                                            <g transform="translate(50,50)">
                                              <circle r={radius} cx="0" cy="0" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                                              <circle r={radius} cx="0" cy="0" fill="none" stroke="url(#valEqGrad)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} transform="rotate(-90)" />
                                              <text x="0" y="6" textAnchor="middle" fontWeight={800} fontSize="20" fill="#111827">{score}</text>
                                              <text x="0" y="24" textAnchor="middle" fontSize="10" fill="#6B7280">/10</text>
                                            </g>
                                          </svg>
                                        );
                                      })()}
                                    </div>

                                    <div className="flex-1">
                                      <h4 className="font-black">Value Equation</h4>
                                      <p className="text-sm text-gray-600 mb-2">Scores how much value this idea creates relative to effort, risk or cost.</p>
                                      <p className="text-sm font-bold">Score: {clamp(Math.round(computeTotalScore(selectedIdea)), 0, 10)}/10</p>
                                    </div>
                                  </div>

                                  {/* Market Matrix - 2x2 Quadrant */}
                                  <div className="bg-white border-2 p-5 rounded-xl min-w-0 overflow-hidden">
                                    <h4 className="font-black mb-3">Market Matrix</h4>
                                    {(() => {
                                      const uniq = (() => {
                                        const c = (selectedIdea.competition_level || 'medium').toLowerCase();
                                        return c === 'low' ? 0.8 : c === 'medium' ? 0.5 : 0.2;
                                      })();
                                      const val = (() => {
                                        const d = (selectedIdea.demand_level || 'medium').toLowerCase();
                                        return d === 'high' ? 0.9 : d === 'medium' ? 0.6 : 0.3;
                                      })();

                                      const quadrant = uniq >= 0.6 && val >= 0.6 ? 'Category King' : uniq >= 0.6 && val < 0.6 ? 'Tech Novelty' : uniq < 0.6 && val >= 0.6 ? 'Commodity Play' : 'Low Impact';

                                      return (
                                        <>
                                          <div className="grid grid-cols-2 gap-2 h-36 text-sm text-gray-700">
                                            <div className={`p-3 rounded-lg flex items-center justify-center text-center ${quadrant === 'Tech Novelty' ? 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-300' : 'bg-gray-50 border border-gray-100'}`}>
                                              <div>
                                                <div className="font-bold">Tech Novelty</div>
                                                <div className="text-xs text-gray-500">High uniqueness, lower value</div>
                                              </div>
                                            </div>
                                            <div className={`p-3 rounded-lg flex items-center justify-center text-center ${quadrant === 'Category King' ? 'bg-gradient-to-br from-uvz-orange/20 to-pink-50 border-2 border-uvz-orange' : 'bg-gray-50 border border-gray-100'}`}>
                                              <div>
                                                <div className="font-bold">Category King</div>
                                                <div className="text-xs text-gray-500">High uniqueness, high value</div>
                                              </div>
                                            </div>
                                            <div className={`p-3 rounded-lg flex items-center justify-center text-center ${quadrant === 'Low Impact' ? 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300' : 'bg-gray-50 border border-gray-100'}`}>
                                              <div>
                                                <div className="font-bold">Low Impact</div>
                                                <div className="text-xs text-gray-500">Low uniqueness, low value</div>
                                              </div>
                                            </div>
                                            <div className={`p-3 rounded-lg flex items-center justify-center text-center ${quadrant === 'Commodity Play' ? 'bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300' : 'bg-gray-50 border border-gray-100'}`}>
                                              <div>
                                                <div className="font-bold">Commodity Play</div>
                                                <div className="text-xs text-gray-500">Low uniqueness, high value</div>
                                              </div>
                                            </div>
                                          </div>

                                          <p className="text-xs text-gray-500 mt-2">Classified as <span className="font-bold">{quadrant}</span> (uniqueness: {Math.round(uniq*100)}%, value: {Math.round(val*100)}%)</p>
                                        </>
                                      );
                                    })()}
                                  </div>

                                  {/* A.C.P. Framework - 3 bars */}
                                  <div className="bg-white border-2 p-5 rounded-xl min-w-0 overflow-hidden">
                                    <h4 className="font-black mb-3">A.C.P. Framework</h4>
                                    {(() => {
                                      const audience = clamp(Math.round((selectedIdea.opportunity_score ?? 5)), 0, 10);
                                      const community = clamp(Math.round((selectedIdea.trending_score ?? 5)), 0, 10);
                                      const product = clamp(Math.round((selectedIdea.feasibility_score ?? (selectedIdea.opportunity_score ?? 5))), 0, 10);

                                      const bar = (label: string, score: number) => (
                                        <div className="mb-3">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="font-bold text-sm">{label}</div>
                                            <div className="text-xs text-gray-600 font-bold">{score}/10</div>
                                          </div>
                                          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                            <div className="h-3 bg-uvz-orange" style={{ width: `${score * 10}%` }} />
                                          </div>
                                        </div>
                                      );

                                      return (
                                        <div>
                                          {bar('Audience', audience)}
                                          {bar('Community', community)}
                                          {bar('Product', product)}
                                          <p className="text-xs text-gray-500 mt-2">Scores indicate how strong each pillar is around this idea.</p>
                                        </div>
                                      );
                                    })()}
                                  </div>

                                  {/* Value Ladder - Bait -> Frontend -> Core -> Backend */}
                                  <div className="bg-white border-2 p-5 rounded-xl min-w-0 overflow-hidden">
                                    <h4 className="font-black mb-3">Value Ladder</h4>
                                    {(() => {
                                      const hasBait = (selectedIdea.monetization_ideas && selectedIdea.monetization_ideas.length > 0) || false;
                                      const hasFrontend = (selectedIdea.product_ideas && selectedIdea.product_ideas.length > 0) || false;
                                      const hasCore = (selectedIdea.monetization_ideas && selectedIdea.monetization_ideas.some((m:any) => m.type === 'core' || m.role === 'core')) || hasFrontend;
                                      const hasBackend = (selectedIdea.monetization_ideas && selectedIdea.monetization_ideas.some((m:any) => m.type === 'backend' || m.role === 'backend')) || false;

                                      const step = (label: string, present: boolean, subtitle?: string) => (
                                        <div className={`flex-1 min-w-0 p-3 rounded-lg ${present ? 'bg-uvz-orange text-white' : 'bg-gray-50 text-gray-600'} flex flex-col items-start` }>
                                          <div className="font-bold">{label}</div>
                                          {subtitle && <div className="text-xs mt-1 break-words">{subtitle}</div>}
                                        </div>
                                      );

                                      return (
                                        <div>
                                          <div className="flex items-center gap-3">
                                            {step('Bait', hasBait, 'Free/low-ticket entry')}
                                            <div className="w-6 h-1 bg-gray-200 rounded" />
                                            {step('Frontend', hasFrontend, 'Low-priced offer')}
                                            <div className="w-6 h-1 bg-gray-200 rounded" />
                                            {step('Core Offer', hasCore, 'Main paid product')}
                                            <div className="w-6 h-1 bg-gray-200 rounded" />
                                            {step('Backend', hasBackend, 'High-value backend')}
                                          </div>
                                          <p className="text-xs text-gray-500 mt-3">Map of potential offers from low-commitment to high-ticket backend.</p>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Existing validation signals list (kept below frameworks) */}
                                {selectedIdea.validation_signals && selectedIdea.validation_signals.length > 0 ? (
                                  <div>
                                    <p className="text-gray-600 mb-4">Evidence supporting this opportunity:</p>
                                    {selectedIdea.validation_signals.map((signal: any, i: number) => {
                                      const signalType = signal.type || signal.signal || 'Validation Signal';
                                      const signalDesc = signal.description || signal.source || '';
                                      const signalEvidence = signal.evidence || '';
                                      const strength = signal.strength || 'Strong';

                                      return (
                                        <div key={i} className="bg-white border-2 border-green-200 p-5 rounded-xl hover:border-green-400 transition-colors mb-3">
                                          <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                              </div>
                                              <div>
                                                <span className="font-black text-lg">{signalType}</span>
                                                {strength && (
                                                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                                                    strength === 'Strong' ? 'bg-green-100 text-green-700' :
                                                    strength === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-700'
                                                  }`}>
                                                    {strength}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                          <p className="text-gray-700 mb-2">{signalDesc}</p>
                                          {signalEvidence && (
                                            <div className="bg-gray-50 p-3 rounded-lg mt-3">
                                              <p className="text-sm text-gray-600">
                                                <span className="font-bold">Evidence:</span> {signalEvidence}
                                              </p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500 font-bold">No validation signals available yet</p>
                                    <p className="text-sm text-gray-400 mt-2">Check back after the next idea generation</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 'products' && (
                          <div>
                            {gatedSections.includes('product_ideas') ? (
                              <GatedContent onUpgrade={() => setIsUpgradeModalOpen(true)} />
                            ) : (
                              <div className="space-y-8">
                                {/* Product Ideas Carousel */}
                                {selectedIdea.product_ideas && selectedIdea.product_ideas.length > 0 && (
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <h3 className="font-black text-lg flex items-center gap-2">
                                        <Rocket className="w-5 h-5 text-uvz-orange" />
                                        Product Ideas ({selectedIdea.product_ideas.length})
                                      </h3>
                                      <p className="text-sm text-gray-500">← Scroll →</p>
                                      <p className="text-xs text-gray-500 mt-1">Select a product card to choose it, then use the <span className="font-bold">Research</span> or <span className="font-bold">Build</span> buttons below.</p>
                                    </div>


                                    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                      { (selectedIdea?.product_ideas || []).map((product: any, i: number) => (
                                        <div 
                                          key={product.id ? product.id : `prod-${i}-${(product.type||'').toString().replace(/\s+/g,'').toLowerCase()}`}
                                          onClick={() => setSelectedProductIdx(i)}
                                          aria-selected={selectedProductIdx === i}
                                          className={`flex-shrink-0 w-[300px] bg-gradient-to-br from-white to-blue-50 p-5 rounded-xl snap-start transition-all hover:shadow-lg cursor-pointer relative ${selectedProductIdx === i ? 'ring-4 ring-uvz-orange' : 'border-2 border-blue-200 hover:border-blue-400'}`}
                                        >
                                          {/* Selection tick */}
                                          <div className="absolute top-3 right-3">
                                            {selectedProductIdx === i && (
                                              <CheckCircle className="w-6 h-6 text-green-600" />
                                            )}
                                          </div>

                                          {/* Product Type Badge */}
                                          <div className="flex items-center justify-between mb-3">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                              product.type?.toLowerCase().includes('saas') ? 'bg-purple-100 text-purple-700' :
                                              product.type?.toLowerCase().includes('course') ? 'bg-blue-100 text-blue-700' :
                                              product.type?.toLowerCase().includes('template') || product.type?.toLowerCase().includes('tool') ? 'bg-green-100 text-green-700' :
                                              product.type?.toLowerCase().includes('community') ? 'bg-yellow-100 text-yellow-700' :
                                              product.type?.toLowerCase().includes('service') || product.type?.toLowerCase().includes('consulting') ? 'bg-orange-100 text-orange-700' :
                                              'bg-gray-100 text-gray-700'
                                            }`}>
                                              {product.type || 'Product'}
                                            </span>
                                            {product.build_difficulty && (
                                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                product.build_difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                product.build_difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                              }`}>
                                                {product.build_difficulty}
                                              </span>
                                            )}
                                          </div>
                                          
                                          {/* Product Name & Tagline */}
                                          <h4 className="font-black text-lg mb-1">{product.name}</h4>
                                          {product.tagline && (
                                            <p className="text-sm text-gray-500 italic mb-2">"{product.tagline}"</p>
                                          )}
                                          
                                          {/* Description */}
                                          <p className="text-sm text-gray-700 mb-4 line-clamp-3">{product.description}</p>
                                          
                                          {/* Core Features */}
                                          {product.core_features && product.core_features.length > 0 && (
                                            <div className="mb-4">
                                              <p className="text-xs font-bold text-gray-500 mb-2">Key Features:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {product.core_features.slice(0, 3).map((feature: string, fi: number) => (
                                                  <span key={fi} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                    {feature}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Bottom Stats */}
                                          <div className="border-t pt-3 mt-auto">
                                            <div className="flex items-center justify-between text-sm">
                                              {product.price_point && (
                                                <span className="font-black text-green-600">{product.price_point}</span>
                                              )}
                                              {product.build_time && (
                                                <span className="text-gray-500">⏱ {product.build_time}</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Monetization Strategies */}
                                {selectedIdea.monetization_ideas && selectedIdea.monetization_ideas.length > 0 && (
                                  <div>
                                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                      <Zap className="w-5 h-5 text-green-600" />
                                      Monetization Strategies
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {selectedIdea.monetization_ideas.map((idea: any, i: number) => (
                                        <div key={i} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 p-4 rounded-xl">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="font-black text-lg">{idea.model}</p>
                                            {idea.recurring !== undefined && (
                                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                                idea.recurring ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                {idea.recurring ? '🔄 Recurring' : '💰 One-time'}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-sm text-gray-600 mb-2">{idea.description}</p>
                                          {idea.price_range && (
                                            <p className="text-lg font-black text-green-600">{idea.price_range}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA Footer */}
                    <div className="sticky bottom-0 border-t-2 border-black p-4 bg-gray-50">
                      {isPro ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          {(() => {
                            let param = '';
                            const prods = (selectedIdea?.product_ideas || []);
                            if (selectedProductIdx !== null && prods[selectedProductIdx]) {
                              param = `&productIndex=${selectedProductIdx}`;
                            } else if (prods && prods.length > 0) {
                              param = `&productIndex=0`;
                            }

                            return (
                              <>
                                <Link
                                  href={`/chat?idea=${selectedIdea.id}${param}`}
                                  className={`flex-1 flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-4 py-3 border-2 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all ${!param ? 'opacity-80' : ''}`}
                                >
                                  <Sparkles className="w-5 h-5" />
                                  Research in Chat
                                </Link>
                                <Link
                                  href={`/builder/create?idea=${selectedIdea.id}${param}`}
                                  className={`flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold px-4 py-3 border-2 border-black rounded-xl hover:bg-gray-100 transition-all ${!param ? 'opacity-80' : ''}`}
                                >
                                  <Rocket className="w-5 h-5" />
                                  Build Product
                                </Link>
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Link
                            href="/upgrade"
                            className="inline-flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-6 py-3 border-2 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all"
                          >
                            <Lock className="w-5 h-5" />
                            Upgrade to Research This
                          </Link>
                          <p className="text-sm text-gray-500 mt-2">
                            Get full access to research and build any idea
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {selectedIdea.sources && selectedIdea.sources.length > 0 && !gatedSections.includes('sources') && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-2 font-bold">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedIdea.sources.slice(0, 5).map((source: any, i: number) => (
                            <a
                              key={i}
                              href={source.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {source.title?.slice(0, 30)}...
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-500">Idea not found</p>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Gated content component for free users
function GatedContent({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="relative min-h-[200px]">
      {/* Blurred placeholder content */}
      <div className="blur-sm pointer-events-none opacity-50">
        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-xl">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl">
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border-4 border-black rounded-xl p-6 text-center shadow-brutal max-w-xs">
          <Lock className="w-10 h-10 text-uvz-orange mx-auto mb-3" />
          <h3 className="font-black text-lg mb-2">Pro Feature</h3>
          <p className="text-gray-600 text-sm mb-4">
            Upgrade to unlock validation signals and product ideas.
          </p>
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-4 py-3 border-2 border-black rounded-lg shadow-brutal-sm hover:-translate-y-0.5 transition-all"
          >
            Upgrade to Pro
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DailyIdeasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full"></div>
      </div>
    }>
      <DailyIdeasContent />
    </Suspense>
  );
}
