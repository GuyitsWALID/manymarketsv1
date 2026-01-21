'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatSidebar from '@/components/chat/ChatSidebar';
import EnhancedSkillsModal, { EnhancedSkillsData } from '@/components/builder/EnhancedSkillsModal';
import ProductTypeBuilder from '@/components/builder/ProductTypeBuilder';
import { PRODUCT_TYPES, ProductTypeConfig, getRecommendedProductTypes } from '@/lib/product-types';
import { 
  ArrowLeft, 
  Loader2,
  Rocket,
  Crown,
  Lock,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  phase: string;
  created_at: string;
  last_message_at: string;
}

function CreateProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isPro, setIsPro] = useState<boolean | null>(null);
  
  // Flow state
  const [step, setStep] = useState<'skills' | 'building' | 'complete'>('skills');
  const [skillsData, setSkillsData] = useState<EnhancedSkillsData | null>(null);
  const [selectedProductType, setSelectedProductType] = useState<ProductTypeConfig | null>(null);
  const [productData, setProductData] = useState<Record<string, string>>({});
  const [finalPrompt, setFinalPrompt] = useState<string>('');
  const [savedProductId, setSavedProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefill builder when deep-linked from Daily Ideas: ?idea=<id>&productIndex=<i>
  useEffect(() => {
    const ideaParam = searchParams.get('idea');
    const productIndex = searchParams.get('productIndex');

    if (!ideaParam || isLoading) return;

    (async () => {
      try {
        const res = await fetch(`/api/daily-ideas/${ideaParam}`);
        if (!res.ok) return;
        const { idea } = await res.json();

        let product = null;
        if (productIndex) {
          const idx = parseInt(productIndex, 10);
          if (!isNaN(idx) && idea.product_ideas && idea.product_ideas[idx]) {
            product = idea.product_ideas[idx];
          }
        }

        if (!product) return;

        // Map product.type to a product type config if possible
        let matchedType: ProductTypeConfig | undefined;
        if (product.type) {
          const t = product.type.toLowerCase();
          matchedType = PRODUCT_TYPES.find(pt => pt.id.toLowerCase() === t || pt.name.toLowerCase().includes(t));
        }
        if (!matchedType) {
          // fallback to first recommended type or default
          const recommended = getRecommendedProductTypes([], 'Beginner');
          matchedType = recommended[0] || PRODUCT_TYPES[0];
        }

        // Prepare idea research summary
        const research = typeof idea.full_research_report === 'string' ? idea.full_research_report : JSON.stringify(idea.full_research_report, null, 2);

        // Prefill product data and include idea context for the builder
        const problemText = product.problem || idea.core_problem || (idea.full_research_report && (idea.full_research_report.core_problem || idea.full_research_report.problem)) || '';
        const solutionText = product.description || (idea.full_research_report && (idea.full_research_report.solution_overview || idea.full_research_report.solution)) || '';
        const targetText = product.target_users || idea.target_audience || (idea.full_research_report && (idea.full_research_report.target_audience || idea.full_research_report.targetUsers)) || '';

        setProductData({
          // Primary fields
          name: product.name || idea.name || `${idea.name} Product`,
          title: product.name || idea.name || '',
          tagline: product.tagline || '',
          description: `${product.description || ''}\n\nIdea Context: ${idea.one_liner || ''}\n\nResearch Summary:\n${research}`,

          // Key contextual fields requested by the user
          problem_statement: problemText,
          problem: problemText,
          core_problem: problemText,

          solution_overview: solutionText,
          solution: solutionText,

          // Target audience variants
          'target-audience': targetText,
          target_audience: targetText,
          targetUsers: targetText,
          target_users: targetText,

          // Other helpful fields
          price_point: product.price_point || '',
          core_features: (product.core_features && product.core_features.slice(0, 6).join(', ')) || '',
          sourceIdeaName: idea.name || '',
          sourceIdeaId: idea.id || '',
        });

        // Set a helpful default build prompt so the builder has direction immediately
        const defaultPrompt = `Build a ${product.name || matchedType?.name || 'product'} for the idea "${idea.name}". Context: ${idea.one_liner || ''}\n\nResearch Summary:\n${research}\n\nPlease provide: core features, monetization strategy, pricing recommendations, positioning, go-to-market plan, and a prioritized 30/60/90 day roadmap with actionable tasks.`;
        setFinalPrompt(defaultPrompt);

        setSelectedProductType(matchedType);
        setStep('building');
      } catch (e) {
        console.error('Failed to prefill builder from daily idea product:', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isLoading]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    // Check subscription
    try {
      const billingRes = await fetch('/api/billing');
      if (billingRes.ok) {
        const billingData = await billingRes.json();
        const plan = billingData.currentPlan || 'free';
        const hasPro = plan === 'pro' || plan === 'enterprise';
        setIsPro(hasPro);
        
        if (!hasPro) {
          router.push('/upgrade');
          return;
        }
      } else {
        setIsPro(false);
        router.push('/upgrade');
        return;
      }
    } catch {
      setIsPro(false);
      router.push('/upgrade');
      return;
    }

    // Load sessions for sidebar
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const { sessions: userSessions } = await response.json();
        setSessions(userSessions || []);
      }
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }

    setIsLoading(false);
  };

  const handleSkillsComplete = (data: EnhancedSkillsData) => {
    setSkillsData(data);
    
    // Find the selected product type config
    const productType = PRODUCT_TYPES.find(pt => pt.id === data.selectedProductType);
    if (productType) {
      setSelectedProductType(productType);
      setStep('building');
    }
  };

  const handleBuilderComplete = async (prompt: string) => {
    setFinalPrompt(prompt);
    setIsSaving(true);

    try {
      // Ensure we have a research session to attach the product to. Reuse the most recent session if available,
      // otherwise create a new one via /api/sessions.
      let sessionIdToUse = sessions?.[0]?.id;

      if (!sessionIdToUse) {
        const sessionRes = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: productData['name'] || 'Builder Session' }),
        });
        const sessionJson = await sessionRes.json();
        if (!sessionRes.ok || !sessionJson.session) {
          throw new Error(sessionJson?.error || 'Failed to create a new session');
        }
        sessionIdToUse = sessionJson.session.id;
        // Add to local sessions list so the UI can reflect it immediately
        setSessions(prev => sessionJson.session ? [sessionJson.session, ...(prev || [])] : prev);
      }

      // Save the product to database and include sessionId and productType fields expected by the API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdToUse,
          name: productData['name'] || productData['title'] || selectedProductType?.name || 'Untitled Product',
          productType: selectedProductType?.id || productData['product_type'] || 'other',
          tagline: productData['tagline'] || productData['description']?.substring(0, 100) || '',
          description: productData['description'] || '',
          status: 'building',
          notes: `Build Prompt:\n${prompt}`,
          raw_analysis: {
            skillsAssessment: skillsData,
            builderData: productData,
            buildPrompt: prompt,
          },
        }),
      });

      const responseJson = await response.json();
      if (!response.ok) {
        throw new Error(responseJson?.error || 'Failed to save product');
      }

      const { product } = responseJson;
      setSavedProductId(product.id);
      setStep('complete');
    } catch (error) {
      console.error('Error saving product:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to save product: ${message}`);
      // Keep the user on the build step so they can retry
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const createNewChat = () => {
    router.push('/chat');
  };

  if (isLoading || isPro === null) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <p className="font-bold text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center bg-white border-4 border-black rounded-2xl p-8 shadow-brutal max-w-md">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black mb-2">Pro Feature</h1>
          <p className="text-gray-600 mb-6">
            The Product Builder is a Pro feature. Upgrade to start building and selling your products.
          </p>
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
          >
            <Crown className="w-5 h-5" />
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const isMobile = !isDesktop;

  return (
    <div className="min-h-screen bg-uvz-cream">
      {/* Header */}
      <ChatHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        createNewChat={createNewChat}
        currentUser={currentUser}
        profileMenuOpen={profileMenuOpen}
        setProfileMenuOpen={setProfileMenuOpen}
        setIsLogoutOpen={setIsLogoutOpen}
      />

      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        onClose={() => setIsSidebarOpen(false)}
        createNewChat={createNewChat}
        isLogoutOpen={isLogoutOpen}
        setIsLogoutOpen={setIsLogoutOpen}
        handleLogout={handleLogout}
        sessions={sessions}
        currentSessionId={null}
      />

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ${isSidebarOpen && !isMobile ? 'ml-72' : ''}`}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/builder')}
              className="p-2 hover:bg-white rounded-lg border-2 border-transparent hover:border-black transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black">Create New Product</h1>
              <p className="text-gray-600 text-sm">
                {step === 'skills' && 'Tell us about your skills and choose your product type'}
                {step === 'building' && selectedProductType && `Building: ${selectedProductType.name}`}
                {step === 'complete' && 'Your product is ready!'}
              </p>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 'skills' ? 'bg-uvz-orange text-white' : 'bg-green-500 text-white'
            }`}>
              <span className="font-bold text-sm">1</span>
              <span className="text-sm">Skills & Type</span>
              {step !== 'skills' && <CheckCircle className="w-4 h-4" />}
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 'building' ? 'bg-uvz-orange text-white' : 
              step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <span className="font-bold text-sm">2</span>
              <span className="text-sm">Build</span>
              {step === 'complete' && <CheckCircle className="w-4 h-4" />}
            </div>
            <div className="w-8 h-0.5 bg-gray-300" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              step === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              <span className="font-bold text-sm">3</span>
              <span className="text-sm">Launch</span>
            </div>
          </div>

          {/* Step Content */}
          {step === 'skills' && (
            <div className="bg-white border-2 border-black rounded-xl p-6 shadow-brutal">
              <EnhancedSkillsModal
                isOpen={true}
                onClose={() => router.push('/builder')}
                onComplete={handleSkillsComplete}
                embedded={true}
              />
            </div>
          )}

          {step === 'building' && selectedProductType && (
            <ProductTypeBuilder
              productConfig={selectedProductType}
              productData={productData}
              onUpdateData={setProductData}
              onComplete={handleBuilderComplete}
              onBack={() => setStep('skills')}
            />
          )}

          {step === 'complete' && (
            <div className="bg-white border-2 border-black rounded-xl p-8 shadow-brutal text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-black mb-2">
                {isSaving ? 'Saving Your Product...' : 'Product Created Successfully!'}
              </h2>
              
              {isSaving ? (
                <div className="flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving your product...</span>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Your {selectedProductType?.name} has been created and saved. 
                    You can now continue building and add more content.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    {savedProductId && (
                      <Link
                        href={`/builder?product=${savedProductId}`}
                        className="flex items-center gap-2 px-6 py-3 bg-uvz-orange text-white font-bold border-2 border-black rounded-xl shadow-brutal hover:-translate-y-0.5 transition-all"
                      >
                        <Sparkles className="w-5 h-5" />
                        Continue Building
                      </Link>
                    )}
                    <Link
                      href="/builder"
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black font-bold border-2 border-black rounded-xl hover:bg-gray-50 transition-all"
                    >
                      View All Products
                    </Link>
                  </div>

                  {/* Show the final prompt */}
                  {finalPrompt && (
                    <div className="mt-8 text-left">
                      <div className="flex items-center gap-2 mb-3">
                        <Rocket className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold">Your Build Prompt</h3>
                      </div>
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {finalPrompt}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CreateProductPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-uvz-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-uvz-orange mx-auto mb-4" />
          <p className="font-bold text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CreateProductContent />
    </Suspense>
  );
}
