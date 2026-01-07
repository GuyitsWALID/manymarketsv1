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
  const [gatedSections, setGatedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
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

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-500 bg-green-100';
    if (score >= 5) return 'text-yellow-500 bg-yellow-100';
    return 'text-red-500 bg-red-100';
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

  const getMainMargin = () => {
    if (!isDesktop) return 0;
    if (!isSidebarOpen) return 0;
    return 288;
  };

  const today = new Date().toISOString().split('T')[0];

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
                  <div className={`text-3xl font-black px-4 py-2 rounded-lg ${getScoreColor(todaysIdea.opportunity_score)}`}>
                    {todaysIdea.opportunity_score}/10
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
                          <div className={`text-xl font-black px-2 py-1 rounded-lg ${getScoreColor(idea.opportunity_score)}`}>
                            {idea.opportunity_score}/10
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
            className="fixed inset-0 z-[90] flex items-start md:items-center justify-center p-0 md:p-4 bg-black/50"
            onClick={handleCloseDetail}
          >
            <div 
              className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="bg-white md:border-4 md:border-black md:rounded-2xl h-full md:h-auto overflow-hidden flex flex-col"
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
                        <div className={`text-lg font-black px-2 py-1 rounded-lg ${getScoreColor(selectedIdea.opportunity_score)}`}>
                          {selectedIdea.opportunity_score}/10
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
                    <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-blue-50 p-4 rounded-xl text-center">
                                <p className="text-xs text-gray-500 mb-1">Market Size</p>
                                <p className="font-black text-lg">{selectedIdea.market_size || 'N/A'}</p>
                              </div>
                              <div className="bg-green-50 p-4 rounded-xl text-center">
                                <p className="text-xs text-gray-500 mb-1">Growth Rate</p>
                                <p className="font-black text-lg text-green-600">{selectedIdea.growth_rate || 'N/A'}</p>
                              </div>
                              <div className="bg-yellow-50 p-4 rounded-xl text-center">
                                <p className="text-xs text-gray-500 mb-1">Demand</p>
                                <p className="font-black text-lg capitalize">{selectedIdea.demand_level}</p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-xl text-center">
                                <p className="text-xs text-gray-500 mb-1">Competition</p>
                                <p className="font-black text-lg capitalize">{selectedIdea.competition_level}</p>
                              </div>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5 text-uvz-orange" />
                                <span className="font-black">Trending Score</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-uvz-orange to-pink-500 rounded-full"
                                    style={{ width: `${(selectedIdea.trending_score / 10) * 100}%` }}
                                  />
                                </div>
                                <span className="font-black text-lg">{selectedIdea.trending_score}/10</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {activeTab === 'validation' && (
                          <div>
                            {gatedSections.includes('validation_signals') ? (
                              <GatedContent onUpgrade={() => setIsUpgradeModalOpen(true)} />
                            ) : (
                              <>
                                {selectedIdea.validation_signals && selectedIdea.validation_signals.length > 0 ? (
                                  <div className="space-y-4">
                                    {selectedIdea.validation_signals.map((signal: any, i: number) => (
                                      <div key={i} className="bg-green-50 p-4 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                          <CheckCircle className="w-5 h-5 text-green-500" />
                                          <span className="font-bold">{signal.type}</span>
                                        </div>
                                        <p className="text-sm text-gray-700">{signal.description}</p>
                                        {signal.evidence && (
                                          <p className="text-xs text-gray-500 mt-2 italic">{signal.evidence}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 text-center py-8">No validation signals available</p>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {activeTab === 'products' && (
                          <div>
                            {gatedSections.includes('product_ideas') ? (
                              <GatedContent onUpgrade={() => setIsUpgradeModalOpen(true)} />
                            ) : (
                              <>
                                {selectedIdea.product_ideas && selectedIdea.product_ideas.length > 0 && (
                                  <div className="mb-6">
                                    <h3 className="font-black text-lg mb-4">Product Ideas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {selectedIdea.product_ideas.map((product: any, i: number) => (
                                        <div key={i} className="bg-blue-50 p-4 rounded-xl">
                                          <p className="font-bold mb-1">{product.name}</p>
                                          <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                                          {product.price_range && (
                                            <p className="text-sm text-blue-600 font-bold">{product.price_range}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {selectedIdea.monetization_ideas && selectedIdea.monetization_ideas.length > 0 && (
                                  <div>
                                    <h3 className="font-black text-lg mb-4">Monetization Strategies</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {selectedIdea.monetization_ideas.map((idea: any, i: number) => (
                                        <div key={i} className="bg-green-50 p-4 rounded-xl">
                                          <p className="font-bold">{idea.model}</p>
                                          <p className="text-sm text-gray-600">{idea.description}</p>
                                          {idea.price_range && (
                                            <p className="text-sm text-green-600 font-bold mt-2">{idea.price_range}</p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CTA Footer */}
                    <div className="sticky bottom-0 border-t-2 border-black p-4 bg-gray-50">
                      {isPro ? (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link
                            href={`/chat?idea=${selectedIdea.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-4 py-3 border-2 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all"
                          >
                            <Sparkles className="w-5 h-5" />
                            Research in Chat
                          </Link>
                          <Link
                            href={`/builder/create?idea=${selectedIdea.id}`}
                            className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold px-4 py-3 border-2 border-black rounded-xl hover:bg-gray-100 transition-all"
                          >
                            <Rocket className="w-5 h-5" />
                            Build Product
                          </Link>
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
