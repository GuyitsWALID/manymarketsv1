'use client';

import { useState, useEffect, Suspense } from 'react';
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
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

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

interface ApiResponse {
  ideas: DailyIdea[];
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
  
  const [ideas, setIdeas] = useState<DailyIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<DailyIdea | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [gatedSections, setGatedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [industries, setIndustries] = useState<string[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'market' | 'validation' | 'products'>('overview');

  // Fetch ideas list
  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', pagination.page.toString());
        if (selectedIndustry) params.set('industry', selectedIndustry);
        
        const res = await fetch(`/api/daily-ideas?${params}`);
        const data: ApiResponse = await res.json();
        
        setIdeas(data.ideas);
        setPagination(prev => ({
          ...prev,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
        }));
        setIndustries(data.filters.industries);
      } catch (error) {
        console.error('Failed to fetch ideas:', error);
      }
      setLoading(false);
    }
    
    fetchIdeas();
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
    router.push(`/daily-ideas?id=${idea.id}`);
  };

  const handleCloseDetail = () => {
    router.push('/daily-ideas');
  };

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

  return (
    <div className="min-h-screen bg-uvz-cream">
      {/* Header */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-uvz-orange" />
            <span className="text-2xl font-black">ManyMarkets</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/chat"
              className="px-4 py-2 font-bold hover:bg-gray-100 rounded-lg transition-colors"
            >
              Research Chat
            </Link>
            <Link 
              href="/upgrade"
              className="px-4 py-2 bg-uvz-orange text-white font-bold border-2 border-black rounded-lg shadow-brutal-sm hover:-translate-y-0.5 transition-all"
            >
              Upgrade
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-uvz-orange via-pink-500 to-purple-600 text-white py-16 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full mb-6">
            <Flame className="w-5 h-5" />
            <span className="font-bold">Fresh Ideas Daily</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            Daily AI Niche Ideas
          </h1>
          <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto">
            Pre-researched, data-backed niche opportunities delivered fresh every day. 
            Skip the research, start building.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-black">
              {selectedIndustry || 'All Industries'}
            </h2>
            <span className="text-gray-500">({pagination.total} ideas)</span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg hover:bg-gray-100 font-bold transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-white border-4 border-black rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-bold">Industry:</span>
                  <button
                    onClick={() => setSelectedIndustry('')}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      !selectedIndustry ? 'bg-uvz-orange text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {industries.map(ind => (
                    <button
                      key={ind}
                      onClick={() => setSelectedIndustry(ind)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white border-4 border-black rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-16">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-500">No ideas yet</h3>
            <p className="text-gray-400">Check back tomorrow for fresh niche ideas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ideas.map((idea) => (
              <motion.button
                key={idea.id}
                onClick={() => handleIdeaClick(idea)}
                className="bg-white border-4 border-black rounded-xl p-6 text-left hover:shadow-brutal transition-all hover:-translate-y-1 group"
                whileHover={{ scale: 1.02 }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-bold text-white bg-uvz-orange px-2 py-1 rounded-full">
                    {idea.industry}
                  </span>
                  <div className={`text-2xl font-black px-3 py-1 rounded-lg ${getScoreColor(idea.opportunity_score)}`}>
                    {idea.opportunity_score}/10
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black mb-2 group-hover:text-uvz-orange transition-colors">
                  {idea.name}
                </h3>

                {/* One-liner */}
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {idea.one_liner}
                </p>

                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`text-xs text-white px-2 py-1 rounded-full ${getDemandBadge(idea.demand_level)}`}>
                    {idea.demand_level} demand
                  </span>
                  <span className={`text-xs text-white px-2 py-1 rounded-full ${getCompetitionBadge(idea.competition_level)}`}>
                    {idea.competition_level} competition
                  </span>
                </div>

                {/* Target Audience Preview */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span className="line-clamp-1">{idea.target_audience}</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(idea.featured_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.page <= 1}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <span className="font-bold">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Idea Detail Modal */}
      <AnimatePresence>
        {selectedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 overflow-y-auto"
            onClick={handleCloseDetail}
          >
            <div className="min-h-screen flex items-start justify-center p-4 pt-8">
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white border-4 border-black rounded-2xl shadow-brutal w-full max-w-4xl relative overflow-hidden"
              >
                {detailLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-uvz-orange border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-500">Loading research report...</p>
                  </div>
                ) : selectedIdea ? (
                  <>
                    {/* Close button */}
                    <button
                      onClick={handleCloseDetail}
                      className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full z-10"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    {/* Header */}
                    <div className="bg-gradient-to-r from-uvz-orange to-pink-500 p-6 text-white">
                      <div className="flex items-start gap-4">
                        <div className={`text-3xl font-black px-4 py-2 rounded-xl bg-white ${getScoreColor(selectedIdea.opportunity_score).replace('bg-', 'text-').split(' ')[0]}`}>
                          {selectedIdea.opportunity_score}/10
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                            {selectedIdea.industry}
                          </span>
                          <h2 className="text-3xl font-black mt-2">{selectedIdea.name}</h2>
                          <p className="text-lg opacity-90 mt-2">{selectedIdea.one_liner}</p>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-4 mt-6">
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                          <TrendingUp className="w-4 h-4" />
                          <span className="font-bold capitalize">{selectedIdea.demand_level} Demand</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                          <Target className="w-4 h-4" />
                          <span className="font-bold capitalize">{selectedIdea.competition_level} Competition</span>
                        </div>
                        {selectedIdea.trending_score && (
                          <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-lg">
                            <Flame className="w-4 h-4" />
                            <span className="font-bold">{selectedIdea.trending_score}% Trending</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b-2 border-black flex">
                      {(['overview', 'market', 'validation', 'products'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 px-4 py-3 font-bold capitalize transition-colors ${
                            activeTab === tab 
                              ? 'bg-uvz-orange text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                      {/* Overview Tab */}
                      {activeTab === 'overview' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                              <Users className="w-5 h-5 text-uvz-orange" />
                              Target Audience
                            </h3>
                            <p className="text-gray-700">{selectedIdea.target_audience}</p>
                          </div>

                          <div>
                            <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-5 h-5 text-uvz-orange" />
                              Core Problem
                            </h3>
                            <p className="text-gray-700">{selectedIdea.core_problem}</p>
                          </div>

                          <div>
                            <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                              <Zap className="w-5 h-5 text-uvz-orange" />
                              Pain Points
                            </h3>
                            <ul className="space-y-2">
                              {(selectedIdea.pain_points || []).map((point, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 shrink-0" />
                                  <span>{point}</span>
                                </li>
                              ))}
                              {gatedSections.includes('full_pain_points') && (
                                <li className="flex items-start gap-2 text-gray-400 italic">
                                  <Lock className="w-4 h-4 mt-1 shrink-0" />
                                  <span>+ more pain points (Pro only)</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          {selectedIdea.description && (
                            <div>
                              <h3 className="font-black text-lg mb-2">Full Description</h3>
                              <p className="text-gray-700 whitespace-pre-wrap">{selectedIdea.description}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Market Tab */}
                      {activeTab === 'market' && (
                        <div className="space-y-6">
                          {gatedSections.includes('market_size') ? (
                            <GatedContent onUpgrade={() => router.push('/upgrade')} />
                          ) : (
                            <>
                              {selectedIdea.market_size && (
                                <div>
                                  <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-uvz-orange" />
                                    Market Size
                                  </h3>
                                  <p className="text-gray-700">{selectedIdea.market_size}</p>
                                </div>
                              )}

                              {selectedIdea.growth_rate && (
                                <div>
                                  <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-uvz-orange" />
                                    Growth Rate
                                  </h3>
                                  <p className="text-gray-700">{selectedIdea.growth_rate}</p>
                                </div>
                              )}

                              {selectedIdea.full_research_report?.market_analysis && (
                                <>
                                  <div>
                                    <h3 className="font-black text-lg mb-2">Key Trends</h3>
                                    <ul className="space-y-2">
                                      {selectedIdea.full_research_report.market_analysis.key_trends?.map((trend: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <TrendingUp className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                                          <span>{trend}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <h3 className="font-black text-lg mb-2">Competitive Landscape</h3>
                                    <div className="bg-gray-50 p-4 rounded-xl">
                                      <p className="mb-2">
                                        <strong>Saturation:</strong>{' '}
                                        <span className="capitalize">{selectedIdea.full_research_report.competitive_landscape?.saturation_level}</span>
                                      </p>
                                      <p className="mb-2">
                                        <strong>Barriers to Entry:</strong>{' '}
                                        {selectedIdea.full_research_report.competitive_landscape?.barriers_to_entry}
                                      </p>
                                      {selectedIdea.full_research_report.competitive_landscape?.gaps_and_opportunities && (
                                        <div className="mt-4">
                                          <strong>Gaps & Opportunities:</strong>
                                          <ul className="mt-2 space-y-1">
                                            {selectedIdea.full_research_report.competitive_landscape.gaps_and_opportunities.map((gap: string, i: number) => (
                                              <li key={i} className="text-green-600">• {gap}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Validation Tab */}
                      {activeTab === 'validation' && (
                        <div className="space-y-6">
                          {gatedSections.includes('validation_signals') ? (
                            <GatedContent onUpgrade={() => router.push('/upgrade')} />
                          ) : (
                            <>
                              <div>
                                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  Validation Signals
                                </h3>
                                <div className="space-y-3">
                                  {(selectedIdea.validation_signals || []).map((signal: any, i: number) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-xl">
                                      <div className="flex items-start justify-between">
                                        <div>
                                          <p className="font-bold">{signal.signal}</p>
                                          <p className="text-sm text-gray-500">{signal.source}</p>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                          signal.strength === 'Strong' ? 'bg-green-100 text-green-700' :
                                          signal.strength === 'Moderate' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-gray-100 text-gray-700'
                                        }`}>
                                          {signal.strength}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {selectedIdea.full_research_report?.risk_assessment && (
                                <div>
                                  <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    Risk Assessment
                                  </h3>
                                  <div className="bg-yellow-50 p-4 rounded-xl">
                                    <p className="mb-4">
                                      <strong>Overall Risk:</strong>{' '}
                                      <span className={`font-bold ${
                                        selectedIdea.full_research_report.risk_assessment.overall_risk_level === 'Low' ? 'text-green-600' :
                                        selectedIdea.full_research_report.risk_assessment.overall_risk_level === 'Medium' ? 'text-yellow-600' :
                                        'text-red-600'
                                      }`}>
                                        {selectedIdea.full_research_report.risk_assessment.overall_risk_level}
                                      </span>
                                    </p>
                                    {selectedIdea.full_research_report.risk_assessment.risks?.map((risk: any, i: number) => (
                                      <div key={i} className="mb-3 last:mb-0">
                                        <p className="font-medium">{risk.risk}</p>
                                        <p className="text-sm text-gray-600">Mitigation: {risk.mitigation}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {selectedIdea.full_research_report?.verdict && (
                                <div className={`p-4 rounded-xl ${
                                  selectedIdea.full_research_report.verdict.startsWith('GO') 
                                    ? 'bg-green-100 border-2 border-green-500' 
                                    : 'bg-yellow-100 border-2 border-yellow-500'
                                }`}>
                                  <h3 className="font-black text-lg mb-2">Verdict</h3>
                                  <p className="font-bold">{selectedIdea.full_research_report.verdict}</p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}

                      {/* Products Tab */}
                      {activeTab === 'products' && (
                        <div className="space-y-6">
                          {gatedSections.includes('product_ideas') ? (
                            <GatedContent onUpgrade={() => router.push('/upgrade')} />
                          ) : (
                            <>
                              <div>
                                <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                                  <Lightbulb className="w-5 h-5 text-uvz-orange" />
                                  Product Ideas
                                </h3>
                                <div className="space-y-4">
                                  {(selectedIdea.product_ideas || []).map((product: any, i: number) => (
                                    <div key={i} className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <span className="text-xs font-bold text-uvz-orange bg-orange-100 px-2 py-1 rounded-full">
                                            {product.type}
                                          </span>
                                          <h4 className="font-black text-lg mt-2">{product.name}</h4>
                                          <p className="text-gray-600">{product.tagline}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-uvz-orange">{product.price_point}</p>
                                          <p className="text-sm text-gray-500">{product.build_time}</p>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700 mb-3">{product.description}</p>
                                      {product.core_features && (
                                        <div className="flex flex-wrap gap-2">
                                          {product.core_features.map((feature: string, j: number) => (
                                            <span key={j} className="text-xs bg-gray-200 px-2 py-1 rounded">
                                              {feature}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                      <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-500">
                                        <strong>MVP Scope:</strong> {product.mvp_scope}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {selectedIdea.monetization_ideas && selectedIdea.monetization_ideas.length > 0 && (
                                <div>
                                  <h3 className="font-black text-lg mb-4">Monetization Strategies</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {selectedIdea.monetization_ideas.map((idea: any, i: number) => (
                                      <div key={i} className="bg-green-50 p-4 rounded-xl">
                                        <p className="font-bold">{idea.model}</p>
                                        <p className="text-sm text-gray-600">{idea.description}</p>
                                        <p className="text-sm text-green-600 font-bold mt-2">{idea.price_range}</p>
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

                    {/* CTA Footer */}
                    <div className="border-t-2 border-black p-6 bg-gray-50">
                      {isPro ? (
                        <Link
                          href={`/chat?idea=${selectedIdea.id}`}
                          className="w-full flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-6 py-4 border-3 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all"
                        >
                          <Sparkles className="w-5 h-5" />
                          Research This Idea in Chat
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      ) : (
                        <div className="text-center">
                          <Link
                            href="/upgrade"
                            className="inline-flex items-center justify-center gap-2 bg-uvz-orange text-white font-bold px-8 py-4 border-3 border-black rounded-xl shadow-brutal hover:-translate-y-1 transition-all"
                          >
                            <Lock className="w-5 h-5" />
                            Upgrade to Research This Idea
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                          <p className="text-sm text-gray-500 mt-3">
                            Get full access to validation, product ideas, and start researching in chat
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Sources */}
                    {selectedIdea.sources && selectedIdea.sources.length > 0 && !gatedSections.includes('sources') && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 mb-2 font-bold">Sources:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedIdea.sources.map((source: any, i: number) => (
                            <a
                              key={i}
                              href={source.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {source.title?.slice(0, 40)}...
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
    <div className="relative">
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
          <div className="bg-gray-100 p-4 rounded-xl">
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white border-4 border-black rounded-xl p-6 text-center shadow-brutal max-w-sm">
          <Lock className="w-10 h-10 text-uvz-orange mx-auto mb-3" />
          <h3 className="font-black text-lg mb-2">Pro Feature</h3>
          <p className="text-gray-600 text-sm mb-4">
            Upgrade to Pro to unlock full research reports, validation signals, and product ideas.
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
